package com.dwellio.platform.service;

import com.dwellio.auth.repository.UserRepository;
import com.dwellio.common.exception.NotFoundException;
import com.dwellio.common.security.AuthorizationService;
import com.dwellio.domain.entity.PlatformSetting;
import com.dwellio.domain.entity.User;
import com.dwellio.platform.dto.PlatformSettingResponse;
import com.dwellio.platform.dto.UpdatePlatformSettingRequest;
import com.dwellio.platform.repository.PlatformSettingRepository;
import com.dwellio.audit.service.PlatformAuditService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlatformConfigService {

    private final PlatformSettingRepository settingRepository;
    private final UserRepository userRepository;
    private final AuthorizationService authorizationService;
    private final PlatformAuditService auditService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<PlatformSettingResponse> listAll() {
        authorizationService.requirePlatformAdmin();
        return settingRepository.findAllByOrderByCategoryAscSettingKeyAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PlatformSettingResponse> listByCategory(String category) {
        authorizationService.requirePlatformAdmin();
        return settingRepository.findAllByCategoryOrderBySettingKey(category).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getValue(String settingKey) {
        return settingRepository.findBySettingKey(settingKey)
                .map(PlatformSetting::getValueJson)
                .orElse(Map.of());
    }

    @Transactional(readOnly = true)
    public boolean isEnabled(String settingKey, String field, boolean defaultValue) {
        Map<String, Object> value = getValue(settingKey);
        Object raw = value.get(field);
        if (raw instanceof Boolean bool) {
            return bool;
        }
        return defaultValue;
    }

    @Transactional
    public PlatformSettingResponse update(String settingKey, UpdatePlatformSettingRequest request) {
        authorizationService.requirePlatformAdmin();
        PlatformSetting setting = settingRepository.findBySettingKey(settingKey)
                .orElseThrow(() -> new NotFoundException("Setting not found"));

        Map<String, Object> previous = setting.getValueJson();
        setting.setValueJson(request.valueJson());
        setting.setUpdatedAt(Instant.now(clock));
        setting.setUpdatedBy(referenceUser(authorizationService.currentPrincipal().getId()));

        auditService.recordForCurrentUser(
                "PLATFORM_SETTING_UPDATED",
                "PLATFORM_SETTING",
                setting.getId(),
                null,
                previous,
                request.valueJson()
        );

        return toResponse(settingRepository.save(setting));
    }

    private User referenceUser(UUID userId) {
        return userRepository.findActiveById(userId).orElseThrow(() -> new NotFoundException("User not found"));
    }

    private PlatformSettingResponse toResponse(PlatformSetting setting) {
        return new PlatformSettingResponse(
                setting.getId(),
                setting.getSettingKey(),
                setting.getCategory(),
                setting.getValueJson(),
                setting.getDescription(),
                setting.getUpdatedAt()
        );
    }
}
