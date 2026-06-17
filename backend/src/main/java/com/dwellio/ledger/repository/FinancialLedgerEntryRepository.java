package com.dwellio.ledger.repository;

import com.dwellio.domain.entity.FinancialLedgerEntry;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FinancialLedgerEntryRepository extends JpaRepository<FinancialLedgerEntry, UUID> {

    @Query("""
            SELECT e FROM FinancialLedgerEntry e
            JOIN FETCH e.membership m
            JOIN FETCH m.user
            LEFT JOIN FETCH e.payment
            WHERE e.organization.id = :organizationId
              AND e.membership.id = :membershipId
            ORDER BY e.createdAt DESC, e.id DESC
            """)
    List<FinancialLedgerEntry> findByOrganizationAndMembership(
            @Param("organizationId") UUID organizationId,
            @Param("membershipId") UUID membershipId
    );

    @Query("""
            SELECT e FROM FinancialLedgerEntry e
            JOIN FETCH e.membership m
            JOIN FETCH m.user
            LEFT JOIN FETCH e.payment
            WHERE e.organization.id = :organizationId
            ORDER BY e.createdAt DESC, e.id DESC
            """)
    List<FinancialLedgerEntry> findByOrganization(@Param("organizationId") UUID organizationId);

    Optional<FinancialLedgerEntry> findFirstByOrganizationIdAndMembershipIdOrderByCreatedAtDescIdDesc(
            UUID organizationId,
            UUID membershipId
    );

    default Optional<java.math.BigDecimal> findLatestBalance(UUID organizationId, UUID membershipId) {
        return findFirstByOrganizationIdAndMembershipIdOrderByCreatedAtDescIdDesc(organizationId, membershipId)
                .map(FinancialLedgerEntry::getBalanceAfter);
    }

    boolean existsByPaymentIdAndEntryType(UUID paymentId, com.dwellio.domain.enums.LedgerEntryType entryType);

    @Query("""
            SELECT COUNT(e) > 0 FROM FinancialLedgerEntry e
            WHERE e.payment.id = :paymentId
              AND e.entryType = com.dwellio.domain.enums.LedgerEntryType.PAYMENT_RECEIVED
            """)
    boolean hasPaymentReceivedEntry(@Param("paymentId") UUID paymentId);
}
