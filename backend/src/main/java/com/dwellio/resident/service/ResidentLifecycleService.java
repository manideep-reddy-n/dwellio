package com.dwellio.resident.service;

import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.complaint.repository.ComplaintRepository;
import com.dwellio.complaint.service.ComplaintSlaService;
import com.dwellio.complaint.sla.ComplaintSlaSettings;
import com.dwellio.domain.entity.Complaint;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Payment;
import com.dwellio.domain.entity.ResidentProfile;
import com.dwellio.domain.entity.Review;
import com.dwellio.domain.enums.ComplaintStatus;
import com.dwellio.domain.enums.PaymentStatus;
import com.dwellio.joinrequest.repository.ResidentProfileRepository;
import com.dwellio.ledger.dto.LedgerEntryResponse;
import com.dwellio.ledger.repository.FinancialLedgerEntryRepository;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.occupancy.dto.OccupancyResponse;
import com.dwellio.occupancy.service.OccupancyService;
import com.dwellio.operations.service.OperationsGuard;
import com.dwellio.payment.dto.PaymentResponse;
import com.dwellio.payment.repository.PaymentRepository;
import com.dwellio.payment.service.PaymentService;
import com.dwellio.resident.dto.ResidentComplaintMetrics;
import com.dwellio.resident.dto.ResidentComplaintSummary;
import com.dwellio.resident.dto.ResidentFinancialSummary;
import com.dwellio.resident.dto.ResidentLifecycleMembershipInfo;
import com.dwellio.resident.dto.ResidentLifecycleProfileResponse;
import com.dwellio.review.dto.ReviewResponse;
import com.dwellio.review.repository.ReviewRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ResidentLifecycleService {

    private static final int RECENT_PAYMENTS_LIMIT = 12;
    private static final int RECENT_LEDGER_LIMIT = 20;

    private static final Set<ComplaintStatus> OPEN_STATUSES = EnumSet.of(
            ComplaintStatus.OPEN,
            ComplaintStatus.IN_PROGRESS,
            ComplaintStatus.REOPENED
    );

    private static final Set<ComplaintStatus> RESOLVED_STATUSES = EnumSet.of(
            ComplaintStatus.RESOLVED,
            ComplaintStatus.CLOSED
    );

    private final MembershipRepository membershipRepository;
    private final ResidentProfileRepository residentProfileRepository;
    private final OccupancyService occupancyService;
    private final PaymentRepository paymentRepository;
    private final FinancialLedgerEntryRepository ledgerEntryRepository;
    private final ComplaintRepository complaintRepository;
    private final ReviewRepository reviewRepository;
    private final OperationsGuard operationsGuard;
    private final ComplaintSlaService complaintSlaService;
    private final PaymentService paymentService;

    @Transactional(readOnly = true)
    public ResidentLifecycleProfileResponse getProfile(UUID organizationId, UUID membershipId) {
        operationsGuard.requireOrganization(organizationId);
        Membership membership = membershipRepository.findByIdAndOrganizationId(membershipId, organizationId)
                .orElseThrow(() -> new NotFoundException("Membership not found"));
        if (!"RESIDENT".equalsIgnoreCase(membership.getRole().getName())) {
            throw new BadRequestException("Lifecycle profile is only available for resident memberships");
        }

        ResidentProfile residentProfile = residentProfileRepository.findByMembershipId(membershipId).orElse(null);
        ComplaintSlaSettings slaSettings = complaintSlaService.getSettings(organizationId);

        List<OccupancyResponse> accommodationHistory = occupancyService.list(organizationId, membershipId);
        OccupancyResponse currentOccupancy = accommodationHistory.stream()
                .filter(OccupancyResponse::current)
                .findFirst()
                .orElse(null);

        List<Payment> payments = paymentRepository.findAllActiveByOrganizationIdAndMembershipId(
                organizationId,
                membershipId
        );
        List<PaymentResponse> paymentResponses = payments.stream()
                .limit(RECENT_PAYMENTS_LIMIT)
                .map(paymentService::toResponse)
                .toList();

        List<LedgerEntryResponse> ledgerEntries = ledgerEntryRepository
                .findByOrganizationAndMembership(organizationId, membershipId).stream()
                .limit(RECENT_LEDGER_LIMIT)
                .map(LedgerEntryResponse::from)
                .toList();

        List<Complaint> complaints = complaintRepository.findAllActiveByOrganizationIdAndCreatedByMembershipId(
                organizationId,
                membershipId,
                null
        );
        List<ResidentComplaintSummary> complaintSummaries = complaints.stream()
                .map(complaint -> toComplaintSummary(complaint, slaSettings))
                .toList();

        List<ReviewResponse> reviews = reviewRepository.findActiveByOrganizationIdAndMembershipId(
                        organizationId,
                        membershipId
                )
                .stream()
                .map(ReviewResponse::from)
                .toList();

        return new ResidentLifecycleProfileResponse(
                toMembershipInfo(membership, residentProfile),
                currentOccupancy,
                accommodationHistory,
                buildFinancialSummary(payments, organizationId, membershipId),
                paymentResponses,
                ledgerEntries,
                complaintSummaries,
                buildComplaintMetrics(complaints),
                reviews
        );
    }

    private ResidentLifecycleMembershipInfo toMembershipInfo(Membership membership, ResidentProfile profile) {
        return new ResidentLifecycleMembershipInfo(
                membership.getId(),
                membership.getUser().getId(),
                membership.getUser().getFullName(),
                membership.getUser().getEmail(),
                membership.getUser().getPhone(),
                membership.getRole().getName(),
                membership.getStatus(),
                membership.getJoinedAt(),
                profile != null ? profile.getEmergencyContactName() : null,
                profile != null ? profile.getEmergencyContactPhone() : null
        );
    }

    private ResidentFinancialSummary buildFinancialSummary(
            List<Payment> payments,
            UUID organizationId,
            UUID membershipId
    ) {
        BigDecimal totalBilled = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPaid = payments.stream()
                .map(Payment::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int pendingPaymentsCount = (int) payments.stream()
                .filter(payment -> payment.getStatus() != PaymentStatus.PAID)
                .count();
        BigDecimal outstandingBalance = ledgerEntryRepository.findLatestBalance(organizationId, membershipId)
                .orElse(BigDecimal.ZERO);

        return new ResidentFinancialSummary(
                outstandingBalance,
                pendingPaymentsCount,
                totalBilled,
                totalPaid
        );
    }

    private ResidentComplaintSummary toComplaintSummary(Complaint complaint, ComplaintSlaSettings slaSettings) {
        boolean slaBreached = complaintSlaService.isBreached(complaint, slaSettings);
        return new ResidentComplaintSummary(
                complaint.getId(),
                complaint.getTitle(),
                complaint.getCategory(),
                complaint.getPriority(),
                complaint.getStatus(),
                complaint.getCreatedAt(),
                complaint.getFirstResponseAt(),
                complaint.getResolvedAt(),
                slaBreached
        );
    }

    private ResidentComplaintMetrics buildComplaintMetrics(List<Complaint> complaints) {
        int openComplaints = (int) complaints.stream()
                .filter(complaint -> OPEN_STATUSES.contains(complaint.getStatus()))
                .count();
        int resolvedComplaints = (int) complaints.stream()
                .filter(complaint -> RESOLVED_STATUSES.contains(complaint.getStatus()))
                .count();

        List<Double> firstResponseHours = complaints.stream()
                .filter(complaint -> complaint.getFirstResponseAt() != null)
                .map(complaint -> hoursBetween(complaint.getCreatedAt(), complaint.getFirstResponseAt()))
                .toList();
        List<Double> resolutionDays = complaints.stream()
                .filter(complaint -> complaint.getResolvedAt() != null)
                .map(complaint -> hoursBetween(complaint.getCreatedAt(), complaint.getResolvedAt()) / 24.0)
                .toList();

        return new ResidentComplaintMetrics(
                complaints.size(),
                openComplaints,
                resolvedComplaints,
                average(firstResponseHours, 1),
                average(resolutionDays, 1)
        );
    }

    private static double hoursBetween(Instant start, Instant end) {
        return Duration.between(start, end).toMillis() / 3_600_000.0;
    }

    private static BigDecimal average(List<Double> values, int scale) {
        if (values.isEmpty()) {
            return null;
        }
        double avg = values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        return BigDecimal.valueOf(avg).setScale(scale, RoundingMode.HALF_UP);
    }
}
