package com.dwellio.organization.dto;

import jakarta.validation.constraints.NotBlank;

public record SubmitSuspensionAppealRequest(@NotBlank String reason) {
}
