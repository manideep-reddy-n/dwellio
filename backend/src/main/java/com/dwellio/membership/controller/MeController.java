package com.dwellio.membership.controller;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.membership.dto.UserMembershipResponse;
import com.dwellio.membership.service.MeMembershipService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
public class MeController {

    private final MeMembershipService meMembershipService;

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
}
