package com.dwellio.admin.controller;

import com.dwellio.admin.dto.AdminOrganizationSummary;
import com.dwellio.admin.dto.RejectOrganizationRequest;
import com.dwellio.admin.dto.ReviewSuspensionAppealRequest;
import com.dwellio.admin.service.AdminOrganizationDetailService;
import com.dwellio.admin.service.AdminOrganizationService;
import com.dwellio.accommodation.dto.AccommodationVisualizationResponse;
import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.domain.enums.OrganizationStatus;
import com.dwellio.membership.dto.MembershipResponse;
import com.dwellio.occupancy.dto.OccupancyResponse;
import com.dwellio.organization.dto.SuspensionAppealResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/organizations")
@RequiredArgsConstructor
@PreAuthorize("@authz.isPlatformAdmin()")
public class AdminOrganizationController {

    private final AdminOrganizationService adminOrganizationService;
    private final AdminOrganizationDetailService adminOrganizationDetailService;

    @GetMapping
    public List<AdminOrganizationSummary> list(@RequestParam(required = false) OrganizationStatus status) {
        return adminOrganizationService.listAll(status);
    }

    @GetMapping("/{organizationId}")
    public AdminOrganizationSummary get(@PathVariable UUID organizationId) {
        return adminOrganizationService.getById(organizationId);
    }

    @PostMapping("/{organizationId}/verify")
    public AdminOrganizationSummary verify(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return adminOrganizationService.verify(organizationId, principal);
    }

    @PostMapping("/{organizationId}/reject")
    public AdminOrganizationSummary reject(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RejectOrganizationRequest request
    ) {
        return adminOrganizationService.reject(organizationId, principal, request);
    }

    @PostMapping("/{organizationId}/suspend")
    public AdminOrganizationSummary suspend(@PathVariable UUID organizationId) {
        return adminOrganizationService.suspend(organizationId);
    }

    @PostMapping("/{organizationId}/unsuspend")
    public AdminOrganizationSummary unsuspend(@PathVariable UUID organizationId) {
        return adminOrganizationService.unsuspend(organizationId);
    }

    @GetMapping("/{organizationId}/members")
    public List<MembershipResponse> members(@PathVariable UUID organizationId) {
        return adminOrganizationDetailService.listMembers(organizationId);
    }

    @GetMapping("/{organizationId}/residents")
    public List<MembershipResponse> residents(@PathVariable UUID organizationId) {
        return adminOrganizationDetailService.listResidents(organizationId);
    }

    @GetMapping("/{organizationId}/accommodation/visualization")
    public AccommodationVisualizationResponse visualization(@PathVariable UUID organizationId) {
        return adminOrganizationDetailService.visualization(organizationId);
    }

    @GetMapping("/{organizationId}/occupancies")
    public List<OccupancyResponse> occupancies(@PathVariable UUID organizationId) {
        return adminOrganizationDetailService.listOccupancies(organizationId);
    }

    @GetMapping("/{organizationId}/suspension-appeals")
    public List<SuspensionAppealResponse> appeals(@PathVariable UUID organizationId) {
        return adminOrganizationService.listAppeals(organizationId);
    }

    @PostMapping("/{organizationId}/suspension-appeals/{appealId}/review")
    public SuspensionAppealResponse reviewAppeal(
            @PathVariable UUID organizationId,
            @PathVariable UUID appealId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReviewSuspensionAppealRequest request
    ) {
        return adminOrganizationService.reviewAppeal(
                organizationId, appealId, principal, request.notes());
    }
}
