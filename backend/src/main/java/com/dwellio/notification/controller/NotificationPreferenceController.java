package com.dwellio.notification.controller;

import com.dwellio.domain.enums.NotificationPreferenceCategory;
import com.dwellio.notification.dto.NotificationPreferenceResponse;
import com.dwellio.notification.dto.UpdateNotificationPreferenceRequest;
import com.dwellio.notification.service.NotificationPreferenceService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.dwellio.auth.security.UserPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notification-preferences")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;

    @GetMapping
    public List<NotificationPreferenceResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return preferenceService.listForUser(principal.getId());
    }

    @PatchMapping("/{category}")
    public NotificationPreferenceResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable NotificationPreferenceCategory category,
            @Valid @RequestBody UpdateNotificationPreferenceRequest request
    ) {
        return preferenceService.update(principal.getId(), category, request);
    }
}
