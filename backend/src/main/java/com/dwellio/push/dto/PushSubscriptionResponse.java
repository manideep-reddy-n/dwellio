package com.dwellio.push.dto;

import java.util.UUID;

public record PushSubscriptionResponse(
        UUID id,
        String endpoint
) {
}
