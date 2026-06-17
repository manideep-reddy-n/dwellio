package com.dwellio.resident.controller;

import com.dwellio.resident.dto.ResidentLifecycleProfileResponse;
import com.dwellio.resident.service.ResidentLifecycleService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/residents")
@RequiredArgsConstructor
public class ResidentController {

    private final ResidentLifecycleService residentLifecycleService;

    @GetMapping("/{membershipId}/profile")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'resident:read')")
    public ResidentLifecycleProfileResponse getProfile(
            @PathVariable UUID organizationId,
            @PathVariable UUID membershipId
    ) {
        return residentLifecycleService.getProfile(organizationId, membershipId);
    }
}
