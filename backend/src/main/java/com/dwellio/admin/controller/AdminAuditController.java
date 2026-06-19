package com.dwellio.admin.controller;

import com.dwellio.admin.dto.AdminAuditLogSummary;
import com.dwellio.admin.dto.AdminPagedResponse;
import com.dwellio.admin.service.AdminNotificationAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("@authz.isPlatformAdmin()")
public class AdminAuditController {

    private final AdminNotificationAdminService adminNotificationAdminService;

    @GetMapping
    public AdminPagedResponse<AdminAuditLogSummary> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminNotificationAdminService.auditLogs(page, size);
    }
}
