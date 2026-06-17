package com.dwellio.metrics.projection;

import com.dwellio.metrics.projection.snapshot.BedAvailabilitySnapshot;
import com.dwellio.metrics.projection.snapshot.ComplaintMetricsSnapshot;
import com.dwellio.metrics.projection.snapshot.MealRatingsSnapshot;
import com.dwellio.metrics.projection.snapshot.OccupancyLifecycleSnapshot;
import com.dwellio.metrics.projection.snapshot.ReviewMetricsSnapshot;
import com.dwellio.metrics.projection.snapshot.RoomAvailabilitySnapshot;
import com.dwellio.metrics.projection.snapshot.SlaMetricsSnapshot;
import com.dwellio.metrics.projection.snapshot.UnitAvailabilitySnapshot;
import com.dwellio.metrics.projection.RevenueMetricsSnapshot;
import com.dwellio.domain.enums.ComplaintCategory;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class MetricsAggregateRepository {

    private final EntityManager entityManager;

    public BedAvailabilitySnapshot aggregateBeds(UUID organizationId) {
        Object[] row = (Object[]) entityManager.createNativeQuery("""
                        SELECT
                            COUNT(*)::int,
                            COUNT(*) FILTER (
                                WHERE b.is_blocked OR b.status = 'BLOCKED'
                            )::int,
                            COUNT(*) FILTER (
                                WHERE NOT (b.is_blocked OR b.status = 'BLOCKED')
                                  AND o.id IS NOT NULL
                            )::int,
                            COUNT(*) FILTER (
                                WHERE NOT (b.is_blocked OR b.status = 'BLOCKED')
                                  AND o.id IS NULL
                            )::int
                        FROM beds b
                        LEFT JOIN occupancies o
                               ON o.bed_id = b.id
                              AND o.is_current = TRUE
                        WHERE b.organization_id = :organizationId
                          AND b.deleted_at IS NULL
                        """)
                .setParameter("organizationId", organizationId)
                .getSingleResult();
        return new BedAvailabilitySnapshot(
                toInt(row[0]),
                toInt(row[1]),
                toInt(row[2]),
                toInt(row[3])
        );
    }

    public RoomAvailabilitySnapshot aggregateRooms(UUID organizationId) {
        Object[] row = (Object[]) entityManager.createNativeQuery("""
                        SELECT
                            COUNT(*)::int,
                            COUNT(*) FILTER (
                                WHERE NOT (s.is_blocked OR s.status = 'BLOCKED')
                                  AND s.status = 'AVAILABLE'
                            )::int,
                            COUNT(*) FILTER (
                                WHERE NOT (s.is_blocked OR s.status = 'BLOCKED')
                                  AND s.status = 'PARTIALLY_OCCUPIED'
                            )::int,
                            COUNT(*) FILTER (
                                WHERE NOT (s.is_blocked OR s.status = 'BLOCKED')
                                  AND s.status = 'OCCUPIED'
                            )::int,
                            COUNT(*) FILTER (
                                WHERE s.is_blocked OR s.status = 'BLOCKED'
                            )::int
                        FROM spaces s
                        WHERE s.organization_id = :organizationId
                          AND s.deleted_at IS NULL
                          AND s.space_type = 'ROOM'
                        """)
                .setParameter("organizationId", organizationId)
                .getSingleResult();
        return new RoomAvailabilitySnapshot(
                toInt(row[0]),
                toInt(row[1]),
                toInt(row[2]),
                toInt(row[3]),
                toInt(row[4])
        );
    }

    public UnitAvailabilitySnapshot aggregateUnits(UUID organizationId) {
        Object[] row = (Object[]) entityManager.createNativeQuery("""
                        SELECT
                            COUNT(*)::int,
                            COUNT(*) FILTER (
                                WHERE s.is_blocked OR s.status = 'BLOCKED'
                            )::int,
                            COUNT(*) FILTER (
                                WHERE NOT (s.is_blocked OR s.status = 'BLOCKED')
                                  AND o.id IS NOT NULL
                            )::int,
                            COUNT(*) FILTER (
                                WHERE NOT (s.is_blocked OR s.status = 'BLOCKED')
                                  AND o.id IS NULL
                            )::int
                        FROM spaces s
                        LEFT JOIN occupancies o
                               ON o.unit_space_id = s.id
                              AND o.is_current = TRUE
                        WHERE s.organization_id = :organizationId
                          AND s.deleted_at IS NULL
                          AND s.space_type = 'UNIT'
                        """)
                .setParameter("organizationId", organizationId)
                .getSingleResult();
        return new UnitAvailabilitySnapshot(
                toInt(row[0]),
                toInt(row[1]),
                toInt(row[2]),
                toInt(row[3])
        );
    }

    public int countActiveResidents(UUID organizationId) {
        Object result = entityManager.createNativeQuery("""
                        SELECT COUNT(*)::int
                        FROM memberships m
                        INNER JOIN roles r ON r.id = m.role_id
                        WHERE m.organization_id = :organizationId
                          AND m.status = 'ACTIVE'
                          AND m.deleted_at IS NULL
                          AND r.name = 'RESIDENT'
                          AND r.deleted_at IS NULL
                        """)
                .setParameter("organizationId", organizationId)
                .getSingleResult();
        return toInt(result);
    }

    public ComplaintMetricsSnapshot aggregateComplaints(UUID organizationId) {
        Object[] row = (Object[]) entityManager.createNativeQuery("""
                        SELECT
                            COUNT(*) FILTER (
                                WHERE status IN ('OPEN', 'IN_PROGRESS', 'REOPENED')
                            )::int,
                            AVG(
                                EXTRACT(EPOCH FROM (resolved_at - created_at)) / 86400.0
                            ) FILTER (WHERE resolved_at IS NOT NULL),
                            CASE
                                WHEN COUNT(*) = 0 THEN NULL
                                ELSE (
                                    COUNT(*) FILTER (WHERE status IN ('RESOLVED', 'CLOSED'))::numeric
                                    / COUNT(*)::numeric
                                    * 100
                                )
                            END,
                            AVG(
                                EXTRACT(EPOCH FROM (first_response_at - created_at)) / 3600.0
                            ) FILTER (WHERE first_response_at IS NOT NULL)
                        FROM complaints
                        WHERE organization_id = :organizationId
                          AND deleted_at IS NULL
                        """)
                .setParameter("organizationId", organizationId)
                .getSingleResult();

        return new ComplaintMetricsSnapshot(
                toInt(row[0]),
                toBigDecimal(row[1], 2),
                toBigDecimal(row[2], 2),
                toBigDecimal(row[3], 2)
        );
    }

    public Map<String, Integer> aggregateComplaintCountsByCategory(UUID organizationId) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                        SELECT category, COUNT(*)::int
                        FROM complaints
                        WHERE organization_id = :organizationId
                          AND deleted_at IS NULL
                        GROUP BY category
                        """)
                .setParameter("organizationId", organizationId)
                .getResultList();

        Map<String, Integer> counts = new LinkedHashMap<>();
        for (ComplaintCategory category : ComplaintCategory.values()) {
            counts.put(category.name(), 0);
        }
        for (Object[] row : rows) {
            counts.put((String) row[0], toInt(row[1]));
        }
        return counts;
    }

    public ReviewMetricsSnapshot aggregateReviews(UUID organizationId) {
        Object[] row = (Object[]) entityManager.createNativeQuery("""
                        SELECT
                            AVG(rating::numeric),
                            COUNT(*)::int
                        FROM reviews
                        WHERE organization_id = :organizationId
                          AND deleted_at IS NULL
                        """)
                .setParameter("organizationId", organizationId)
                .getSingleResult();

        return new ReviewMetricsSnapshot(
                toBigDecimal(row[0], 2),
                toInt(row[1])
        );
    }

    public RevenueMetricsSnapshot aggregateRevenue(UUID organizationId, LocalDate today) {
        YearMonth currentMonth = YearMonth.from(today);
        LocalDate monthStart = currentMonth.atDay(1);
        LocalDate monthEnd = currentMonth.atEndOfMonth();

        Object[] currentRow = (Object[]) entityManager.createNativeQuery("""
                        SELECT
                            COALESCE(SUM(amount), 0),
                            COALESCE(SUM(amount_paid), 0),
                            COALESCE(SUM(amount - amount_paid), 0)
                        FROM payments
                        WHERE organization_id = :organizationId
                          AND deleted_at IS NULL
                          AND billing_month >= :monthStart
                          AND billing_month <= :monthEnd
                        """)
                .setParameter("organizationId", organizationId)
                .setParameter("monthStart", monthStart)
                .setParameter("monthEnd", monthEnd)
                .getSingleResult();

        BigDecimal expected = toBigDecimal(currentRow[0], 2);
        BigDecimal collected = toBigDecimal(currentRow[1], 2);
        BigDecimal outstanding = toBigDecimal(currentRow[2], 2);
        BigDecimal collectionRate = expected.signum() == 0
                ? BigDecimal.ZERO
                : collected.multiply(BigDecimal.valueOf(100))
                        .divide(expected, 2, RoundingMode.HALF_UP);

        int defaulters = toInt(entityManager.createNativeQuery("""
                        SELECT COUNT(DISTINCT membership_id)::int
                        FROM payments
                        WHERE organization_id = :organizationId
                          AND deleted_at IS NULL
                          AND status IN ('OVERDUE', 'PARTIAL', 'PENDING')
                          AND due_date < :today
                          AND amount > amount_paid
                        """)
                .setParameter("organizationId", organizationId)
                .setParameter("today", today)
                .getSingleResult());

        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth month = currentMonth.minusMonths(i);
            LocalDate start = month.atDay(1);
            LocalDate end = month.atEndOfMonth();
            Object[] row = (Object[]) entityManager.createNativeQuery("""
                            SELECT
                                COALESCE(SUM(amount), 0),
                                COALESCE(SUM(amount_paid), 0)
                            FROM payments
                            WHERE organization_id = :organizationId
                              AND deleted_at IS NULL
                              AND billing_month >= :monthStart
                              AND billing_month <= :monthEnd
                            """)
                    .setParameter("organizationId", organizationId)
                    .setParameter("monthStart", start)
                    .setParameter("monthEnd", end)
                    .getSingleResult();
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", month.toString());
            point.put("expected", toBigDecimal(row[0], 2));
            point.put("collected", toBigDecimal(row[1], 2));
            trend.add(point);
        }

        Object forecastResult = entityManager.createNativeQuery("""
                        SELECT COALESCE(SUM(
                            COALESCE(o.monthly_rent, org.default_monthly_rent, 0)
                        ), 0)
                        FROM occupancies o
                        INNER JOIN organizations org ON org.id = o.organization_id
                        WHERE o.organization_id = :organizationId
                          AND o.is_current = TRUE
                        """)
                .setParameter("organizationId", organizationId)
                .getSingleResult();

        return new RevenueMetricsSnapshot(
                expected,
                collected,
                outstanding,
                collectionRate,
                defaulters,
                trend,
                toBigDecimal(forecastResult, 2)
        );
    }

    public OccupancyLifecycleSnapshot aggregateOccupancyLifecycle(
            UUID organizationId,
            LocalDate today,
            int activeResidents
    ) {
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        int moveIns = toInt(entityManager.createNativeQuery("""
                        SELECT COUNT(*)::int
                        FROM occupancies
                        WHERE organization_id = :organizationId
                          AND move_in_date >= :monthStart
                          AND move_in_date <= :monthEnd
                        """)
                .setParameter("organizationId", organizationId)
                .setParameter("monthStart", monthStart)
                .setParameter("monthEnd", monthEnd)
                .getSingleResult());

        int moveOuts = toInt(entityManager.createNativeQuery("""
                        SELECT COUNT(*)::int
                        FROM occupancies
                        WHERE organization_id = :organizationId
                          AND move_out_date IS NOT NULL
                          AND move_out_date >= :monthStart
                          AND move_out_date <= :monthEnd
                        """)
                .setParameter("organizationId", organizationId)
                .setParameter("monthStart", monthStart)
                .setParameter("monthEnd", monthEnd)
                .getSingleResult());

        BigDecimal avgStayDays = toBigDecimal(entityManager.createNativeQuery("""
                        SELECT AVG(
                            EXTRACT(EPOCH FROM (
                                CAST(COALESCE(move_out_date, :today) AS TIMESTAMP)
                                - CAST(move_in_date AS TIMESTAMP)
                            )) / 86400.0
                        )
                        FROM occupancies
                        WHERE organization_id = :organizationId
                        """)
                .setParameter("organizationId", organizationId)
                .setParameter("today", today)
                .getSingleResult(), 2);

        BigDecimal turnoverRate = null;
        if (activeResidents > 0) {
            turnoverRate = BigDecimal.valueOf(moveOuts)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(activeResidents), 2, RoundingMode.HALF_UP);
        }

        return new OccupancyLifecycleSnapshot(moveIns, moveOuts, avgStayDays, turnoverRate);
    }

    public int countPendingPayments(UUID organizationId) {
        return toInt(entityManager.createNativeQuery("""
                        SELECT COUNT(*)::int
                        FROM payments
                        WHERE organization_id = :organizationId
                          AND deleted_at IS NULL
                          AND status IN ('PENDING', 'OVERDUE', 'PARTIAL')
                          AND amount > amount_paid
                        """)
                .setParameter("organizationId", organizationId)
                .getSingleResult());
    }

    public SlaMetricsSnapshot aggregateSlaMetrics(
            UUID organizationId,
            BigDecimal firstResponseHours,
            BigDecimal resolutionHours,
            Instant now
    ) {
        double firstResponseLimit = firstResponseHours.doubleValue();
        double resolutionLimit = resolutionHours.doubleValue();

        Object[] row = (Object[]) entityManager.createNativeQuery("""
                        SELECT
                            COUNT(*)::int,
                            COUNT(*) FILTER (
                                WHERE (
                                    (
                                        first_response_at IS NULL
                                        AND status IN ('OPEN', 'IN_PROGRESS', 'REOPENED')
                                        AND EXTRACT(EPOCH FROM (CAST(:now AS TIMESTAMP) - created_at)) / 3600.0
                                            > :firstResponseHours
                                    )
                                    OR (
                                        first_response_at IS NOT NULL
                                        AND EXTRACT(EPOCH FROM (first_response_at - created_at)) / 3600.0
                                            > :firstResponseHours
                                    )
                                    OR (
                                        resolved_at IS NULL
                                        AND status IN ('OPEN', 'IN_PROGRESS', 'REOPENED')
                                        AND EXTRACT(EPOCH FROM (CAST(:now AS TIMESTAMP) - created_at)) / 3600.0
                                            > :resolutionHours
                                    )
                                    OR (
                                        resolved_at IS NOT NULL
                                        AND EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0
                                            > :resolutionHours
                                    )
                                )
                            )::int
                        FROM complaints
                        WHERE organization_id = :organizationId
                          AND deleted_at IS NULL
                        """)
                .setParameter("organizationId", organizationId)
                .setParameter("now", now)
                .setParameter("firstResponseHours", firstResponseLimit)
                .setParameter("resolutionHours", resolutionLimit)
                .getSingleResult();

        int total = toInt(row[0]);
        int violations = toInt(row[1]);
        BigDecimal complianceRate = total == 0
                ? null
                : BigDecimal.valueOf(total - violations)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);

        int reopenedFromEvents = toInt(entityManager.createNativeQuery("""
                        SELECT COUNT(*)::int
                        FROM activity_events
                        WHERE organization_id = :organizationId
                          AND event_type = 'COMPLAINT_REOPENED'
                        """)
                .setParameter("organizationId", organizationId)
                .getSingleResult());

        int reopenedOpen = toInt(entityManager.createNativeQuery("""
                        SELECT COUNT(*)::int
                        FROM complaints
                        WHERE organization_id = :organizationId
                          AND deleted_at IS NULL
                          AND status = 'REOPENED'
                        """)
                .setParameter("organizationId", organizationId)
                .getSingleResult());

        return new SlaMetricsSnapshot(
                complianceRate,
                violations,
                Math.max(reopenedFromEvents, reopenedOpen)
        );
    }

    public MealRatingsSnapshot aggregateMealRatings(UUID organizationId) {
        if (!mealFeedbackTableExists()) {
            return new MealRatingsSnapshot(null, null, null, List.of());
        }

        Object[] averages = (Object[]) entityManager.createNativeQuery("""
                        SELECT
                            AVG(rating::numeric) FILTER (WHERE meal_type = 'BREAKFAST'),
                            AVG(rating::numeric) FILTER (WHERE meal_type = 'LUNCH'),
                            AVG(rating::numeric) FILTER (WHERE meal_type = 'DINNER')
                        FROM meal_feedback
                        WHERE organization_id = :organizationId
                          AND deleted_at IS NULL
                        """)
                .setParameter("organizationId", organizationId)
                .getSingleResult();

        List<Map<String, Object>> trend = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 5; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            Object avg = entityManager.createNativeQuery("""
                            SELECT AVG(rating::numeric)
                            FROM meal_feedback
                            WHERE organization_id = :organizationId
                              AND deleted_at IS NULL
                              AND feedback_date = :feedbackDate
                            """)
                    .setParameter("organizationId", organizationId)
                    .setParameter("feedbackDate", day)
                    .getSingleResult();
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", day.toString());
            point.put("avgRating", toBigDecimal(avg, 2));
            trend.add(point);
        }

        return new MealRatingsSnapshot(
                toBigDecimal(averages[0], 2),
                toBigDecimal(averages[1], 2),
                toBigDecimal(averages[2], 2),
                trend
        );
    }

    private boolean mealFeedbackTableExists() {
        Object result = entityManager.createNativeQuery("""
                        SELECT COUNT(*) > 0
                        FROM information_schema.tables
                        WHERE table_name = 'meal_feedback'
                        """)
                .getSingleResult();
        return Boolean.TRUE.equals(result) || (result instanceof Number number && number.intValue() > 0);
    }

    private static int toInt(Object value) {
        return ((Number) value).intValue();
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
