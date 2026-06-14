package com.dwellio.verification.dto;

import jakarta.validation.constraints.NotBlank;

public record SubmitVerificationRequest(String notes) {
}
