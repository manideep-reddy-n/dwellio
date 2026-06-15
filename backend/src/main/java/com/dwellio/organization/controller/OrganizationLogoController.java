package com.dwellio.organization.controller;

import com.dwellio.accommodation.service.AccommodationGuard;
import com.dwellio.common.exception.BadRequestException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.common.storage.MediaStorageService;
import com.dwellio.organization.dto.OrganizationResponse;
import com.dwellio.organization.service.OrganizationService;
import java.io.IOException;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/organizations/{organizationId}/logo")
@RequiredArgsConstructor
public class OrganizationLogoController {

    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");

    private final OrganizationService organizationService;
    private final AuthorizationService authorizationService;
    private final AccommodationGuard accommodationGuard;
    private final MediaStorageService mediaStorage;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:update')")
    public OrganizationResponse uploadLogo(
            @PathVariable UUID organizationId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        authorizationService.requirePermission(organizationId, "organization:update");
        var organization = accommodationGuard.requireOrganization(organizationId);
        if (file.isEmpty() || file.getSize() > 2 * 1024 * 1024) {
            throw new BadRequestException("Logo must be under 2MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Logo must be JPG, PNG, or WEBP");
        }

        if (organization.getLogoUrl() != null && organization.getLogoUrl().startsWith("http")) {
            mediaStorage.deleteImage(organization.getLogoUrl());
        }

        String publicId = organizationId.toString();
        var stored = mediaStorage.storeImage(file, "logos", publicId);
        return organizationService.updateLogoUrl(organizationId, stored.url());
    }

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:update')")
    public OrganizationResponse getOrg(@PathVariable UUID organizationId) {
        accommodationGuard.requireOrganization(organizationId);
        return organizationService.getById(organizationId);
    }
}
