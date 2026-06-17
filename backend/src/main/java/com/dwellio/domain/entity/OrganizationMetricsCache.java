package com.dwellio.domain.entity;

import com.dwellio.domain.enums.AccommodationMode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "organization_metrics_cache")
@Getter
@Setter
public class OrganizationMetricsCache {

    @Id
    @Column(name = "organization_id", columnDefinition = "uuid")
    private UUID organizationId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    @Column(name = "accommodation_mode", nullable = false, length = 20)
    private AccommodationMode accommodationMode;

    @Column(name = "active_resident_count", nullable = false)
    private int activeResidentCount;

    @Column(name = "avg_rating", precision = 3, scale = 2)
    private BigDecimal avgRating;

    @Column(name = "review_count", nullable = false)
    private int reviewCount;

    @Column(name = "avg_resolution_days", precision = 6, scale = 2)
    private BigDecimal avgResolutionDays;

    @Column(name = "resolution_rate", precision = 5, scale = 2)
    private BigDecimal resolutionRate;

    @Column(name = "open_complaint_count", nullable = false)
    private int openComplaintCount;

    @Column(name = "avg_first_response_hours", precision = 8, scale = 2)
    private BigDecimal avgFirstResponseHours;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "complaint_category_counts", nullable = false)
    private Map<String, Integer> complaintCategoryCounts = new HashMap<>();

    @Column(name = "satisfaction_score", precision = 5, scale = 2)
    private BigDecimal satisfactionScore;

    @Column(name = "search_rank_score", precision = 8, scale = 4)
    private BigDecimal searchRankScore;

    @Column(name = "total_rooms")
    private Integer totalRooms;

    @Column(name = "vacant_rooms")
    private Integer vacantRooms;

    @Column(name = "partial_rooms")
    private Integer partialRooms;

    @Column(name = "occupied_rooms")
    private Integer occupiedRooms;

    @Column(name = "blocked_rooms")
    private Integer blockedRooms;

    @Column(name = "total_beds")
    private Integer totalBeds;

    @Column(name = "available_beds")
    private Integer availableBeds;

    @Column(name = "occupied_beds")
    private Integer occupiedBeds;

    @Column(name = "blocked_beds")
    private Integer blockedBeds;

    @Column(name = "total_units")
    private Integer totalUnits;

    @Column(name = "available_units")
    private Integer availableUnits;

    @Column(name = "occupied_units")
    private Integer occupiedUnits;

    @Column(name = "blocked_units")
    private Integer blockedUnits;

    @Column(name = "expected_revenue_month", precision = 14, scale = 2)
    private BigDecimal expectedRevenueMonth;

    @Column(name = "collected_revenue_month", precision = 14, scale = 2)
    private BigDecimal collectedRevenueMonth;

    @Column(name = "outstanding_revenue_month", precision = 14, scale = 2)
    private BigDecimal outstandingRevenueMonth;

    @Column(name = "collection_rate", precision = 5, scale = 2)
    private BigDecimal collectionRate;

    @Column(name = "defaulters_count", nullable = false)
    private int defaultersCount;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "revenue_trend_json", nullable = false)
    private List<Map<String, Object>> revenueTrendJson = new ArrayList<>();

    @Column(name = "forecast_revenue_next_month", precision = 14, scale = 2)
    private BigDecimal forecastRevenueNextMonth;

    @Column(name = "move_ins_month", nullable = false)
    private int moveInsMonth;

    @Column(name = "move_outs_month", nullable = false)
    private int moveOutsMonth;

    @Column(name = "avg_stay_days", precision = 8, scale = 2)
    private BigDecimal avgStayDays;

    @Column(name = "turnover_rate", precision = 5, scale = 2)
    private BigDecimal turnoverRate;

    @Column(name = "pending_payments_count", nullable = false)
    private int pendingPaymentsCount;

    @Column(name = "sla_first_response_hours", nullable = false, precision = 6, scale = 2)
    private BigDecimal slaFirstResponseHours = BigDecimal.valueOf(24);

    @Column(name = "sla_resolution_hours", nullable = false, precision = 8, scale = 2)
    private BigDecimal slaResolutionHours = BigDecimal.valueOf(72);

    @Column(name = "sla_compliance_rate", precision = 5, scale = 2)
    private BigDecimal slaComplianceRate;

    @Column(name = "sla_violations_count", nullable = false)
    private int slaViolationsCount;

    @Column(name = "reopened_complaints_count", nullable = false)
    private int reopenedComplaintsCount;

    @Column(name = "avg_breakfast_rating", precision = 3, scale = 2)
    private BigDecimal avgBreakfastRating;

    @Column(name = "avg_lunch_rating", precision = 3, scale = 2)
    private BigDecimal avgLunchRating;

    @Column(name = "avg_dinner_rating", precision = 3, scale = 2)
    private BigDecimal avgDinnerRating;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "meal_ratings_trend_json", nullable = false)
    private List<Map<String, Object>> mealRatingsTrendJson = new ArrayList<>();

    @Column(name = "refreshed_at", nullable = false)
    private Instant refreshedAt;
}
