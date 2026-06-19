package com.dwellio.admin.service;

import com.dwellio.admin.dto.AdminAuditLogSummary;
import com.dwellio.admin.dto.AdminDashboardMetricsResponse;
import com.dwellio.audit.repository.AuditLogRepository;
import com.dwellio.auth.repository.UserRepository;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.complaint.repository.ComplaintRepository;
import com.dwellio.domain.entity.AuditLog;
import com.dwellio.domain.enums.ComplaintStatus;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.VerificationRequestStatus;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.organization.repository.OrganizationRepository;
import com.dwellio.payment.repository.PaymentRepository;
import com.dwellio.push.repository.PushSubscriptionRepository;
import com.dwellio.review.repository.ReviewRepository;
import com.dwellio.verification.repository.OrganizationVerificationRequestRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final AuthorizationService authorizationService;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final ComplaintRepository complaintRepository;
    private final ReviewRepository reviewRepository;
    private final PaymentRepository paymentRepository;
    private final OrganizationVerificationRequestRepository verificationRequestRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final AuditLogRepository auditLogRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public AdminDashboardMetricsResponse getMetrics() {
        authorizationService.requirePlatformAdmin();

        Instant thirtyDaysAgo = Instant.now(clock).minus(30, ChronoUnit.DAYS);
        long totalUsers = userRepository.countAllIncludingDeleted();
        long activeUsers = userRepository.countActive();

        return new AdminDashboardMetricsResponse(
                organizationRepository.countActive(),
                organizationRepository.countActiveByStatus(OrganizationStatus.VERIFIED),
                organizationRepository.countActiveByStatus(OrganizationStatus.PENDING_VERIFICATION),
                totalUsers,
                activeUsers,
                totalUsers - activeUsers,
                membershipRepository.countActiveResidents(),
                membershipRepository.countActiveOwners(),
                membershipRepository.countActiveStaff(),
                complaintRepository.countActive(),
                complaintRepository.countActiveByStatus(ComplaintStatus.OPEN)
                        + complaintRepository.countActiveByStatus(ComplaintStatus.IN_PROGRESS)
                        + complaintRepository.countActiveByStatus(ComplaintStatus.REOPENED),
                complaintRepository.countActiveByStatus(ComplaintStatus.RESOLVED)
                        + complaintRepository.countActiveByStatus(ComplaintStatus.CLOSED),
                reviewRepository.countActive(),
                paymentRepository.sumTotalRevenue(),
                paymentRepository.sumOutstandingBalance(),
                verificationRequestRepository.countByStatus(VerificationRequestStatus.PENDING),
                pushSubscriptionRepository.countActive(),
                userRepository.countCreatedSince(thirtyDaysAgo),
                organizationRepository.countCreatedSince(thirtyDaysAgo),
                recentActivity()
        );
    }

    private List<AdminAuditLogSummary> recentActivity() {
        return auditLogRepository.findAllOrderByCreatedAtDesc(PageRequest.of(0, 10))
                .map(this::toAuditSummary)
                .getContent();
    }

    private AdminAuditLogSummary toAuditSummary(AuditLog log) {
        return new AdminAuditLogSummary(
                log.getId(),
                log.getActorUser().getFullName(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getOrganization() != null ? log.getOrganization().getName() : null,
                log.getMetadata(),
                log.getCreatedAt()
        );
    }
}
