package com.dwellio.membership.dto;

import jakarta.validation.constraints.Size;

public record UpdateResidentProfileRequest(
        @Size(max = 255) String emergencyContactName,
        @Size(max = 50) String emergencyContactPhone
) {
}
