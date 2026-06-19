package com.dwellio.notification.service;

import com.dwellio.auth.repository.UserRepository;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.domain.entity.NotificationPreference;
import com.dwellio.domain.entity.User;
import com.dwellio.domain.enums.NotificationPreferenceCategory;
import com.dwellio.notification.dto.NotificationPreferenceResponse;
import com.dwellio.notification.dto.UpdateNotificationPreferenceRequest;
import com.dwellio.notification.repository.NotificationPreferenceRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    @Transactional
    public List<NotificationPreferenceResponse> listForUser(UUID userId) {
        ensureDefaults(userId);
        return preferenceRepository.findAllByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public NotificationPreferenceResponse update(
            UUID userId,
            NotificationPreferenceCategory category,
            UpdateNotificationPreferenceRequest request
    ) {
        ensureDefaults(userId);
        NotificationPreference preference = preferenceRepository.findByUserIdAndCategory(userId, category)
                .orElseThrow(() -> new NotFoundException("Preference not found"));

        if (request.inAppEnabled() != null) {
            preference.setInAppEnabled(request.inAppEnabled());
        }
        if (request.pushEnabled() != null) {
            preference.setPushEnabled(request.pushEnabled());
        }
        if (request.emailEnabled() != null) {
            preference.setEmailEnabled(request.emailEnabled());
        }
        preference.setUpdatedAt(Instant.now(clock));
        return toResponse(preferenceRepository.save(preference));
    }

    @Transactional(readOnly = true)
    public boolean isPushEnabledForUser(UUID userId, NotificationPreferenceCategory category) {
        return preferenceRepository.findByUserIdAndCategory(userId, category)
                .map(NotificationPreference::isPushEnabled)
                .orElse(true);
    }

    @Transactional
    public void ensureDefaults(UUID userId) {
        User user = userRepository.findActiveById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        for (NotificationPreferenceCategory category : NotificationPreferenceCategory.values()) {
            if (preferenceRepository.findByUserIdAndCategory(userId, category).isEmpty()) {
                NotificationPreference preference = new NotificationPreference();
                preference.setId(UUID.randomUUID());
                preference.setUser(user);
                preference.setCategory(category);
                preference.setInAppEnabled(true);
                preference.setPushEnabled(true);
                preference.setEmailEnabled(false);
                preference.setUpdatedAt(Instant.now(clock));
                preferenceRepository.save(preference);
            }
        }
    }

    private NotificationPreferenceResponse toResponse(NotificationPreference preference) {
        return new NotificationPreferenceResponse(
                preference.getCategory(),
                preference.isInAppEnabled(),
                preference.isPushEnabled(),
                preference.isEmailEnabled(),
                preference.getUpdatedAt()
        );
    }
}
