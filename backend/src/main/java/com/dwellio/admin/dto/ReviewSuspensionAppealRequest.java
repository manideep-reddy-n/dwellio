package com.dwellio.admin.dto;

import jakarta.validation.constraints.NotBlank;

public record ReviewSuspensionAppealRequest(@NotBlank String notes) {
}
