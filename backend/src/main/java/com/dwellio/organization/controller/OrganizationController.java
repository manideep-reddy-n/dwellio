package com.dwellio.organization.controller;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.organization.dto.CreateOrganizationRequest;
import com.dwellio.organization.dto.OrganizationResponse;
import com.dwellio.organization.dto.UpdateOrganizationRequest;
import com.dwellio.organization.service.OrganizationService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrganizationResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateOrganizationRequest request
    ) {
        return organizationService.create(principal.getId(), request);
    }

    @GetMapping("/{organizationId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:read')")
    public OrganizationResponse getById(@PathVariable UUID organizationId) {
        return organizationService.getById(organizationId);
    }

    @GetMapping("/by-slug/{slug}")
    @PreAuthorize("@authz.hasPermissionBySlug(#slug, 'organization:read')")
    public OrganizationResponse getBySlug(@PathVariable String slug) {
        return organizationService.getBySlug(slug);
    }

    @PatchMapping("/{organizationId}")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:update')")
    public OrganizationResponse update(
            @PathVariable UUID organizationId,
            @Valid @RequestBody UpdateOrganizationRequest request
    ) {
        return organizationService.update(organizationId, request);
    }

    @PatchMapping("/by-slug/{slug}")
    @PreAuthorize("@authz.hasPermissionBySlug(#slug, 'organization:update')")
    public OrganizationResponse updateBySlug(
            @PathVariable String slug,
            @Valid @RequestBody UpdateOrganizationRequest request
    ) {
        UUID organizationId = organizationService.findActiveOrganizationBySlug(slug).getId();
        return organizationService.update(organizationId, request);
    }
}
