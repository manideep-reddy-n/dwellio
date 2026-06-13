package com.dwellio.joinrequest.dto;

import jakarta.validation.constraints.Size;

public record RejectJoinRequestRequest(
        @Size(max = 2000) String rejectionReason
) {
}
