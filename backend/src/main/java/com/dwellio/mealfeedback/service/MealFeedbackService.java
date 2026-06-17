package com.dwellio.mealfeedback.service;

import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.common.security.MembershipContext;
import com.dwellio.domain.entity.MealFeedback;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.enums.MealType;
import com.dwellio.foodmenu.FoodMenuOrgSupport;
import com.dwellio.mealfeedback.dto.MealFeedbackResponse;
import com.dwellio.mealfeedback.dto.MealFeedbackSummaryResponse;
import com.dwellio.mealfeedback.dto.MealRatingRankItem;
import com.dwellio.mealfeedback.dto.UpsertMealFeedbackRequest;
import com.dwellio.mealfeedback.repository.MealFeedbackRepository;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.metrics.projection.MetricsAggregateRepository;
import com.dwellio.metrics.projection.snapshot.MealRatingsSnapshot;
import com.dwellio.metrics.service.MetricsProjectionService;
import com.dwellio.organization.service.OrganizationService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MealFeedbackService {

    @PersistenceContext
    private EntityManager entityManager;

    private final MealFeedbackRepository mealFeedbackRepository;
    private final MembershipRepository membershipRepository;
    private final OrganizationService organizationService;
    private final AuthorizationService authorizationService;
    private final MetricsAggregateRepository metricsAggregateRepository;
    private final MetricsProjectionService metricsProjectionService;
    private final Clock clock;

    @Transactional
    public MealFeedbackResponse upsert(UUID organizationId, UpsertMealFeedbackRequest request) {
        MembershipContext context = authorizationService.requireMembership(organizationId);
        Organization organization = FoodMenuOrgSupport.requireFoodMenuOrg(
                organizationService.findActiveOrganization(organizationId)
        );
        Membership membership = membershipRepository.findActiveByIdAndOrganizationId(
                        context.getMembershipId(),
                        organizationId
                )
                .orElseThrow(() -> new BadRequestException("Active membership required"));

        LocalDate feedbackDate = request.feedbackDate() != null ? request.feedbackDate() : LocalDate.now(clock);
        validateFeedbackDate(feedbackDate);

        MealFeedback feedback = mealFeedbackRepository
                .findActiveByOrganizationIdAndMembershipIdAndFeedbackDateAndMealType(
                        organizationId,
                        membership.getId(),
                        feedbackDate,
                        request.mealType()
                )
                .orElseGet(() -> {
                    MealFeedback created = new MealFeedback();
                    created.setId(UUID.randomUUID());
                    created.setOrganization(organization);
                    created.setMembership(membership);
                    created.setFeedbackDate(feedbackDate);
                    created.setMealType(request.mealType());
                    return created;
                });

        feedback.setRating(request.rating());
        feedback.setComment(request.comment() != null ? request.comment().trim() : null);
        feedback = mealFeedbackRepository.save(feedback);

        metricsProjectionService.refreshMealMetrics(organizationId);
        return MealFeedbackResponse.from(feedback);
    }

    @Transactional(readOnly = true)
    public List<MealFeedbackResponse> listMine(UUID organizationId, LocalDate feedbackDate) {
        MembershipContext context = authorizationService.requireMembership(organizationId);
        FoodMenuOrgSupport.requireFoodMenuOrg(organizationService.findActiveOrganization(organizationId));

        LocalDate date = feedbackDate != null ? feedbackDate : LocalDate.now(clock);
        return mealFeedbackRepository.findAllByOrganizationIdAndMembershipIdAndFeedbackDate(
                        organizationId,
                        context.getMembershipId(),
                        date
                ).stream()
                .map(MealFeedbackResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MealFeedbackSummaryResponse getSummary(UUID organizationId) {
        FoodMenuOrgSupport.requireFoodMenuOrg(organizationService.findActiveOrganization(organizationId));

        MealRatingsSnapshot snapshot = metricsAggregateRepository.aggregateMealRatings(organizationId);
        LocalDate today = LocalDate.now(clock);

        BigDecimal weeklyAvg = averageSince(organizationId, today.minusDays(6));
        BigDecimal monthlyAvg = averageSince(organizationId, today.minusDays(29));
        int total = countSince(organizationId, null);

        return new MealFeedbackSummaryResponse(
                snapshot.avgBreakfastRating(),
                snapshot.avgLunchRating(),
                snapshot.avgDinnerRating(),
                weeklyAvg,
                monthlyAvg,
                total,
                snapshot.trend(),
                rankMeals(organizationId, today.minusDays(29), true),
                rankMeals(organizationId, today.minusDays(29), false)
        );
    }

    private void validateFeedbackDate(LocalDate feedbackDate) {
        LocalDate today = LocalDate.now(clock);
        if (feedbackDate.isAfter(today)) {
            throw new BadRequestException("Meal feedback cannot be submitted for a future date");
        }
    }

    private BigDecimal averageSince(UUID organizationId, LocalDate since) {
        Object avg = entityManager.createNativeQuery("""
                        SELECT AVG(rating::numeric)
                        FROM meal_feedback
                        WHERE organization_id = :organizationId
                          AND deleted_at IS NULL
                          AND feedback_date >= :since
                        """)
                .setParameter("organizationId", organizationId)
                .setParameter("since", since)
                .getSingleResult();
        return toBigDecimal(avg, 2);
    }

    private int countSince(UUID organizationId, LocalDate since) {
        String sql = since == null
                ? """
                SELECT COUNT(*)::int
                FROM meal_feedback
                WHERE organization_id = :organizationId
                  AND deleted_at IS NULL
                """
                : """
                SELECT COUNT(*)::int
                FROM meal_feedback
                WHERE organization_id = :organizationId
                  AND deleted_at IS NULL
                  AND feedback_date >= :since
                """;
        var query = entityManager.createNativeQuery(sql).setParameter("organizationId", organizationId);
        if (since != null) {
            query.setParameter("since", since);
        }
        return ((Number) query.getSingleResult()).intValue();
    }

    @SuppressWarnings("unchecked")
    private List<MealRatingRankItem> rankMeals(UUID organizationId, LocalDate since, boolean best) {
        List<Object[]> rows = entityManager.createNativeQuery("""
                        SELECT meal_type, feedback_date, AVG(rating::numeric), COUNT(*)::int
                        FROM meal_feedback
                        WHERE organization_id = :organizationId
                          AND deleted_at IS NULL
                          AND feedback_date >= :since
                        GROUP BY meal_type, feedback_date
                        HAVING COUNT(*) >= 1
                        ORDER BY AVG(rating::numeric) %s, COUNT(*) DESC
                        LIMIT 5
                        """.formatted(best ? "DESC" : "ASC"))
                .setParameter("organizationId", organizationId)
                .setParameter("since", since)
                .getResultList();

        List<MealRatingRankItem> items = new ArrayList<>();
        for (Object[] row : rows) {
            LocalDate date = row[1] instanceof java.sql.Date sqlDate
                    ? sqlDate.toLocalDate()
                    : LocalDate.parse(row[1].toString());
            items.add(new MealRatingRankItem(
                    MealType.valueOf(row[0].toString()),
                    date,
                    toBigDecimal(row[2], 2),
                    ((Number) row[3]).intValue()
            ));
        }
        return items;
    }

    private static BigDecimal toBigDecimal(Object value, int scale) {
        if (value == null) {
            return null;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal.setScale(scale, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(((Number) value).doubleValue()).setScale(scale, RoundingMode.HALF_UP);
    }
}
