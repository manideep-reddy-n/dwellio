package com.dwellio.platform.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record UpdatePlatformSettingRequest(
        @NotNull Map<String, Object> valueJson
) {
}
