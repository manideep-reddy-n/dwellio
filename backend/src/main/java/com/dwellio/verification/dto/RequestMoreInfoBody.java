package com.dwellio.verification.dto;

import jakarta.validation.constraints.NotBlank;

public record RequestMoreInfoBody(@NotBlank String notes) {
}
