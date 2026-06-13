package com.dwellio.metrics.projection;

import com.dwellio.metrics.projection.snapshot.BedAvailabilitySnapshot;
import com.dwellio.metrics.projection.snapshot.ComplaintMetricsSnapshot;
import com.dwellio.metrics.projection.snapshot.ReviewMetricsSnapshot;
import com.dwellio.metrics.projection.snapshot.RoomAvailabilitySnapshot;
import com.dwellio.metrics.projection.snapshot.UnitAvailabilitySnapshot;
import com.dwellio.domain.enums.ComplaintCategory;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.math.RoundingMode;
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
