"""One-time helper: drop flyway_schema_history on Supabase after a bad baseline."""
import os
import sys

import psycopg2

HOST = os.environ.get("DATABASE_HOST", "aws-1-ap-northeast-1.pooler.supabase.com")
PORT = int(os.environ.get("DATABASE_PORT", "5432"))
DBNAME = os.environ.get("DATABASE_NAME", "postgres")
USER = os.environ.get("DATABASE_USERNAME", "postgres.rkwuuznnhmlibdflcuzc")
PASSWORD = os.environ.get("DATABASE_PASSWORD")


def main() -> int:
    if not PASSWORD:
        print("Set DATABASE_PASSWORD (and optionally other DATABASE_* vars).", file=sys.stderr)
        return 1

    conn = psycopg2.connect(
        host=HOST,
        port=PORT,
        dbname=DBNAME,
        user=USER,
        password=PASSWORD,
        sslmode="require",
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS flyway_schema_history CASCADE")
    cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
    tables = [row[0] for row in cur.fetchall()]
    cur.close()
    conn.close()
    print("Dropped flyway_schema_history.")
    print("Remaining public tables:", tables)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
