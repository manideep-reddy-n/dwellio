package com.dwellio.payment.controller;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.invoice.dto.InvoiceResponse;
import com.dwellio.invoice.service.InvoiceService;
import com.dwellio.payment.dto.CreateManualChargeRequest;
import com.dwellio.payment.dto.PaymentResponse;
import com.dwellio.payment.dto.RecordPaymentRequest;
import com.dwellio.billing.service.GatedMaintenanceBillingService;
import com.dwellio.organization.repository.OrganizationRepository;
import com.dwellio.payment.service.PaymentService;
import com.dwellio.domain.enums.OrganizationType;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final InvoiceService invoiceService;
    private final AuthorizationService authorizationService;
    private final GatedMaintenanceBillingService gatedMaintenanceBillingService;
    private final OrganizationRepository organizationRepository;

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'payment:manage')")
    public List<PaymentResponse> list(@PathVariable UUID organizationId) {
        organizationRepository.findActiveById(organizationId).ifPresent(organization -> {
            if (organization.getType() == OrganizationType.GATED_COMMUNITY) {
                gatedMaintenanceBillingService.syncOrganization(organization);
            }
        });
        return paymentService.listForOrganization(organizationId);
    }

    @GetMapping("/mine")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'payment:read_own')")
    public List<PaymentResponse> listMine(@PathVariable UUID organizationId) {
        return paymentService.listMine(organizationId);
    }

    @PostMapping("/manual")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'payment:manage')")
    public List<PaymentResponse> createManual(
            @PathVariable UUID organizationId,
            @Valid @RequestBody CreateManualChargeRequest request
    ) {
        return paymentService.createManualCharges(organizationId, request);
    }

    @PatchMapping("/{paymentId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'payment:manage')")
    public PaymentResponse record(
            @PathVariable UUID organizationId,
            @PathVariable UUID paymentId,
            @Valid @RequestBody RecordPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return paymentService.recordPayment(organizationId, paymentId, request, principal);
    }

    @PostMapping("/{paymentId}/invoice")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'payment:manage')")
    public InvoiceResponse generateInvoice(
            @PathVariable UUID organizationId,
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return invoiceService.generate(organizationId, paymentId, principal);
    }

    @PostMapping("/{paymentId}/invoice/share")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'payment:manage')")
    public InvoiceResponse shareInvoice(
            @PathVariable UUID organizationId,
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return invoiceService.share(organizationId, paymentId, principal);
    }

    @GetMapping("/{paymentId}/invoice/pdf")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'payment:manage') or @authz.hasPermission(#organizationId, 'payment:read_own')")
    public ResponseEntity<byte[]> downloadInvoice(
            @PathVariable UUID organizationId,
            @PathVariable UUID paymentId
    ) {
        var invoice = invoiceService.getForPayment(paymentId);
        if (invoice == null) {
            return ResponseEntity.notFound().build();
        }
        boolean residentView = !authorizationService.hasPermission(organizationId, "payment:manage");
        byte[] pdf = invoiceService.downloadPdfForPayment(organizationId, paymentId, residentView);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + invoice.invoiceNumber() + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
