package com.dwellio.billing.service;

import com.dwellio.billing.dto.BillingRuleResponse;
import com.dwellio.billing.dto.UpsertBillingRuleRequest;
import com.dwellio.billing.repository.BillingRuleRepository;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.BillingRule;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.enums.BillingAppliesTo;
import com.dwellio.domain.enums.BillingMode;
import com.dwellio.domain.enums.BillingRecurrence;
import com.dwellio.domain.enums.BillingResponsibility;
import com.dwellio.domain.enums.ChargeType;
import com.dwellio.domain.enums.OrganizationType;
import com.dwellio.organization.repository.OrganizationRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BillingRuleService {

    private final BillingRuleRepository billingRuleRepository;
    private final OrganizationRepository organizationRepository;
    private final AuthorizationService authorizationService;

    @Transactional(readOnly = true)
    public List<BillingRuleResponse> list(UUID organizationId) {
        authorizationService.requirePermission(organizationId, "payment:manage");
        requireOrganization(organizationId);
        return billingRuleRepository.findAllByOrganizationId(organizationId).stream()
                .map(BillingRuleResponse::from)
                .toList();
    }

    @Transactional
    public BillingRuleResponse upsert(UUID organizationId, UpsertBillingRuleRequest request) {
        authorizationService.requirePermission(organizationId, "payment:manage");
        Organization organization = requireOrganization(organizationId);

        BillingRule rule = billingRuleRepository
                .findAllByOrganizationId(organizationId)
                .stream()
                .filter(existing -> existing.getChargeType() == request.chargeType())
                .findFirst()
                .orElseGet(() -> {
                    BillingRule created = new BillingRule();
                    created.setId(UUID.randomUUID());
                    created.setOrganization(organization);
                    created.setChargeType(request.chargeType());
                    return created;
                });

        rule.setRecurrence(request.recurrence());
        rule.setDefaultAmount(request.defaultAmount());
        rule.setDueDayOfMonth(request.dueDayOfMonth());
        rule.setAppliesTo(request.appliesTo());
        rule.setBillTo(request.billTo());
        if (request.active() != null) {
            rule.setActive(request.active());
        }
        return BillingRuleResponse.from(billingRuleRepository.save(rule));
    }

    @Transactional
    public void seedDefaults(Organization organization) {
        if (organization.getType() == OrganizationType.GATED_COMMUNITY) {
            organization.setBillingMode(BillingMode.CALENDAR_MONTH);
            seedIfMissing(
                    organization,
                    ChargeType.MAINTENANCE,
                    BillingRecurrence.MONTHLY,
                    BigDecimal.valueOf(2500),
                    (short) 5,
                    BillingAppliesTo.ALL_ACTIVE_UNITS,
                    BillingResponsibility.OWNER
            );
            return;
        }
        if (organization.getBillingMode() == null) {
            organization.setBillingMode(BillingMode.OCCUPANCY_ANCHOR);
        }
    }

    private void seedIfMissing(
            Organization organization,
            ChargeType chargeType,
            BillingRecurrence recurrence,
            BigDecimal amount,
            short dueDay,
            BillingAppliesTo appliesTo,
            BillingResponsibility billTo
    ) {
        if (billingRuleRepository.existsByOrganizationIdAndChargeType(organization.getId(), chargeType)) {
            return;
        }
        BillingRule rule = new BillingRule();
        rule.setId(UUID.randomUUID());
        rule.setOrganization(organization);
        rule.setChargeType(chargeType);
        rule.setRecurrence(recurrence);
        rule.setDefaultAmount(amount);
        rule.setDueDayOfMonth(dueDay);
        rule.setAppliesTo(appliesTo);
        rule.setBillTo(billTo);
        rule.setActive(true);
        billingRuleRepository.save(rule);
    }

    @Transactional(readOnly = true)
    public BillingRule requireActiveRule(UUID organizationId, UUID ruleId) {
        return billingRuleRepository.findByIdAndOrganizationId(ruleId, organizationId)
                .filter(BillingRule::isActive)
                .orElseThrow(() -> new NotFoundException("Billing rule not found"));
    }

    private Organization requireOrganization(UUID organizationId) {
        return organizationRepository.findActiveById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));
    }
}
