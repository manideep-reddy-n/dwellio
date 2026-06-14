package com.dwellio.verification.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectVerificationRequest(@NotBlank String reason) {
}
