"""Verify Supabase connectivity using backend/.env (no secrets printed)."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote

import psycopg2

ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def parse_uri(uri: str) -> tuple[str, str, str, int, str]:
    m = re.match(
        r"postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?]+)",
        uri.replace("jdbc:", ""),
    )
    if not m:
        raise ValueError("Could not parse DATABASE_URL")
    user = m.group(1)
    password = unquote(m.group(2))
    host = m.group(3)
    port = int(m.group(4))
    dbname = m.group(5)
    return host, user, password, port, dbname


def main() -> int:
    env = load_env(ENV_FILE)
    raw_url = env.get("DATABASE_URL")
    if not raw_url:
        print("DATABASE_URL missing in backend/.env", file=sys.stderr)
        return 1

    host, user, password, port, dbname = parse_uri(raw_url)
    schema = env.get("DATABASE_SCHEMA", "dwellio")

    conn = psycopg2.connect(
        host=host,
        port=port,
        dbname=dbname,
        user=user,
        password=password,
        sslmode="require",
    )
    cur = conn.cursor()
    cur.execute("SELECT current_database(), current_user")
    db, db_user = cur.fetchone()
    print(f"Connected to {host}:{port}/{db} as {db_user}")

    cur.execute(
        "SELECT 1 FROM information_schema.schemata WHERE schema_name = %s",
        (schema,),
    )
    print(f"Schema '{schema}' exists:", cur.fetchone() is not None)

    cur.execute(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s",
        (schema,),
    )
    print(f"Tables in '{schema}':", cur.fetchone()[0])

    cur.close()
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
