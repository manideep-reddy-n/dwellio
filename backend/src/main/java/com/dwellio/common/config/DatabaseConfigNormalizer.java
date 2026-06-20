package com.dwellio.common.config;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Normalizes DATABASE_URL from Supabase / hosting formats and applies PostgreSQL schema routing
 * so JPA, native SQL, and JdbcTemplate all target {@code DATABASE_SCHEMA} (default: dwellio).
 */
final class DatabaseConfigNormalizer {

    private static final String DATABASE_URL_KEY = "DATABASE_URL";
    private static final String DATABASE_SCHEMA_KEY = "DATABASE_SCHEMA";
    private static final String DATABASE_USERNAME_KEY = "DATABASE_USERNAME";
    private static final String DATABASE_PASSWORD_KEY = "DATABASE_PASSWORD";
    private static final String SPRING_DATASOURCE_URL = "spring.datasource.url";
    private static final String SPRING_DATASOURCE_USERNAME = "spring.datasource.username";
    private static final String SPRING_DATASOURCE_PASSWORD = "spring.datasource.password";
    private static final String HIKARI_CONNECTION_INIT_SQL = "spring.datasource.hikari.connection-init-sql";
    private static final String PROPERTY_SOURCE = "normalizedDatabaseConfig";

    private DatabaseConfigNormalizer() {
    }

    static void apply(ConfigurableEnvironment environment) {
        String rawUrl = environment.getProperty(DATABASE_URL_KEY);
        if (rawUrl == null || rawUrl.isBlank()) {
            return;
        }

        String schema = sanitizeSchema(environment.getProperty(DATABASE_SCHEMA_KEY, "dwellio"));
        ParsedDatabaseConfig parsed = parseDatabaseUrl(rawUrl.trim());
        String jdbcUrl = withCurrentSchema(parsed.jdbcUrl(), schema);

        Map<String, Object> properties = new HashMap<>();
        properties.put(SPRING_DATASOURCE_URL, jdbcUrl);
        properties.put(DATABASE_URL_KEY, jdbcUrl);
        properties.put(HIKARI_CONNECTION_INIT_SQL, "SET search_path TO " + schema);

        if (parsed.username() != null && !parsed.username().isBlank()) {
            properties.put(SPRING_DATASOURCE_USERNAME, parsed.username());
            properties.put(DATABASE_USERNAME_KEY, parsed.username());
        }
        if (parsed.password() != null) {
            properties.put(SPRING_DATASOURCE_PASSWORD, parsed.password());
            properties.put(DATABASE_PASSWORD_KEY, parsed.password());
        }

        if (environment.getPropertySources().contains(PROPERTY_SOURCE)) {
            environment.getPropertySources().remove(PROPERTY_SOURCE);
        }
        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE, properties));
    }

    static ParsedDatabaseConfig parseDatabaseUrl(String rawUrl) {
        String working = rawUrl.trim();
        String query = "";
        int queryIndex = working.indexOf('?');
        if (queryIndex >= 0) {
            query = working.substring(queryIndex);
            working = working.substring(0, queryIndex);
        }

        String schemeless = working;
        if (schemeless.startsWith("jdbc:postgresql://")) {
            schemeless = schemeless.substring("jdbc:postgresql://".length());
        } else if (schemeless.startsWith("postgresql://")) {
            schemeless = schemeless.substring("postgresql://".length());
        } else if (schemeless.startsWith("postgres://")) {
            schemeless = schemeless.substring("postgres://".length());
        }

        String username = null;
        String password = null;
        String hostPart = schemeless;

        int atIndex = schemeless.lastIndexOf('@');
        if (atIndex > 0) {
            String userInfo = schemeless.substring(0, atIndex);
            hostPart = schemeless.substring(atIndex + 1);
            int colonIndex = userInfo.indexOf(':');
            if (colonIndex > 0) {
                username = decode(userInfo.substring(0, colonIndex));
                password = decode(userInfo.substring(colonIndex + 1));
            } else {
                username = decode(userInfo);
            }
        }

        String jdbcUrl = "jdbc:postgresql://" + hostPart;
        if (isPostgresHost(hostPart) && !query.contains("sslmode=")) {
            query = query.isEmpty() ? "?sslmode=require" : query + "&sslmode=require";
        }
        jdbcUrl += query;

        return new ParsedDatabaseConfig(jdbcUrl, username, password);
    }

    static String withCurrentSchema(String jdbcUrl, String schema) {
        if (jdbcUrl.contains("currentSchema=")) {
            return jdbcUrl;
        }
        return jdbcUrl + (jdbcUrl.contains("?") ? "&" : "?") + "currentSchema=" + schema;
    }

    static String sanitizeSchema(String schema) {
        if (schema == null || !schema.matches("[a-zA-Z_][a-zA-Z0-9_]*")) {
            throw new IllegalStateException("Invalid DATABASE_SCHEMA: " + schema);
        }
        return schema;
    }

    private static boolean isPostgresHost(String hostPart) {
        return hostPart.contains("supabase.co")
                || hostPart.contains("supabase.com")
                || hostPart.contains("postgres");
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    record ParsedDatabaseConfig(String jdbcUrl, String username, String password) {
    }
}
