package com.dwellio.notification.controller;

import com.dwellio.auth.security.UserPrincipal;
import com.dwellio.notification.dto.NotificationResponse;
import com.dwellio.notification.dto.PagedNotificationResponse;
import com.dwellio.notification.dto.UnreadNotificationCountResponse;
import com.dwellio.notification.service.NotificationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public PagedNotificationResponse list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID organizationId,
            @RequestParam(required = false, defaultValue = "false") boolean unreadOnly,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return notificationService.listInbox(principal.getId(), organizationId, unreadOnly, page, size);
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public UnreadNotificationCountResponse unreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return notificationService.unreadCount(principal.getId());
    }

    @PatchMapping("/{notificationId}/read")
    @PreAuthorize("isAuthenticated()")
    public NotificationResponse markRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID notificationId
    ) {
        return notificationService.markRead(principal.getId(), notificationId);
    }

    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public void markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllRead(principal.getId());
    }
}
