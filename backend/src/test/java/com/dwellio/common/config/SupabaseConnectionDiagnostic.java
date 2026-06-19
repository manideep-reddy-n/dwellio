package com.dwellio.common.config;

import java.sql.DriverManager;
import java.util.List;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

/**
 * Manual diagnostic — run with env vars set to discover the correct Supabase pooler region.
 * mvn test -Dtest=SupabaseConnectionDiagnostic#probePoolerRegions
 */
class SupabaseConnectionDiagnostic {

    private static final String PROJECT_REF = "rkwuuznnhmlibdflcuzc";

  @Test
  @Disabled("Manual diagnostic only — enable locally when probing Supabase pooler region")
  void probePoolerRegions() throws Exception {
    String password = System.getenv("DATABASE_PASSWORD");
    if (password == null || password.isBlank()) {
      throw new IllegalStateException("Set DATABASE_PASSWORD in environment");
    }

    List<String> regions = List.of(
        "ap-northeast-1",
        "ap-south-1",
        "ap-southeast-1",
        "ap-southeast-2",
        "us-east-1",
        "us-west-1",
        "eu-west-1",
        "eu-west-2",
        "eu-central-1"
    );

    for (String region : regions) {
      probe("pooler-5432-" + region,
          "jdbc:postgresql://aws-0-" + region + ".pooler.supabase.com:5432/postgres?sslmode=require",
          "postgres." + PROJECT_REF, password);
      probe("pooler-6543-" + region,
          "jdbc:postgresql://aws-0-" + region + ".pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0",
          "postgres." + PROJECT_REF, password);
      probe("aws1-pooler-5432-" + region,
          "jdbc:postgresql://aws-1-" + region + ".pooler.supabase.com:5432/postgres?sslmode=require",
          "postgres." + PROJECT_REF, password);
    }

    probe("direct-ipv6",
        "jdbc:postgresql://db." + PROJECT_REF + ".supabase.co:5432/postgres?sslmode=require",
        "postgres", password);
  }

  private static void probe(String label, String url, String user, String password) {
    try {
      DriverManager.getConnection(url, user, password).close();
      System.out.println("SUCCESS " + label + " user=" + user + " url=" + url);
    } catch (Exception ex) {
      System.out.println("FAIL " + label + " -> " + ex.getMessage());
    }
  }
}
