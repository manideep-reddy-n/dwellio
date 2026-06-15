package com.dwellio.verification.service;

import com.dwellio.accommodation.service.AccommodationGuard;
import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.exception.ForbiddenException;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.common.security.MembershipContext;
import com.dwellio.common.storage.MediaStorageService;
import com.dwellio.domain.entity.Membership;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.OrganizationVerificationDocument;
import com.dwellio.domain.entity.OrganizationVerificationRequest;
import com.dwellio.domain.enums.NotificationType;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.domain.enums.OrganizationType;
import com.dwellio.domain.enums.VerificationDocumentType;
import com.dwellio.domain.enums.VerificationRequestStatus;
import com.dwellio.membership.repository.MembershipRepository;
import com.dwellio.notification.service.NotificationService;
import com.dwellio.verification.dto.VerificationDocumentResponse;
import com.dwellio.verification.dto.VerificationRequestResponse;
import com.dwellio.verification.repository.OrganizationVerificationDocumentRepository;
import com.dwellio.verification.repository.OrganizationVerificationRequestRepository;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class OrganizationVerificationService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "application/pdf"
    );

    private final OrganizationVerificationRequestRepository requestRepository;
    private final OrganizationVerificationDocumentRepository documentRepository;
    private final AccommodationGuard accommodationGuard;
    private final AuthorizationService authorizationService;
    private final MembershipRepository membershipRepository;
    private final NotificationService notificationService;
    private final MediaStorageService mediaStorage;
    private final Clock clock;

    @Transactional(readOnly = true)
    public VerificationRequestResponse getCurrentRequest(UUID organizationId) {
        authorizationService.requirePermission(organizationId, "verification:manage");
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        List<OrganizationVerificationDocument> draftDocs = documentRepository.findDraftByOrganizationId(organizationId);

        return requestRepository.findFirstByOrganization_IdOrderByCreatedAtDesc(organizationId)
                .map(request -> toResponse(request, documentsForRequest(request, draftDocs)))
                .orElseGet(() -> draftResponse(organization, draftDocs));
    }

    @Transactional
    public VerificationRequestResponse submit(
            UUID organizationId,
            UserPrincipal principal,
            String notes
    ) {
        MembershipContext context = authorizationService.requirePermission(organizationId, "verification:manage");
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        validateSubmittableOrganization(organization);

        OrganizationVerificationRequest request = resolveRequestForSubmit(organization, context, notes);
        ensureHasDocuments(organization, request);

        List<OrganizationVerificationDocument> draftDocs = documentRepository.findDraftByOrganizationId(organizationId);

        for (OrganizationVerificationDocument document : draftDocs) {
            document.setVerificationRequest(request);
            documentRepository.save(document);
        }

        request.setStatus(VerificationRequestStatus.PENDING);
        request.setSubmittedAt(Instant.now(clock));
        request.setRejectionReason(null);
        request.setReviewedAt(null);
        request.setReviewedBy(null);
        if (notes != null && !notes.isBlank()) {
            request.setNotes(notes.trim());
        }

        organization.setStatus(OrganizationStatus.PENDING_VERIFICATION);
        organization.setRejectionReason(null);

        request = requestRepository.save(request);
        notifyOwners(
                organization,
                NotificationType.ORGANIZATION_VERIFICATION_SUBMITTED,
                "Verification submitted",
                "Your verification request for %s has been submitted and is under review."
                        .formatted(organization.getName()),
                request.getId()
        );

        return toResponse(request, documentsForRequest(request, List.of()));
    }

    @Transactional
    public VerificationDocumentResponse uploadDocument(
            UUID organizationId,
            MultipartFile file,
            VerificationDocumentType documentType
    ) throws IOException {
        authorizationService.requirePermission(organizationId, "verification:manage");
        Organization organization = accommodationGuard.requireOrganization(organizationId);
        validateEditableOrganization(organization);
        validateFile(file);

        String ext = extension(file.getContentType());
        String filename = UUID.randomUUID() + "." + ext;
        MediaStorageService.StoredMedia stored = mediaStorage.storeImageAutoNamed(file, "verification-docs", filename);

        OrganizationVerificationDocument document = new OrganizationVerificationDocument();
        document.setId(UUID.randomUUID());
        document.setOrganization(organization);
        document.setDocumentType(documentType);
        document.setFileUrl(stored.url());
        document.setUploadedAt(Instant.now(clock));

        OrganizationVerificationRequest activeRequest = findEditableRequest(organizationId).orElse(null);
        if (activeRequest != null) {
            document.setVerificationRequest(activeRequest);
        }

        return VerificationDocumentResponse.from(documentRepository.save(document));
    }

    @Transactional
    public void deleteDocument(UUID documentId) {
        OrganizationVerificationDocument document = documentRepository.findByIdWithOrganization(documentId)
                .orElseThrow(() -> new NotFoundException("Document not found"));

        UUID organizationId = document.getOrganization().getId();
        authorizationService.requirePermission(organizationId, "verification:manage");
        Organization organization = document.getOrganization();
        validateEditableOrganization(organization);

        if (document.getVerificationRequest() != null) {
            VerificationRequestStatus status = document.getVerificationRequest().getStatus();
            if (status != VerificationRequestStatus.MORE_INFO_REQUIRED
                    && status != VerificationRequestStatus.REJECTED
                    && organization.getStatus() != OrganizationStatus.DRAFT) {
                throw new BadRequestException("Documents cannot be deleted while request is under review");
            }
        }

        documentRepository.delete(document);
    }

    private VerificationRequestResponse draftResponse(
            Organization organization,
            List<OrganizationVerificationDocument> draftDocs
    ) {
        return new VerificationRequestResponse(
                null,
                organization.getId(),
                organization.getName(),
                organization.getSlug(),
                organization.getStatus(),
                null,
                null,
                organization.getRejectionReason(),
                null,
                null,
                null,
                null,
                null,
                null,
                draftDocs.stream().map(VerificationDocumentResponse::from).toList()
        );
    }

    private OrganizationVerificationRequest resolveRequestForSubmit(
            Organization organization,
            MembershipContext context,
            String notes
    ) {
        return requestRepository.findFirstByOrganization_IdOrderByCreatedAtDesc(organization.getId())
                .filter(request -> request.getStatus() == VerificationRequestStatus.MORE_INFO_REQUIRED)
                .orElseGet(() -> {
                    OrganizationVerificationRequest request = new OrganizationVerificationRequest();
                    request.setId(UUID.randomUUID());
                    request.setOrganization(organization);
                    request.setSubmittedByMembership(referenceMembership(context.getMembershipId()));
                    request.setStatus(VerificationRequestStatus.PENDING);
                    if (notes != null && !notes.isBlank()) {
                        request.setNotes(notes.trim());
                    }
                    return requestRepository.save(request);
                });
    }

    private java.util.Optional<OrganizationVerificationRequest> findEditableRequest(UUID organizationId) {
        return requestRepository.findFirstByOrganization_IdOrderByCreatedAtDesc(organizationId)
                .filter(request -> request.getStatus() == VerificationRequestStatus.MORE_INFO_REQUIRED);
    }

    private List<OrganizationVerificationDocument> documentsForRequest(
            OrganizationVerificationRequest request,
            List<OrganizationVerificationDocument> draftDocs
    ) {
        List<OrganizationVerificationDocument> linked = documentRepository.findByVerificationRequestId(request.getId());
        if (linked.isEmpty() && request.getSubmittedAt() == null) {
            return draftDocs;
        }
        return linked;
    }

    private VerificationRequestResponse toResponse(
            OrganizationVerificationRequest request,
            List<OrganizationVerificationDocument> documents
    ) {
        return VerificationRequestResponse.from(request, documents);
    }

    private void validateSubmittableOrganization(Organization organization) {
        OrganizationStatus status = organization.getStatus();
        if (status == OrganizationStatus.VERIFIED) {
            throw new BadRequestException("Organization is already verified");
        }
        if (status == OrganizationStatus.SUSPENDED) {
            throw new BadRequestException("Suspended organizations cannot submit verification");
        }
        if (status == OrganizationStatus.PENDING_VERIFICATION
                && requestRepository.existsByOrganizationIdAndStatus(
                        organization.getId(), VerificationRequestStatus.PENDING)) {
            throw new BadRequestException("A verification request is already pending review");
        }
    }

    private void ensureHasDocuments(Organization organization, OrganizationVerificationRequest request) {
        if (!requiresDocuments(organization.getType())) {
            return;
        }
        long draftCount = documentRepository.findDraftByOrganizationId(organization.getId()).size();
        long linkedCount = documentRepository.findByVerificationRequestId(request.getId()).size();
        if (draftCount + linkedCount < 1) {
            throw new BadRequestException("At least one verification document is required");
        }
    }

    private void validateEditableOrganization(Organization organization) {
        if (organization.getStatus() == OrganizationStatus.VERIFIED) {
            throw new BadRequestException("Verified organizations cannot modify verification documents");
        }
        if (organization.getStatus() == OrganizationStatus.SUSPENDED) {
            throw new BadRequestException("Suspended organizations cannot modify verification documents");
        }
        if (organization.getStatus() == OrganizationStatus.PENDING_VERIFICATION) {
            boolean underReview = requestRepository.findFirstByOrganization_IdOrderByCreatedAtDesc(organization.getId())
                    .map(request -> request.getStatus() == VerificationRequestStatus.PENDING)
                    .orElse(true);
            if (underReview) {
                throw new BadRequestException("Documents cannot be changed while verification is pending review");
            }
        }
    }

    static boolean requiresDocuments(OrganizationType type) {
        return type == OrganizationType.HOSTEL
                || type == OrganizationType.PG
                || type == OrganizationType.GATED_COMMUNITY;
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
        for (Membership owner : membershipRepository.findActiveOwnersByOrganizationId(organization.getId())) {
            notificationService.create(
                    owner.getUser().getId(),
                    organization.getId(),
                    type,
                    title,
                    body,
                    payload
            );
        }
    }

    private static void validateFile(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > 10 * 1024 * 1024) {
            throw new BadRequestException("Document must be under 10MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Document must be PDF, JPG, PNG, or WEBP");
        }
    }

    private static String extension(String contentType) {
        if (contentType == null) {
            return "jpg";
        }
        return switch (contentType.toLowerCase()) {
            case "application/pdf" -> "pdf";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "jpg";
        };
    }

    private static Membership referenceMembership(UUID membershipId) {
        Membership membership = new Membership();
        membership.setId(membershipId);
        return membership;
    }
}
