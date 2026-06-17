package com.dwellio.revenue.service;

import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.OrganizationMetricsCache;
import com.dwellio.metrics.service.MetricsProjectionService;
import com.dwellio.revenue.dto.DefaulterResponse;
import com.dwellio.revenue.dto.RevenueSummaryResponse;
import jakarta.persistence.EntityManager;
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
public class RevenueService {

    private final MetricsProjectionService metricsProjectionService;
    private final AuthorizationService authorizationService;
    private final EntityManager entityManager;
    private final Clock clock;

    @Transactional(readOnly = true)
    public RevenueSummaryResponse getSummary(UUID organizationId) {
        authorizationService.requirePermission(organizationId, "payment:read");
        OrganizationMetricsCache cache = metricsProjectionService.getCache(organizationId);
        return new RevenueSummaryResponse(
                cache.getExpectedRevenueMonth(),
                cache.getCollectedRevenueMonth(),
                cache.getOutstandingRevenueMonth(),
                cache.getCollectionRate(),
                cache.getDefaultersCount(),
                cache.getRevenueTrendJson(),
                cache.getForecastRevenueNextMonth()
        );
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<DefaulterResponse> listDefaulters(UUID organizationId) {
        authorizationService.requirePermission(organizationId, "payment:read");
        LocalDate today = LocalDate.now(clock);

        List<Object[]> rows = entityManager.createNativeQuery("""
                        SELECT
                            m.id,
                            u.full_name,
                            u.email,
                            COALESCE(SUM(p.amount - p.amount_paid), 0),
                            COUNT(p.id)::int,
                            MIN(p.due_date)
                        FROM payments p
                        INNER JOIN memberships m ON m.id = p.membership_id
                        INNER JOIN users u ON u.id = m.user_id
                        WHERE p.organization_id = :organizationId
                          AND p.deleted_at IS NULL
                          AND p.status IN ('OVERDUE', 'PARTIAL', 'PENDING')
                          AND p.due_date < :today
                          AND p.amount > p.amount_paid
                        GROUP BY m.id, u.full_name, u.email
                        ORDER BY MIN(p.due_date), u.full_name
                        """)
                .setParameter("organizationId", organizationId)
                .setParameter("today", today)
                .getResultList();

        List<DefaulterResponse> defaulters = new ArrayList<>();
        for (Object[] row : rows) {
            defaulters.add(new DefaulterResponse(
                    (UUID) row[0],
                    (String) row[1],
                    (String) row[2],
                    toBigDecimal(row[3]),
                    ((Number) row[4]).intValue(),
                    row[5] != null ? toLocalDate(row[5]) : null
            ));
        }
        return defaulters;
    }

    @Transactional
    public RevenueSummaryResponse refresh(UUID organizationId) {
        authorizationService.requirePermission(organizationId, "payment:manage");
        OrganizationMetricsCache cache = metricsProjectionService.refreshRevenueMetrics(organizationId);
        return new RevenueSummaryResponse(
                cache.getExpectedRevenueMonth(),
                cache.getCollectedRevenueMonth(),
                cache.getOutstandingRevenueMonth(),
                cache.getCollectionRate(),
                cache.getDefaultersCount(),
                cache.getRevenueTrendJson(),
                cache.getForecastRevenueNextMonth()
        );
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(((Number) value).doubleValue()).setScale(2, RoundingMode.HALF_UP);
    }

    private static LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        if (value instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        return LocalDate.parse(value.toString());
    }
}
