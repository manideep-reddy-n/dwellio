package com.dwellio.leaverequest.controller;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.leaverequest.dto.LeaveRequestResponse;
import com.dwellio.leaverequest.dto.SubmitLeaveRequestRequest;
import com.dwellio.leaverequest.service.LeaveRequestService;
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
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;

    @PostMapping("/users/me/memberships/{organizationId}/leave-request")
    @ResponseStatus(HttpStatus.CREATED)
    public LeaveRequestResponse submitLeaveRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID organizationId,
            @Valid @RequestBody(required = false) SubmitLeaveRequestRequest request
    ) {
        return leaveRequestService.submit(
                principal.getId(),
                organizationId,
                request != null ? request : new SubmitLeaveRequestRequest(null)
        );
    }

    @GetMapping("/organizations/{organizationId}/leave-requests")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'resident:manage')")
    public List<LeaveRequestResponse> list(@PathVariable UUID organizationId) {
        return leaveRequestService.list(organizationId);
    }

    @PostMapping("/organizations/{organizationId}/leave-requests/{leaveRequestId}/approve")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'resident:manage')")
    public LeaveRequestResponse approve(
            @PathVariable UUID organizationId,
            @PathVariable UUID leaveRequestId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return leaveRequestService.approve(organizationId, leaveRequestId, principal.getId());
    }

    @PostMapping("/organizations/{organizationId}/leave-requests/{leaveRequestId}/reject")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'resident:manage')")
    public LeaveRequestResponse reject(
            @PathVariable UUID organizationId,
            @PathVariable UUID leaveRequestId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return leaveRequestService.reject(organizationId, leaveRequestId, principal.getId());
    }
}
