package com.dwellio.joinrequest.dto;

import jakarta.validation.constraints.Size;

public record SubmitJoinRequestRequest(
        @Size(max = 2000) String message,
        @Size(max = 255) String emergencyContactName,
        @Size(max = 50) String emergencyContactPhone
) {
}
