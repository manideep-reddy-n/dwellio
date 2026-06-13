package com.dwellio.joinrequest.controller;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.joinrequest.dto.JoinRequestResponse;
import com.dwellio.joinrequest.dto.RejectJoinRequestRequest;
import com.dwellio.joinrequest.dto.SubmitJoinRequestRequest;
import com.dwellio.joinrequest.service.JoinRequestService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/join-requests")
@RequiredArgsConstructor
public class JoinRequestController {

    private final JoinRequestService joinRequestService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JoinRequestResponse submit(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SubmitJoinRequestRequest request
    ) {
        return joinRequestService.submit(organizationId, principal.getId(), request);
    }

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'resident:approve')")
    public List<JoinRequestResponse> list(@PathVariable UUID organizationId) {
        return joinRequestService.list(organizationId);
    }

    @PostMapping("/{joinRequestId}/approve")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'resident:approve')")
    public JoinRequestResponse approve(
            @PathVariable UUID organizationId,
            @PathVariable UUID joinRequestId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return joinRequestService.approve(organizationId, joinRequestId, principal.getId());
    }

    @PostMapping("/{joinRequestId}/reject")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'resident:approve')")
    public JoinRequestResponse reject(
            @PathVariable UUID organizationId,
            @PathVariable UUID joinRequestId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RejectJoinRequestRequest request
    ) {
        return joinRequestService.reject(organizationId, joinRequestId, principal.getId(), request);
    }

    @PostMapping("/{joinRequestId}/cancel")
    public JoinRequestResponse cancel(
            @PathVariable UUID organizationId,
            @PathVariable UUID joinRequestId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return joinRequestService.cancel(organizationId, joinRequestId, principal.getId());
    }
}
