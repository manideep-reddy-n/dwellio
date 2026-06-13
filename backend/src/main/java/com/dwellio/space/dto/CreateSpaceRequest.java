package com.dwellio.space.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSpaceRequest(
        @NotBlank @Size(max = 50) String identifier,
        @Size(max = 100) String displayName
) {
}
