package com.dwellio.revenue.controller;

import com.dwellio.revenue.dto.DefaulterResponse;
import com.dwellio.revenue.dto.RevenueSummaryResponse;
import com.dwellio.revenue.service.RevenueService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}/revenue")
@RequiredArgsConstructor
public class RevenueController {

    private final RevenueService revenueService;

    @GetMapping("/summary")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'payment:read')")
    public RevenueSummaryResponse summary(@PathVariable UUID organizationId) {
        return revenueService.getSummary(organizationId);
    }

    @GetMapping("/defaulters")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'payment:read')")
    public List<DefaulterResponse> defaulters(@PathVariable UUID organizationId) {
        return revenueService.listDefaulters(organizationId);
    }

    @PostMapping("/refresh")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'payment:manage')")
    public RevenueSummaryResponse refresh(@PathVariable UUID organizationId) {
        return revenueService.refresh(organizationId);
    }
}
