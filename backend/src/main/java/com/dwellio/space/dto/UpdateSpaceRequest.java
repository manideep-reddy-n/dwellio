package com.dwellio.space.dto;

import jakarta.validation.constraints.Size;

public record UpdateSpaceRequest(
        @Size(max = 50) String identifier,
        @Size(max = 100) String displayName,
        Boolean blocked
) {
}
