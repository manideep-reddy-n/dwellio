package com.dwellio.domain.entity;

import com.dwellio.common.entity.SoftDeletableEntity;
import com.dwellio.domain.enums.AccommodationMode;
import com.dwellio.domain.enums.BillingMode;
import com.dwellio.domain.enums.HostelAudience;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.OrganizationType;
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
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "organizations")
@Getter
@Setter
public class Organization extends SoftDeletableEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private OrganizationType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "hostel_audience", length = 20)
    private HostelAudience hostelAudience;

    @Enumerated(EnumType.STRING)
    @Column(name = "accommodation_mode", nullable = false, length = 20)
    private AccommodationMode accommodationMode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrganizationStatus status = OrganizationStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Column(name = "address_line", length = 500)
    private String addressLine;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(length = 100)
    private String area;

    @Column(length = 100)
    private String state;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(nullable = false, length = 100)
    private String country = "IN";

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(name = "default_monthly_rent", precision = 12, scale = 2)
    private BigDecimal defaultMonthlyRent;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "profile_completeness_score", nullable = false)
    private short profileCompletenessScore;

    @Column(name = "sla_first_response_hours", nullable = false, precision = 8, scale = 2)
    private BigDecimal slaFirstResponseHours = BigDecimal.valueOf(24);

    @Column(name = "sla_resolution_hours", nullable = false, precision = 8, scale = 2)
    private BigDecimal slaResolutionHours = BigDecimal.valueOf(72);

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_mode", nullable = false, length = 30)
    private BillingMode billingMode = BillingMode.OCCUPANCY_ANCHOR;

    @Column(name = "billing_custom_day")
    private Short billingCustomDay;
}
