package com.dwellio.domain.entity;

import com.dwellio.common.entity.BaseEntity;
import com.dwellio.domain.enums.BillingAppliesTo;
import com.dwellio.domain.enums.BillingRecurrence;
import com.dwellio.domain.enums.BillingResponsibility;
import com.dwellio.domain.enums.ChargeType;
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
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "billing_rules")
@Getter
@Setter
public class BillingRule extends BaseEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    @Column(name = "charge_type", nullable = false, length = 30)
    private ChargeType chargeType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BillingRecurrence recurrence = BillingRecurrence.MONTHLY;

    @Column(name = "default_amount", precision = 12, scale = 2)
    private BigDecimal defaultAmount;

    @Column(name = "due_day_of_month")
    private Short dueDayOfMonth;

    @Enumerated(EnumType.STRING)
    @Column(name = "applies_to", nullable = false, length = 40)
    private BillingAppliesTo appliesTo = BillingAppliesTo.ALL_ACTIVE_OCCUPANCIES;

    @Enumerated(EnumType.STRING)
    @Column(name = "bill_to", nullable = false, length = 20)
    private BillingResponsibility billTo = BillingResponsibility.RESIDENT;

    @Column(nullable = false)
    private boolean active = true;
}
