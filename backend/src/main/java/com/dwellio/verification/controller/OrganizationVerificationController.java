package com.dwellio.verification.controller;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.domain.enums.VerificationDocumentType;
import com.dwellio.verification.dto.SubmitVerificationRequest;
import com.dwellio.verification.dto.VerificationDocumentResponse;
import com.dwellio.verification.dto.VerificationRequestResponse;
import com.dwellio.verification.service.OrganizationVerificationService;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class OrganizationVerificationController {

    private final OrganizationVerificationService verificationService;

    @GetMapping("/organizations/{organizationId}/verification-request")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'verification:manage')")
    public VerificationRequestResponse getRequest(@PathVariable UUID organizationId) {
        return verificationService.getCurrentRequest(organizationId);
    }

    @PostMapping("/organizations/{organizationId}/verification-request")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'verification:manage')")
    public VerificationRequestResponse submit(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) SubmitVerificationRequest request
    ) {
        String notes = request != null ? request.notes() : null;
        return verificationService.submit(organizationId, principal, notes);
    }

    @PostMapping(
            value = "/organizations/{organizationId}/verification-documents",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("@authz.hasPermission(#organizationId, 'verification:manage')")
    public VerificationDocumentResponse uploadDocument(
            @PathVariable UUID organizationId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") VerificationDocumentType documentType
    ) throws IOException {
        return verificationService.uploadDocument(organizationId, file, documentType);
    }

    @DeleteMapping("/verification-documents/{documentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("@authz.hasPermission(@verificationDocumentAuth.organizationId(#documentId), 'verification:manage')")
    public void deleteDocument(@PathVariable UUID documentId) {
        verificationService.deleteDocument(documentId);
    }
}
