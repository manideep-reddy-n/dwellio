package com.dwellio.admin.service;

import com.dwellio.admin.dto.AdminPagedResponse;
import com.dwellio.admin.dto.AdminPaymentSummary;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.Payment;
import com.dwellio.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminPaymentService {

    private final PaymentRepository paymentRepository;
    private final AuthorizationService authorizationService;

    @Transactional(readOnly = true)
    public AdminPagedResponse<AdminPaymentSummary> list(String query, int page, int size) {
        authorizationService.requirePlatformAdmin();
        Page<Payment> payments = paymentRepository.searchForAdmin(
                normalize(query),
                PageRequest.of(page, size)
        );
        return AdminPagedResponse.of(
                payments.map(this::toSummary).getContent(),
                page,
                size,
                payments.getTotalElements()
        );
    }

    private AdminPaymentSummary toSummary(Payment payment) {
        return new AdminPaymentSummary(
                payment.getId(),
                payment.getOrganization().getId(),
                payment.getOrganization().getName(),
                payment.getMembership().getUser().getFullName(),
                payment.getBillingMonth(),
                payment.getAmount(),
                payment.getAmountPaid(),
                payment.getStatus(),
                payment.getDueDate(),
                payment.getCreatedAt()
        );
    }

    private static String normalize(String query) {
        return query == null || query.isBlank() ? null : query.trim();
    }
}
