package com.dwellio.ledger.controller;

import com.dwellio.common.security.AuthorizationService;
import com.dwellio.common.security.MembershipContext;
import com.dwellio.ledger.dto.LedgerEntryResponse;
import com.dwellio.ledger.service.LedgerQueryService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/ledger")
@RequiredArgsConstructor
public class LedgerController {

    private final LedgerQueryService ledgerQueryService;
    private final AuthorizationService authorizationService;

    @GetMapping
    @PreAuthorize("@authz.hasPermission(#organizationId, 'payment:manage')")
    public List<LedgerEntryResponse> list(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) UUID membershipId
    ) {
        return ledgerQueryService.listForOrganization(organizationId, membershipId);
    }

    @GetMapping("/mine")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'payment:read_own')")
    public List<LedgerEntryResponse> listMine(@PathVariable UUID organizationId) {
        MembershipContext context = authorizationService.requirePermission(organizationId, "payment:read_own");
        return ledgerQueryService.listForMembership(organizationId, context.getMembershipId());
    }
}
