package com.dwellio.invoice.service;

import com.dwellio.accommodation.service.AccommodationGuard;
import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ForbiddenException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.common.storage.MediaStorageService;
import com.dwellio.domain.entity.Invoice;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Payment;
import com.dwellio.domain.entity.User;
import com.dwellio.domain.enums.InvoiceStatus;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.domain.enums.PaymentStatus;
import com.dwellio.invoice.dto.InvoiceResponse;
import com.dwellio.invoice.dto.InvoiceVerificationResponse;
import com.dwellio.invoice.pdf.InvoicePdfRenderer;
import com.dwellio.invoice.repository.InvoiceRepository;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.payment.repository.PaymentRepository;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final AccommodationGuard accommodationGuard;
    private final AuthorizationService authorizationService;
    private final NotificationService notificationService;
    private final MediaStorageService mediaStorage;
    private final InvoicePdfRenderer invoicePdfRenderer;
    private final Clock clock;

    @Value("${dwellio.app.public-url:http://localhost:3000}")
    private String publicAppUrl;

    @Transactional
    public InvoiceResponse generate(UUID organizationId, UUID paymentId, UserPrincipal principal) {
        authorizationService.requirePermission(organizationId, "payment:manage");
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        Payment payment = paymentRepository.findByIdAndOrganizationIdAndDeletedAtIsNull(paymentId, organizationId)
                .orElseThrow(() -> new NotFoundException("Payment not found"));

        if (payment.getStatus() != PaymentStatus.PAID && payment.getStatus() != PaymentStatus.PARTIAL) {
            throw new BadRequestException("Invoice can only be generated for paid or partially paid bills");
        }

        invoiceRepository.findActiveByPaymentId(paymentId).ifPresent(existing -> {
            throw new BadRequestException("Invoice already exists for this payment");
        });

        String token = randomToken();
        Invoice invoice = new Invoice();
        invoice.setId(UUID.randomUUID());
        invoice.setPayment(payment);
        invoice.setOrganization(organization);
        invoice.setInvoiceNumber(buildInvoiceNumber(organization));
        invoice.setVerificationToken(token);
        invoice.setVerificationHash(sha256(token));
        invoice.setStatus(InvoiceStatus.GENERATED);
        invoice.setGeneratedAt(Instant.now(clock));
        invoice.setGeneratedBy(referenceUser(principal.getId()));

        try {
            byte[] pdfBytes = invoicePdfRenderer.render(organization, payment, invoice);
            MediaStorageService.StoredMedia stored = mediaStorage.storeRaw(
                    pdfBytes, "invoices", invoice.getId().toString() + ".pdf");
            invoice.setPdfPath(stored.url());
        } catch (IOException exception) {
            throw new BadRequestException("Could not generate invoice PDF");
        }

        Invoice saved = invoiceRepository.saveAndFlush(invoice);
        return toResponse(saved, true);
    }

    @Transactional
    public InvoiceResponse share(UUID organizationId, UUID paymentId, UserPrincipal principal) {
        authorizationService.requirePermission(organizationId, "payment:manage");
        Invoice invoice = invoiceRepository.findActiveByPaymentId(paymentId).orElse(null);
        if (invoice == null) {
            generate(organizationId, paymentId, principal);
            invoice = invoiceRepository.findActiveByPaymentId(paymentId)
                    .orElseThrow(() -> new NotFoundException("Invoice not found"));
        }

        if (!organizationId.equals(invoice.getOrganization().getId())) {
            throw new NotFoundException("Invoice not found");
        }
        if (invoice.getStatus() == InvoiceStatus.REVOKED) {
            throw new BadRequestException("Invoice has been revoked");
        }

        if (invoice.getStatus() == InvoiceStatus.SHARED) {
            return toResponse(invoice, false);
        }

        invoice.setStatus(InvoiceStatus.SHARED);
        invoice.setSharedAt(Instant.now(clock));
        Invoice saved = invoiceRepository.saveAndFlush(invoice);

        Payment payment = invoice.getPayment();
        String slug = invoice.getOrganization().getSlug();
        Map<String, Object> payload = new HashMap<>();
        payload.put("paymentId", payment.getId().toString());
        payload.put("invoiceId", invoice.getId().toString());
        payload.put("organizationSlug", slug);
        payload.put("targetPath", "/app/" + slug + "/resident/payments");
        notificationService.create(
                payment.getMembership().getUser().getId(),
                organizationId,
                NotificationType.INVOICE_SHARED,
                "Invoice available",
                "Your invoice " + invoice.getInvoiceNumber() + " is ready to view and download.",
                payload
        );

        return toResponse(saved, false);
    }

    @Transactional(readOnly = true)
    public byte[] downloadPdfForPayment(UUID organizationId, UUID paymentId, boolean residentView) {
        Invoice invoice = invoiceRepository.findActiveByPaymentId(paymentId)
                .orElseThrow(() -> new NotFoundException("Invoice not found"));
        if (!invoice.getOrganization().getId().equals(organizationId)) {
            throw new NotFoundException("Invoice not found");
        }
        if (residentView) {
            authorizationService.requirePermission(organizationId, "payment:read_own");
            if (invoice.getStatus() != InvoiceStatus.SHARED) {
                throw new ForbiddenException("Invoice is not available yet");
            }
        } else {
            authorizationService.requirePermission(organizationId, "payment:manage");
        }
        return downloadPdfBytes(invoice);
    }

    @Transactional(readOnly = true)
    public byte[] downloadPdf(UUID organizationId, UUID invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .filter(i -> i.getDeletedAt() == null)
                .orElseThrow(() -> new NotFoundException("Invoice not found"));
        if (!invoice.getOrganization().getId().equals(organizationId)) {
            throw new NotFoundException("Invoice not found");
        }
        return downloadPdfBytes(invoice);
    }

    private byte[] downloadPdfBytes(Invoice invoice) {
        if (invoice.getPdfPath() == null) {
            throw new NotFoundException("PDF not found");
        }
        try {
            String path = invoice.getPdfPath();
            if (path.startsWith("http://") || path.startsWith("https://")) {
                return mediaStorage.downloadRaw(path);
            }
            throw new NotFoundException("PDF not found");
        } catch (IOException exception) {
            throw new NotFoundException("PDF not found");
        }
    }

    @Transactional(readOnly = true)
    public InvoiceVerificationResponse verify(String invoiceNumber, String token) {
        if (invoiceNumber == null || token == null) {
            return invalid("Missing invoice number or token");
        }

        Invoice invoice = invoiceRepository.findByInvoiceNumberAndDeletedAtIsNull(invoiceNumber.trim())
                .orElse(null);
        if (invoice == null) {
            return invalid("Invoice not found");
        }
        if (!invoice.getVerificationToken().equals(token.trim())) {
            return invalid("Invalid verification token");
        }
        if (invoice.getStatus() == InvoiceStatus.REVOKED) {
            return revoked(invoice);
        }

        Payment payment = invoice.getPayment();
        return new InvoiceVerificationResponse(
                invoice.getInvoiceNumber(),
                invoice.getOrganization().getName(),
                payment.getMembership().getUser().getFullName(),
                invoice.getGeneratedAt().atZone(clock.getZone()).toLocalDate(),
                payment.getAmount(),
                payment.getAmountPaid(),
                payment.getStatus(),
                invoice.getStatus(),
                "VERIFIED"
        );
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getForPayment(UUID paymentId) {
        return invoiceRepository.findActiveByPaymentId(paymentId)
                .map(i -> toResponse(i, false))
                .orElse(null);
    }

    private String buildInvoiceNumber(Organization organization) {
        long seq = invoiceRepository.countByOrganizationIdAndDeletedAtIsNull(organization.getId()) + 1;
        String ym = DateTimeFormatter.ofPattern("yyyyMM").format(Instant.now(clock).atZone(clock.getZone()));
        return "INV-" + organization.getSlug().toUpperCase().replace("-", "") + "-" + ym + "-" + String.format("%04d", seq);
    }

    private static String randomToken() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes()));
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 unavailable");
        }
    }

    private User referenceUser(UUID userId) {
        User user = new User();
        user.setId(userId);
        return user;
    }

    private InvoiceResponse toResponse(Invoice invoice, boolean includeToken) {
        String verifyUrl = publicAppUrl + "/verify-invoice?n=" + invoice.getInvoiceNumber()
                + "&t=" + invoice.getVerificationToken();
        return new InvoiceResponse(
                invoice.getId(),
                invoice.getPayment().getId(),
                invoice.getInvoiceNumber(),
                includeToken ? invoice.getVerificationToken() : null,
                invoice.getStatus(),
                invoice.getGeneratedAt(),
                invoice.getSharedAt(),
                verifyUrl
        );
    }

    private InvoiceVerificationResponse invalid(String message) {
        return new InvoiceVerificationResponse(null, null, null, null, null, null, null, null, message);
    }

    private InvoiceVerificationResponse revoked(Invoice invoice) {
        Payment payment = invoice.getPayment();
        return new InvoiceVerificationResponse(
                invoice.getInvoiceNumber(),
                invoice.getOrganization().getName(),
                payment.getMembership().getUser().getFullName(),
                invoice.getGeneratedAt().atZone(clock.getZone()).toLocalDate(),
                payment.getAmount(),
                payment.getAmountPaid(),
                payment.getStatus(),
                InvoiceStatus.REVOKED,
                "REVOKED"
        );
    }
}
