package com.dwellio.billing.repository;

import com.dwellio.domain.entity.BillingRule;
import com.dwellio.domain.enums.ChargeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BillingRuleRepository extends JpaRepository<BillingRule, UUID> {

    @Query("""
            SELECT r FROM BillingRule r
            WHERE r.organization.id = :organizationId
            ORDER BY r.chargeType, r.createdAt
            """)
    List<BillingRule> findAllByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT r FROM BillingRule r
            WHERE r.organization.id = :organizationId
              AND r.active = TRUE
            ORDER BY r.chargeType
            """)
    List<BillingRule> findAllActiveByOrganizationId(@Param("organizationId") UUID organizationId);

    Optional<BillingRule> findByIdAndOrganizationId(UUID id, UUID organizationId);

    boolean existsByOrganizationIdAndChargeType(UUID organizationId, ChargeType chargeType);
}
