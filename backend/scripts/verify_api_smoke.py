#!/usr/bin/env python3
"""Smoke-test critical API paths against a running backend."""
import json
import sys
import urllib.error
import urllib.request

BASE = "http://localhost:8081/api/v1"
EMAIL = "owner@example.com"
PASSWORD = "Password123!"


def request(method: str, path: str, token: str | None = None, body: dict | None = None):
    url = f"{BASE}{path}"
    data = None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = raw
        return e.code, payload


def main() -> int:
    print("1. Login...")
    status, login = request("POST", "/auth/login", body={"email": EMAIL, "password": PASSWORD})
    if status != 200:
        print(f"   FAIL login HTTP {status}: {login}")
        return 1
    token = login["accessToken"]
    print("   OK")

    print("2. List memberships...")
    status, memberships = request("GET", "/users/me/memberships", token=token)
    if status != 200 or not memberships:
        print(f"   FAIL memberships HTTP {status}: {memberships}")
        return 1
    gated = next(
        (m for m in memberships if m.get("organizationSlug") == "green-valley-residences"),
        memberships[0],
    )
    org_id = gated["organizationId"]
    print(f"   OK org={gated.get('organizationSlug')} id={org_id}")

    print("3. List payments (triggers billing sync)...")
    status, payments = request("GET", f"/organizations/{org_id}/payments", token=token)
    if status != 200:
        print(f"   FAIL payments HTTP {status}: {payments}")
        return 1
    print(f"   OK count={len(payments) if isinstance(payments, list) else '?'}")

    print("4. Create complaint...")
    status, complaint = request(
        "POST",
        f"/organizations/{org_id}/complaints",
        token=token,
        body={
            "title": "Smoke test complaint",
            "description": "Automated verification complaint",
            "category": "MAINTENANCE",
            "priority": "LOW",
        },
    )
    if status not in (200, 201):
        print(f"   FAIL complaint HTTP {status}: {complaint}")
        return 1
    print(f"   OK id={complaint.get('id')}")

    print("5. Create manual payment charge...")
    status2, residents = request("GET", f"/organizations/{org_id}/residents", token=token)
    if status2 != 200 or not residents:
        print(f"   SKIP payment — no residents HTTP {status2}: {residents}")
    else:
        mid = residents[0]["id"]
        status, payment = request(
            "POST",
            f"/organizations/{org_id}/payments/manual",
            token=token,
            body={
                "chargeType": "MAINTENANCE",
                "membershipIds": [mid],
                "amount": "100.00",
                "dueDate": "2026-07-01",
                "description": "Smoke test payment",
            },
        )
        if status not in (200, 201):
            print(f"   FAIL payment HTTP {status}: {payment}")
            return 1
        print(f"   OK created={len(payment) if isinstance(payment, list) else 1}")

    print("\nAll critical checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
