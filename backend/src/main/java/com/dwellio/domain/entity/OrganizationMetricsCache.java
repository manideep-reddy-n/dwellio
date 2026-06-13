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
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

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

    @Column(name = "refreshed_at", nullable = false)
    private Instant refreshedAt;
}
