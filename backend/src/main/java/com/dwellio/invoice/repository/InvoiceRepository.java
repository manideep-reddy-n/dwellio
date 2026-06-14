package com.dwellio.invoice.repository;

import com.dwellio.domain.entity.Invoice;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    @Query("""
            SELECT i FROM Invoice i
            JOIN FETCH i.payment p
            JOIN FETCH p.membership m
            JOIN FETCH m.user
            WHERE i.payment.id = :paymentId
              AND i.deletedAt IS NULL
            """)
    Optional<Invoice> findActiveByPaymentId(@Param("paymentId") UUID paymentId);

    Optional<Invoice> findByInvoiceNumberAndDeletedAtIsNull(String invoiceNumber);

    Optional<Invoice> findByVerificationTokenAndDeletedAtIsNull(String verificationToken);

    long countByOrganizationIdAndDeletedAtIsNull(UUID organizationId);
}
