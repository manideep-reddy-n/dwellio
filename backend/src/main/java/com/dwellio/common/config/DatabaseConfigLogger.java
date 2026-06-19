package com.dwellio.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DatabaseConfigLogger {

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    @Value("${spring.jpa.properties.hibernate.default_schema:public}")
    private String databaseSchema;

    @EventListener(ApplicationReadyEvent.class)
    public void logDatabaseTarget() {
        log.info("Active profile: {}", activeProfile.isBlank() ? "default" : activeProfile);
        log.info("Database target: {}", sanitizeUrl(datasourceUrl));
        log.info("Database schema: {}", databaseSchema);
        log.info(
                "If this is wrong, check Windows User Environment Variables — they override backend/.env"
        );
    }

    static String sanitizeUrl(String url) {
        if (url == null) {
            return "not configured";
        }
        return url.replaceAll("://([^/@]+):([^@]+)@", "://***:***@");
    }
}
