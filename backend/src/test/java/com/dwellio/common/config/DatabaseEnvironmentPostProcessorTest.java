package com.dwellio.common.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class DatabaseEnvironmentPostProcessorTest {

    @Test
    void parsesSupabaseSessionPoolerUri() {
        String input =
                "postgresql://postgres.rkwuuznnhmlibdflcuzc:manideep%402006@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";
        var parsed = DatabaseConfigNormalizer.parseDatabaseUrl(input);

        assertEquals(
                "jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require",
                parsed.jdbcUrl());
        assertEquals("postgres.rkwuuznnhmlibdflcuzc", parsed.username());
        assertEquals("manideep@2006", parsed.password());
    }

    @Test
    void leavesLocalJdbcUrlWithoutCredentials() {
        String input = "jdbc:postgresql://localhost:5432/dwellio";
        var parsed = DatabaseConfigNormalizer.parseDatabaseUrl(input);

        assertEquals(input, parsed.jdbcUrl());
        assertNull(parsed.username());
        assertNull(parsed.password());
    }

    @Test
    void appendsSslForSupabaseJdbcUrl() {
        String input = "jdbc:postgresql://db.abc.supabase.co:5432/postgres";
        var parsed = DatabaseConfigNormalizer.parseDatabaseUrl(input);
        assertEquals("jdbc:postgresql://db.abc.supabase.co:5432/postgres?sslmode=require", parsed.jdbcUrl());
    }

    @Test
    void addsJdbcPrefixForPostgresqlUri() {
        String input = "postgresql://postgres:secret@db.abc.supabase.co:5432/postgres";
        var parsed = DatabaseConfigNormalizer.parseDatabaseUrl(input);
        assertTrue(parsed.jdbcUrl().startsWith("jdbc:postgresql://"));
        assertTrue(parsed.jdbcUrl().contains("sslmode=require"));
        assertEquals("postgres", parsed.username());
        assertEquals("secret", parsed.password());
    }

    @Test
    void appendsSslForSupabasePoolerHost() {
        String input =
                "postgresql://postgres.ref:secret@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";
        var parsed = DatabaseConfigNormalizer.parseDatabaseUrl(input);
        assertTrue(parsed.jdbcUrl().contains("sslmode=require"));
    }
}
