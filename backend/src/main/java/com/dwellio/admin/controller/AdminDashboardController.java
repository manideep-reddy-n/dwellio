package com.dwellio.admin.controller;

import com.dwellio.admin.dto.AdminDashboardMetricsResponse;
import com.dwellio.admin.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("@authz.isPlatformAdmin()")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping
    public AdminDashboardMetricsResponse metrics() {
        return adminDashboardService.getMetrics();
    }
}
