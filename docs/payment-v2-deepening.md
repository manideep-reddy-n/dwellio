# Dwellio Payment V2 — Deepening Specification

Extends [payment-v1-spec.md](./payment-v1-spec.md) with the V1 completion deepening work (Phases A–G). This document reflects **what is implemented** in the codebase.

For conceptual long-term design, see [payment-architecture.md](./payment-architecture.md).

---

## 1. Scope added since V1

| Area | V1 | V2 deepening |
|------|-----|--------------|
| Ledger | Out of scope | Append-only `financial_ledger_entries` with running balance |
| Revenue metrics | Basic payment list | Projected cache: expected/collected/outstanding, defaulters, forecast, trend |
| Reminders | Ad-hoc `PAYMENT_DUE` | Scheduled 5-day / due-today / overdue with dedupe log |
| Activity timeline | — | `activity_events` + backfill + ops/resident UI |
| Billing rules | — | `billing_rules` + org `billing_mode` for gated maintenance |
| Bill-to resolution | — | Ownership records + occupancy classification → membership |
| Meal feedback | Menu only | Ratings, analytics, metrics cache |
| Complaint SLA | Timestamps only | Org SLA targets, breach detection, dashboard widgets |
| Resident profile | Table only | Lifecycle page: accommodation, ledger, complaints, timeline |

**Still out of scope:** payment gateways, tax invoices, full accounting GL, sale/purchase workflows.

---

## 2. Data model (implemented)

### Payments (`payments` table)

V1 `payments` retained (not renamed to `bills`). Extensions:

| Column | Purpose |
|--------|---------|
| `charge_type` | RENT, MAINTENANCE, UTILITY, PENALTY, etc. |
| `description` | Human-readable line |
| `unit_space_id` | Optional — gated maintenance billed per unit |

Unique indexes:
- Rent: one per `membership_id` + `billing_month` (where `charge_type = RENT`)
- Unit charges: one per `organization_id` + `unit_space_id` + `billing_month` + `charge_type`

### Financial ledger (`financial_ledger_entries`)

Append-only running balance per membership.

| `entry_type` | When written |
|--------------|--------------|
| `CHARGE_GENERATED` | Rent sync, manual charge, gated maintenance auto-charge |
| `PAYMENT_RECEIVED` | Staff records payment (full or partial) |
| `REFUND` / `PENALTY_APPLIED` / `ADJUSTMENT` | Reserved for future use |

Dual-write: `PaymentService` and `GatedMaintenanceBillingService` write payment + ledger + activity event.

### Billing rules (`billing_rules`)

Per-organization configurable charges (seeded for gated communities).

| Field | Values |
|-------|--------|
| `charge_type` | MAINTENANCE, etc. |
| `recurrence` | MONTHLY, ONE_TIME |
| `applies_to` | ALL_ACTIVE_OCCUPANCIES, ALL_ACTIVE_UNITS |
| `bill_to` | RESIDENT, OWNER, TENANT (default; overridden by ownership) |
| `due_day_of_month` | 1–28 for calendar billing |

### Organization billing mode

On `organizations`:

| `billing_mode` | Due date logic |
|----------------|----------------|
| `OCCUPANCY_ANCHOR` | Move-in anniversary day (hostel/PG/co-living rent) |
| `CALENDAR_MONTH` | Rule `due_day_of_month` (default for gated) |
| `CUSTOM_DAY` | `billing_custom_day` on org |

### Payment reminders (`payment_reminder_logs`)

Dedupes scheduled reminders per payment:

| `reminder_type` | Trigger |
|-----------------|---------|
| `FIVE_DAYS_BEFORE` | `due_date = today + 5` |
| `DUE_TODAY` | `due_date = today` |
| `OVERDUE` | `due_date < today` |

Nightly job: `PaymentReminderScheduler` → `PaymentReminderService.sendScheduledReminders()`.

### Activity events (`activity_events`)

Categories: `BILLING`, `ACCOMMODATION`, `COMPLAINT`, `REVIEW`, `MEMBERSHIP`.

Writers on forward path + `ActivityEventBackfillService` for historical data on metrics rebuild.

---

## 3. Billing by organization type

### HOSTEL / PG / CO_LIVING

| Behavior | Detail |
|----------|--------|
| Auto rent | `PaymentService.syncMonthlyPayments` — skipped for `GATED_COMMUNITY` only |
| Due anchor | Occupancy `move_in_date` day-of-month |
| Amount | `occupancies.monthly_rent` → `organizations.default_monthly_rent` |
| Scheduler | `PaymentScheduler` nightly at 02:00 |
| Meal feedback | HOSTEL, PG, CO_LIVING (not gated) |

### GATED_COMMUNITY

| Behavior | Detail |
|----------|--------|
| Auto rent | None |
| Maintenance | `GatedMaintenanceBillingService` from active `billing_rules` |
| Bill-to | `BillToResolver`: `unit_ownership_records.billing_responsibility` + `occupancies.occupancy_classification` |
| Owner without membership | Charge on occupant membership with owner email in description; notification notes owner contact |
| Trigger | Nightly scheduler + `GET .../payments` for gated orgs |

### Bill-to resolution order

1. Effective `unit_ownership_records` row for unit (by date)
2. Else `occupancy_classification` on current occupancy
3. Else `billing_rules.bill_to` default

---

## 4. Revenue metrics projection

`organization_metrics_cache` columns (V22, V26):

- `expected_revenue_month`, `collected_revenue_month`, `outstanding_revenue_month`
- `collection_rate`, `defaulters_count`, `forecast_revenue_next_month`
- `revenue_trend_json` (6-month series)
- Lifecycle: `move_ins_month`, `move_outs_month`, `avg_stay_days`, `turnover_rate`
- SLA: `sla_compliance_rate`, `sla_violations_count`, org SLA hour copies
- Meals: `avg_breakfast_rating`, `avg_lunch_rating`, `avg_dinner_rating`, `meal_ratings_trend_json`

Refresh: `POST /organizations/{id}/metrics/rebuild` and async listeners on domain events.

Dashboard: `GET /organizations/{id}/dashboard` → `ConsolidatedOpsDashboard` UI.

---

## 5. Notifications (payment E2E)

| Event | Type | Recipient |
|-------|------|-----------|
| Charge created / due | `PAYMENT_DUE` | Resident |
| Staff records payment | `PAYMENT_RECORDED` | Resident |
| Reminder scheduler | `PAYMENT_DUE` | Resident (deduped per type) |

Integration tests: `PaymentNotificationIntegrationTest`.

---

## 6. API summary (V2 additions)

| Endpoint | Purpose |
|----------|---------|
| `GET/PUT .../billing-rules` | List / upsert org billing rules |
| `GET .../ledger`, `GET .../ledger/mine` | Financial ledger |
| `GET .../timeline`, `GET .../timeline/mine` | Activity timeline |
| `GET .../residents/{id}/profile` | Resident lifecycle profile |
| `GET .../complaints/sla-summary` | SLA violations widget data |
| `GET .../meal-feedback/mine`, `PUT .../meal-feedback`, `GET .../meal-feedback/summary` | Meal ratings |
| `GET .../dashboard` | Extended metrics cache |
| `POST .../metrics/rebuild` | Full projection refresh |

Organization PATCH adds: `slaFirstResponseHours`, `slaResolutionHours`, `billingMode`, `billingCustomDay`.

---

## 7. Frontend surfaces

| Route | Features |
|-------|----------|
| `/operations` | Consolidated dashboard (financial, occupancy, complaints, SLA, meals, trust) |
| `/operations/payments` | Payment manager + billing rules panel (gated) |
| `/operations/ledger` | Org-wide ledger |
| `/operations/timeline` | Resident activity feed |
| `/operations/residents/[id]` | Lifecycle profile |
| `/operations/food-menu` | Menu + meal analytics |
| `/resident/timeline`, `/resident/ledger` | Resident views |
| Org settings | SLA, billing mode, default rent, logo |

---

## 8. Schedulers

| Job | Cron | Service |
|-----|------|---------|
| Rent sync | `0 0 2 * * *` | `PaymentService.syncAllOrganizations` |
| Gated maintenance | `0 0 2 * * *` | `GatedMaintenanceBillingService.syncOrganization` |
| Payment reminders | `0 0 8 * * *` | `PaymentReminderService.sendScheduledReminders` |

---

## 9. Testing

### Backend integration

| Test class | Coverage |
|------------|----------|
| `ActivityTimelineIntegrationTest` | Timeline after allocate + rebuild |
| `LedgerRevenueIntegrationTest` | Ledger dual-write + revenue dashboard |
| `PaymentNotificationIntegrationTest` | Reminders + PAYMENT_RECORDED |
| `MetricsPhaseBIntegrationTest` | Lifecycle + SLA metrics |
| `ComplaintSlaIntegrationTest` | SLA breach + filter |
| `MealFeedbackIntegrationTest` | Ratings + metrics |
| `BillingRulesIntegrationTest` | Gated maintenance + bill-to |
| `ResidentLifecycleIntegrationTest` | Profile aggregation |

### Frontend (Vitest + RTL)

```bash
cd frontend && npm test
```

- `vertical-timeline.test.tsx` — event rendering
- `ledger-view.test.tsx` — balance + entries
- `consolidated-ops-dashboard.test.tsx` — revenue KPI cards

---

## 10. Related documents

- [payment-v1-spec.md](./payment-v1-spec.md) — original V1 scope
- [erd-deepening.md](./erd-deepening.md) — ERD for new tables
- [payment-architecture.md](./payment-architecture.md) — long-term unified billing design
