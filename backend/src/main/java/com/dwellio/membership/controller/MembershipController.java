package com.dwellio.membership.controller;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.membership.dto.MembershipResponse;
import com.dwellio.membership.dto.StaffInviteRequest;
import com.dwellio.membership.dto.StaffInviteResponse;
import com.dwellio.membership.service.MembershipService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/organizations/{organizationId}")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;

    @GetMapping("/memberships")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'resident:read')")
    public List<MembershipResponse> listMemberships(@PathVariable UUID organizationId) {
        return membershipService.listMemberships(organizationId);
    }

    @PostMapping("/staff/invite")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'staff:manage')")
    public StaffInviteResponse inviteStaff(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StaffInviteRequest request
    ) {
        return membershipService.inviteStaff(organizationId, principal.getId(), request);
    }
}
