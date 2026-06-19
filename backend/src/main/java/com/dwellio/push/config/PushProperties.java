package com.dwellio.push.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "dwellio.push")
public record PushProperties(
        String vapidPublicKey,
        String vapidPrivateKey,
        String subject
) {
    public boolean isConfigured() {
        return vapidPublicKey != null && !vapidPublicKey.isBlank()
                && vapidPrivateKey != null && !vapidPrivateKey.isBlank();
    }
}
