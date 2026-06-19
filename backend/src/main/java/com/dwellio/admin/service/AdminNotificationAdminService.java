package com.dwellio.admin.service;

import com.dwellio.admin.dto.AdminAuditLogSummary;
import com.dwellio.admin.dto.AdminNotificationMetricsResponse;
import com.dwellio.admin.dto.AdminPagedResponse;
import com.dwellio.audit.repository.AuditLogRepository;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.AuditLog;
import com.dwellio.domain.entity.NotificationDeliveryLog;
import com.dwellio.domain.enums.NotificationDeliveryStatus;
import com.dwellio.notification.repository.NotificationDeliveryLogRepository;
import com.dwellio.platform.service.PlatformConfigService;
import com.dwellio.push.repository.PushSubscriptionRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminNotificationAdminService {

    private final AuthorizationService authorizationService;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final NotificationDeliveryLogRepository deliveryLogRepository;
    private final PlatformConfigService platformConfigService;
    private final AuditLogRepository auditLogRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public AdminNotificationMetricsResponse metrics() {
        authorizationService.requirePlatformAdmin();
        Instant since = Instant.now(clock).minus(24, ChronoUnit.HOURS);
        return new AdminNotificationMetricsResponse(
                pushSubscriptionRepository.countActive(),
                deliveryLogRepository.countByStatusSince(NotificationDeliveryStatus.SENT, since),
                deliveryLogRepository.countByStatusSince(NotificationDeliveryStatus.FAILED, since),
                deliveryLogRepository.countByStatusSince(NotificationDeliveryStatus.SKIPPED, since),
                platformConfigService.isEnabled("notifications.in_app.enabled", "enabled", true),
                platformConfigService.isEnabled("notifications.push.enabled", "enabled", true)
        );
    }

    @Transactional(readOnly = true)
    public AdminPagedResponse<AdminAuditLogSummary> auditLogs(int page, int size) {
        authorizationService.requirePlatformAdmin();
        Page<AuditLog> logs = auditLogRepository.findAllOrderByCreatedAtDesc(PageRequest.of(page, size));
        return AdminPagedResponse.of(
                logs.map(this::toAuditSummary).getContent(),
                page,
                size,
                logs.getTotalElements()
        );
    }

    @Transactional(readOnly = true)
    public AdminPagedResponse<com.dwellio.notification.dto.NotificationDeliveryLogResponse> deliveryLogs(
            int page,
            int size
    ) {
        authorizationService.requirePlatformAdmin();
        Page<NotificationDeliveryLog> logs =
                deliveryLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
        return AdminPagedResponse.of(
                logs.map(log -> new com.dwellio.notification.dto.NotificationDeliveryLogResponse(
                        log.getId(),
                        log.getNotification() != null ? log.getNotification().getId() : null,
                        log.getUser().getId(),
                        log.getChannel(),
                        log.getStatus(),
                        log.getErrorMessage(),
                        log.getCreatedAt()
                )).getContent(),
                page,
                size,
                logs.getTotalElements()
        );
    }

    private AdminAuditLogSummary toAuditSummary(AuditLog log) {
        return new AdminAuditLogSummary(
                log.getId(),
                log.getActorUser().getFullName(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getOrganization() != null ? log.getOrganization().getName() : null,
                log.getMetadata(),
                log.getCreatedAt()
        );
    }
}
