# Dwellio V1 Deepening — Entity Relationship Diagram

Mermaid ERD for tables and cache columns added during Phases A–G. Core V1 tables (`organizations`, `memberships`, `occupancies`, `payments`, `complaints`) are shown with new relationships only.

---

## Deepening tables

```mermaid
erDiagram
    organizations ||--o{ activity_events : records
    organizations ||--o{ financial_ledger_entries : owns
    organizations ||--o{ billing_rules : configures
    organizations ||--o{ meal_feedback : collects
    organizations ||--o{ unit_ownership_records : tracks
    organizations ||--|| organization_metrics_cache : projects

    memberships ||--o{ activity_events : subject
    memberships ||--o{ financial_ledger_entries : balance
    memberships ||--o{ meal_feedback : submits
    memberships ||--o{ payments : billed

    payments ||--o{ financial_ledger_entries : sources
    payments ||--o{ payment_reminder_logs : reminded
    payments ||--o| invoices : may_have

    spaces ||--o{ unit_ownership_records : owned_by
    spaces ||--o{ payments : unit_charge

    activity_events {
        uuid id PK
        uuid organization_id FK
        uuid membership_id FK "nullable"
        varchar event_category "BILLING|ACCOMMODATION|..."
        varchar event_type
        varchar title
        text description
        jsonb metadata
        timestamptz occurred_at
        varchar source_type "nullable V25"
        uuid source_id "nullable V25"
    }

    financial_ledger_entries {
        uuid id PK
        uuid organization_id FK
        uuid membership_id FK
        uuid payment_id FK "nullable"
        varchar entry_type
        decimal amount
        decimal balance_after
        varchar description
        date reference_month
        uuid created_by FK "nullable"
        timestamptz created_at
    }

    billing_rules {
        uuid id PK
        uuid organization_id FK
        varchar charge_type
        varchar recurrence "MONTHLY|ONE_TIME"
        decimal default_amount
        smallint due_day_of_month
        varchar applies_to
        varchar bill_to "RESIDENT|OWNER|TENANT"
        boolean active
    }

    payment_reminder_logs {
        uuid id PK
        uuid payment_id FK
        varchar reminder_type
        timestamptz sent_at
    }

    meal_feedback {
        uuid id PK
        uuid organization_id FK
        uuid membership_id FK
        date feedback_date
        varchar meal_type "BREAKFAST|LUNCH|DINNER"
        smallint rating "1-5"
        text comment
        unique org_membership_date_meal
    }

    unit_ownership_records {
        uuid id PK
        uuid organization_id FK
        uuid unit_space_id FK
        varchar owner_name
        varchar owner_email
        varchar owner_phone
        varchar billing_responsibility "OWNER|TENANT|RESIDENT"
        date effective_from
        date effective_to
        text notes
    }
```

---

## Extended organization & occupancy

```mermaid
erDiagram
    organizations {
        uuid id PK
        varchar type "HOSTEL|PG|CO_LIVING|GATED_COMMUNITY"
        decimal default_monthly_rent
        decimal sla_first_response_hours "V27"
        decimal sla_resolution_hours "V27"
        varchar billing_mode "V29 CALENDAR_MONTH|OCCUPANCY_ANCHOR|CUSTOM_DAY"
        smallint billing_custom_day "V29 nullable"
    }

    occupancies {
        uuid id PK
        uuid membership_id FK
        varchar occupancy_classification "V24 RESIDENT|OWNER_OCCUPIED|TENANT_OCCUPIED|VACANT"
        decimal monthly_rent
        date move_in_date
        boolean current
    }

    payments {
        uuid id PK
        uuid membership_id FK
        uuid unit_space_id FK "V29 nullable"
        date billing_month
        date due_date
        varchar charge_type
        decimal amount
        decimal amount_paid
        varchar status
    }
```

---

## Metrics cache extensions

`organization_metrics_cache` is 1:1 with `organizations`. Key deepening columns:

```mermaid
erDiagram
    organization_metrics_cache {
        uuid organization_id PK_FK
        decimal expected_revenue_month "V22"
        decimal collected_revenue_month "V22"
        decimal outstanding_revenue_month "V22"
        decimal collection_rate "V22"
        int defaulters_count "V22"
        jsonb revenue_trend_json "V22"
        decimal forecast_revenue_next_month "V22"
        int move_ins_month "V26"
        int move_outs_month "V26"
        decimal avg_stay_days "V26"
        decimal turnover_rate "V26"
        int pending_payments_count "V26"
        decimal sla_first_response_hours "V26"
        decimal sla_resolution_hours "V26"
        decimal sla_compliance_rate "V26"
        int sla_violations_count "V26"
        int reopened_complaints_count "V26"
        decimal avg_breakfast_rating "V26"
        decimal avg_lunch_rating "V26"
        decimal avg_dinner_rating "V26"
        jsonb meal_ratings_trend_json "V26"
        timestamptz refreshed_at
    }
```

---

## Migration index

| Version | Phase | Contents |
|---------|-------|----------|
| V22 | Revenue / ledger | `financial_ledger_entries`, `billing_rules`, `payment_reminder_logs`, revenue cache columns |
| V23 | Timeline | `activity_events` |
| V24 | Gated ownership | `unit_ownership_records`, `occupancy_classification` |
| V25 | Timeline dedupe | `activity_events.source_type`, `source_id`, unique index |
| V26 | Metrics B | Lifecycle, SLA, meal rating cache columns |
| V27 | Complaint SLA | `organizations.sla_*_hours` |
| V28 | Meal feedback | `meal_feedback` |
| V29 | Billing engine | `organizations.billing_mode`, `payments.unit_space_id`, rule seed |

---

## Key flows

### Rent charge (hostel/PG/co-living)

```
occupancies (current) → PaymentService.syncMonthlyPayments
  → payments (RENT)
  → financial_ledger_entries (CHARGE_GENERATED)
  → activity_events (BILLING)
  → notifications (PAYMENT_DUE)
```

### Gated maintenance

```
billing_rules (MAINTENANCE) + BillToResolver
  → payments (MAINTENANCE, unit_space_id)
  → financial_ledger_entries
  → activity_events
  → metrics refresh
```

### Metrics rebuild

```
POST /metrics/rebuild
  → RevenueMetricsProjection
  → LifecycleMetricsProjection
  → ComplaintSlaProjection
  → MealMetricsProjection
  → ActivityEventBackfillService
  → organization_metrics_cache
```

---

## Related documents

- [payment-v2-deepening.md](./payment-v2-deepening.md) — behavioral specification
- [payment-v1-spec.md](./payment-v1-spec.md) — original V1 scope
