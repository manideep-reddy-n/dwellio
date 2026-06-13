package com.dwellio.bed.dto;

import jakarta.validation.constraints.Size;

public record UpdateBedRequest(
        @Size(max = 20) String bedLabel,
        Boolean blocked
) {
}
