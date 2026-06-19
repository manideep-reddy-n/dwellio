package com.dwellio.push.dto;

public record PushConfigResponse(
        String vapidPublicKey,
        boolean pushConfigured
) {
}
