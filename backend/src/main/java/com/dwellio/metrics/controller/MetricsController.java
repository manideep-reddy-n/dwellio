package com.dwellio.metrics.controller;

import com.dwellio.metrics.dto.OrganizationMetricsResponse;
import com.dwellio.metrics.service.MetricsProjectionService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/organizations/{organizationId}")
@RequiredArgsConstructor
public class MetricsController {

    private final MetricsProjectionService metricsProjectionService;

    @GetMapping("/dashboard")
    @PreAuthorize("@authz.hasPermission(#organizationId, 'dashboard:view')")
    public OrganizationMetricsResponse dashboard(@PathVariable UUID organizationId) {
        return OrganizationMetricsResponse.from(metricsProjectionService.getCache(organizationId));
    }

    @PostMapping("/metrics/rebuild")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("@authz.hasPermission(#organizationId, 'building:manage')")
    public OrganizationMetricsResponse rebuild(@PathVariable UUID organizationId) {
        return OrganizationMetricsResponse.from(metricsProjectionService.rebuild(organizationId));
    }
}
