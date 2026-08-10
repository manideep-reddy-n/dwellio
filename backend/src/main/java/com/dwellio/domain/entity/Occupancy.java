package com.dwellio.domain.entity;

import com.dwellio.common.entity.BaseEntity;
import com.dwellio.domain.enums.OccupancyClassification;
import com.dwellio.domain.enums.OccupancyTarget;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

import jakarta.persistence.Index;

@Entity
@Table(name = "occupancies", indexes = {
        @Index(name = "idx_occupancies_org_id", columnList = "organization_id"),
        @Index(name = "idx_occupancies_membership_id", columnList = "membership_id"),
        @Index(name = "idx_occupancies_bed_id", columnList = "bed_id"),
        @Index(name = "idx_occupancies_unit_space_id", columnList = "unit_space_id")
})
@Getter
@Setter
public class Occupancy extends BaseEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "membership_id", nullable = false)
    private Membership membership;

    @Enumerated(EnumType.STRING)
    @Column(name = "occupancy_target", nullable = false, length = 10)
    private OccupancyTarget occupancyTarget;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_id")
    private Bed bed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_space_id")
    private Space unitSpace;

    @Column(name = "move_in_date", nullable = false)
    private LocalDate moveInDate;

    @Column(name = "move_out_date")
    private LocalDate moveOutDate;

    @Column(name = "is_current", nullable = false)
    private boolean current = true;

    @Column(name = "monthly_rent")
    private BigDecimal monthlyRent;

    @Enumerated(EnumType.STRING)
    @Column(name = "occupancy_classification", length = 30)
    private OccupancyClassification occupancyClassification;
}
