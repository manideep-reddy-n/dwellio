package com.dwellio.verification.service;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ForbiddenException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationVerificationDocument;
import com.dwellio.domain.entity.OrganizationVerificationRequest;
import com.dwellio.domain.entity.User;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.VerificationRequestStatus;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.verification.dto.AdminVerificationRequestSummary;
import com.dwellio.verification.dto.VerificationRequestResponse;
import com.dwellio.verification.repository.OrganizationVerificationDocumentRepository;
import com.dwellio.verification.repository.OrganizationVerificationRequestRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminVerificationService {

    private final OrganizationVerificationRequestRepository requestRepository;
    private final OrganizationVerificationDocumentRepository documentRepository;
    private final AuthorizationService authorizationService;
    private final MembershipRepository membershipRepository;
    private final NotificationService notificationService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<AdminVerificationRequestSummary> list(VerificationRequestStatus status, String query) {
        requirePlatformAdmin();
        String normalizedQuery = query != null && !query.isBlank() ? query.trim().toLowerCase() : null;
        return requestRepository.findAllWithOrganization().stream()
                .filter(request -> request.getSubmittedAt() != null)
                .filter(request -> status == null || request.getStatus() == status)
                .filter(request -> normalizedQuery == null
                        || request.getOrganization().getName().toLowerCase().contains(normalizedQuery)
                        || request.getOrganization().getSlug().toLowerCase().contains(normalizedQuery))
                .map(request -> AdminVerificationRequestSummary.from(
                        request,
                        documentRepository.findByVerificationRequestId(request.getId()).size()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public VerificationRequestResponse getById(UUID requestId) {
        requirePlatformAdmin();
        OrganizationVerificationRequest request = findRequest(requestId);
        List<OrganizationVerificationDocument> documents =
                documentRepository.findByVerificationRequestId(request.getId());
        return VerificationRequestResponse.from(request, documents);
    }

    @Transactional
    public VerificationRequestResponse approve(UUID requestId, UserPrincipal principal) {
        requirePlatformAdmin();
        OrganizationVerificationRequest request = findPendingRequest(requestId);
        Organization organization = request.getOrganization();

        request.setStatus(VerificationRequestStatus.APPROVED);
        request.setReviewedAt(Instant.now(clock));
        request.setReviewedBy(referenceUser(principal.getId()));
        request.setRejectionReason(null);

        organization.setStatus(OrganizationStatus.VERIFIED);
        organization.setVerifiedAt(Instant.now(clock));
        organization.setVerifiedBy(referenceUser(principal.getId()));
        organization.setRejectionReason(null);

        notifyOwners(
                organization,
                NotificationType.ORGANIZATION_VERIFIED,
                "Verification approved",
                "Congratulations! %s is now a verified organization on Dwellio.".formatted(organization.getName()),
                request.getId()
        );

        return VerificationRequestResponse.from(
                request,
                documentRepository.findByVerificationRequestId(request.getId())
        );
    }

    @Transactional
    public VerificationRequestResponse reject(
            UUID requestId,
            UserPrincipal principal,
            String reason
    ) {
        requirePlatformAdmin();
        OrganizationVerificationRequest request = findPendingRequest(requestId);
        Organization organization = request.getOrganization();

        request.setStatus(VerificationRequestStatus.REJECTED);
        request.setReviewedAt(Instant.now(clock));
        request.setReviewedBy(referenceUser(principal.getId()));
        request.setRejectionReason(reason);

        organization.setStatus(OrganizationStatus.REJECTED);
        organization.setRejectionReason(reason);
        organization.setVerifiedAt(Instant.now(clock));
        organization.setVerifiedBy(referenceUser(principal.getId()));

        notifyOwners(
                organization,
                NotificationType.ORGANIZATION_VERIFICATION_REJECTED,
                "Verification rejected",
                "Verification for %s was declined. Reason: %s".formatted(organization.getName(), reason),
                request.getId()
        );

        return VerificationRequestResponse.from(
                request,
                documentRepository.findByVerificationRequestId(request.getId())
        );
    }

    @Transactional
    public VerificationRequestResponse requestMoreInfo(
            UUID requestId,
            UserPrincipal principal,
            String notes
    ) {
        requirePlatformAdmin();
        OrganizationVerificationRequest request = findPendingRequest(requestId);
        Organization organization = request.getOrganization();

        request.setStatus(VerificationRequestStatus.MORE_INFO_REQUIRED);
        request.setReviewedAt(Instant.now(clock));
        request.setReviewedBy(referenceUser(principal.getId()));
        request.setNotes(notes);
        request.setRejectionReason(null);

        notifyOwners(
                organization,
                NotificationType.ORGANIZATION_VERIFICATION_MORE_INFO,
                "More information needed",
                "Additional information is required for %s verification: %s"
                        .formatted(organization.getName(), notes),
                request.getId()
        );

        return VerificationRequestResponse.from(
                request,
                documentRepository.findByVerificationRequestId(request.getId())
        );
    }

    private OrganizationVerificationRequest findRequest(UUID requestId) {
        return requestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Verification request not found"));
    }

    private OrganizationVerificationRequest findPendingRequest(UUID requestId) {
        OrganizationVerificationRequest request = findRequest(requestId);
        if (request.getStatus() != VerificationRequestStatus.PENDING) {
            throw new BadRequestException("Only pending verification requests can be reviewed");
        }
        if (request.getSubmittedAt() == null) {
            throw new BadRequestException("Verification request has not been submitted");
        }
        return request;
    }

    private void requirePlatformAdmin() {
        if (!authorizationService.isPlatformAdmin()) {
            throw new ForbiddenException("Platform admin access required");
        }
    }

    private void notifyOwners(
            Organization organization,
            NotificationType type,
            String title,
            String body,
            UUID requestId
    ) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("organizationId", organization.getId().toString());
        payload.put("organizationSlug", organization.getSlug());
        payload.put("verificationRequestId", requestId.toString());
        membershipRepository.findActiveOwnersByOrganizationId(organization.getId()).forEach(owner ->
                notificationService.create(
                        owner.getUser().getId(),
                        organization.getId(),
                        type,
                        title,
                        body,
                        payload
                )
        );
    }

    private static User referenceUser(UUID userId) {
        User user = new User();
        user.setId(userId);
        return user;
    }
}
