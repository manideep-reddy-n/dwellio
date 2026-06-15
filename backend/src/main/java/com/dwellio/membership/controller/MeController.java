package com.dwellio.membership.controller;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.membership.dto.ResidentProfileResponse;
import com.dwellio.membership.dto.UpdateResidentProfileRequest;
import com.dwellio.membership.dto.UserMembershipResponse;
import com.dwellio.membership.service.MeMembershipService;
import com.dwellio.membership.service.ResidentProfileService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
public class MeController {

    private final MeMembershipService meMembershipService;
    private final ResidentProfileService residentProfileService;

    @GetMapping("/memberships")
    public List<UserMembershipResponse> listMyMemberships(@AuthenticationPrincipal UserPrincipal principal) {
        return meMembershipService.listMyMemberships(principal.getId());
    }

    @GetMapping("/memberships/by-slug/{slug}")
    public UserMembershipResponse getMyMembershipBySlug(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slug
    ) {
        return meMembershipService.getMyMembership(principal, slug);
    }

    @PostMapping("/memberships/{organizationId}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leaveOrganization(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID organizationId
    ) {
        meMembershipService.leaveOrganization(principal.getId(), organizationId);
    }

    @GetMapping("/resident-profile/{slug}")
    public ResidentProfileResponse getResidentProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slug
    ) {
        return residentProfileService.getProfile(principal.getId(), slug);
    }

    @PatchMapping("/resident-profile/{slug}")
    public ResidentProfileResponse updateResidentProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slug,
            @Valid @RequestBody UpdateResidentProfileRequest request
    ) {
        return residentProfileService.updateProfile(principal.getId(), slug, request);
    }
}
