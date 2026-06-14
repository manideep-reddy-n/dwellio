package com.dwellio.payment.repository;

import com.dwellio.domain.enums.ChargeType;
import com.dwellio.domain.entity.Payment;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    @Query("""
            SELECT p FROM Payment p
            JOIN FETCH p.membership m
            JOIN FETCH m.user
            WHERE p.organization.id = :organizationId
              AND p.deletedAt IS NULL
            ORDER BY p.billingMonth DESC, m.user.fullName
            """)
    List<Payment> findAllActiveByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            SELECT p FROM Payment p
            WHERE p.organization.id = :organizationId
              AND p.membership.id = :membershipId
              AND p.deletedAt IS NULL
            ORDER BY p.billingMonth DESC
            """)
    List<Payment> findAllActiveByOrganizationIdAndMembershipId(
            @Param("organizationId") UUID organizationId,
            @Param("membershipId") UUID membershipId
    );

    Optional<Payment> findByIdAndOrganizationIdAndDeletedAtIsNull(UUID id, UUID organizationId);

    Optional<Payment> findByMembershipIdAndBillingMonthAndChargeTypeAndDeletedAtIsNull(
            UUID membershipId,
            LocalDate billingMonth,
            ChargeType chargeType
    );
}
