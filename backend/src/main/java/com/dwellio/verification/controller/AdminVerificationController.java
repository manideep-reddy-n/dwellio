package com.dwellio.verification.controller;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.domain.enums.VerificationRequestStatus;
import com.dwellio.verification.dto.AdminVerificationRequestSummary;
import com.dwellio.verification.dto.RejectVerificationRequest;
import com.dwellio.verification.dto.RequestMoreInfoBody;
import com.dwellio.verification.dto.VerificationRequestResponse;
import com.dwellio.verification.service.AdminVerificationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/verification-requests")
@RequiredArgsConstructor
public class AdminVerificationController {

    private final AdminVerificationService adminVerificationService;

    @GetMapping
    public List<AdminVerificationRequestSummary> list(
            @RequestParam(required = false) VerificationRequestStatus status,
            @RequestParam(required = false) String q
    ) {
        return adminVerificationService.list(status, q);
    }

    @GetMapping("/{requestId}")
    public VerificationRequestResponse getById(@PathVariable UUID requestId) {
        return adminVerificationService.getById(requestId);
    }

    @PostMapping("/{requestId}/approve")
    public VerificationRequestResponse approve(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return adminVerificationService.approve(requestId, principal);
    }

    @PostMapping("/{requestId}/reject")
    public VerificationRequestResponse reject(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RejectVerificationRequest request
    ) {
        return adminVerificationService.reject(requestId, principal, request.reason());
    }

    @PostMapping("/{requestId}/request-more-info")
    public VerificationRequestResponse requestMoreInfo(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RequestMoreInfoBody request
    ) {
        return adminVerificationService.requestMoreInfo(requestId, principal, request.notes());
    }
}
