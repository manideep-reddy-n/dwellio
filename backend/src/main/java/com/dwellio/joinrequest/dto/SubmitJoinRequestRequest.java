package com.dwellio.joinrequest.dto;

import jakarta.validation.constraints.Size;

public record SubmitJoinRequestRequest(
        @Size(max = 2000) String message
) {
}
