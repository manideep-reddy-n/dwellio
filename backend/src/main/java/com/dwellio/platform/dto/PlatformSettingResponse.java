package com.dwellio.platform.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record PlatformSettingResponse(
        UUID id,
        String settingKey,
        String category,
        Map<String, Object> valueJson,
        String description,
        Instant updatedAt
) {
}
