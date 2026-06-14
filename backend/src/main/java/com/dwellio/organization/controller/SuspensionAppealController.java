package com.dwellio.organization.controller;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.organization.dto.SubmitSuspensionAppealRequest;
import com.dwellio.organization.dto.SuspensionAppealResponse;
import com.dwellio.organization.service.SuspensionAppealService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/suspension-appeals")
@RequiredArgsConstructor
public class SuspensionAppealController {

    private final SuspensionAppealService suspensionAppealService;

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:read')")
    public List<SuspensionAppealResponse> list(@PathVariable UUID organizationId) {
        return suspensionAppealService.listForOrganization(organizationId);
    }

    @GetMapping("/pending")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:read')")
    public SuspensionAppealResponse pending(@PathVariable UUID organizationId) {
        return suspensionAppealService.getLatestPending(organizationId);
    }

    @PostMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'organization:update')")
    public SuspensionAppealResponse submit(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SubmitSuspensionAppealRequest request
    ) {
        return suspensionAppealService.submit(organizationId, principal, request);
    }
}
