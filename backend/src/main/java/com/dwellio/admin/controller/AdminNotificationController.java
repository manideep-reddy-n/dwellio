package com.dwellio.admin.controller;

import com.dwellio.admin.dto.AdminNotificationMetricsResponse;
import com.dwellio.admin.dto.AdminPagedResponse;
import com.dwellio.admin.service.AdminNotificationAdminService;
import com.dwellio.notification.dto.NotificationDeliveryLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("@authz.isPlatformAdmin()")
public class AdminNotificationController {

    private final AdminNotificationAdminService adminNotificationAdminService;

    @GetMapping("/metrics")
    public AdminNotificationMetricsResponse metrics() {
        return adminNotificationAdminService.metrics();
    }

    @GetMapping("/delivery-log")
    public AdminPagedResponse<NotificationDeliveryLogResponse> deliveryLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminNotificationAdminService.deliveryLogs(page, size);
    }
}
