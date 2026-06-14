package com.dwellio.leaverequest.dto;

import jakarta.validation.constraints.Size;

public record SubmitLeaveRequestRequest(
        @Size(max = 1000) String reason
) {
}
