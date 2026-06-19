package com.dwellio.payment.repository;

import com.dwellio.domain.enums.ChargeType;
import com.dwellio.domain.entity.Payment;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
            JOIN FETCH p.membership m
            JOIN FETCH m.user
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

    Optional<Payment> findByOrganizationIdAndUnitSpaceIdAndBillingMonthAndChargeTypeAndDeletedAtIsNull(
            UUID organizationId,
            UUID unitSpaceId,
            LocalDate billingMonth,
            ChargeType chargeType
    );

    @Query("SELECT COALESCE(SUM(p.amountPaid), 0) FROM Payment p WHERE p.deletedAt IS NULL")
    BigDecimal sumTotalRevenue();

    @Query("""
            SELECT COALESCE(SUM(p.amount - p.amountPaid), 0) FROM Payment p
            WHERE p.deletedAt IS NULL AND p.amount > p.amountPaid
            """)
    BigDecimal sumOutstandingBalance();

    @Query("""
            SELECT p FROM Payment p
            JOIN FETCH p.organization o
            JOIN FETCH p.membership m
            JOIN FETCH m.user u
            WHERE p.deletedAt IS NULL
              AND (:query IS NULL OR :query = ''
                OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(o.name) LIKE LOWER(CONCAT('%', :query, '%')))
            ORDER BY p.billingMonth DESC, p.createdAt DESC
            """)
    Page<Payment> searchForAdmin(@Param("query") String query, Pageable pageable);
}
