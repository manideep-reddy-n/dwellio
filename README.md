# Dwellio

**A multi-tenant SaaS platform for managing Hostels, PGs, Co-Living Spaces, and Gated Communities.**

---

## Overview

Dwellio is a full-stack web application designed to serve two primary user groups:

1.  **Organizations (Hostels, PGs, Co-Living, Gated Communities):** Manage buildings, rooms, beds, assets, complaints, payments, announcements, reviews, and resident memberships.
2.  **Residents (Students, Tenants, Community Members):** Discover organizations via a public marketplace, request to join, view announcements, raise complaints, track payments, submit reviews/ratings, and receive real-time notifications.

The platform functions as both a **public discovery marketplace** and an **internal community management system**, ensuring strict **multi-tenant data isolation**.

---

## Architecture & Technology Stack

Dwellio is built with a modern, scalable tech stack separating the client application from the RESTful API.

| Layer | Technology | Key Details |
| :--- | :--- | :--- |
| **Frontend** | **Next.js** (React + TypeScript) | Next.js App Router for UI, Tailwind CSS for styling, Zustand/Context for state management. Communicates with the backend via REST. |
| **Backend** | **Spring Boot** (Java 21) | Robust REST API, JPA/Hibernate ORM for data access, Spring Security (JWT) for authentication, and Role-Based Access Control (RBAC). |
| **Database** | **PostgreSQL** (Supabase) | Relational database. All tenant data lives in the same DB but is strictly scoped by `organization_id`. |
| **Realtime** | **Spring WebSocket** (STOMP) | Enables real-time push notifications for announcements, occupancy changes, and complaint updates to the client. |
| **Deployment** | **Docker** | Containerized deployment. `render.yaml` describes the production deployment configuration. |

---

## Key Features

*   **Multi-Tenant Architecture:** Strict data isolation per organization. Every relevant entity is tied to an `organization_id`.
*   **Role-Based Access Control (RBAC):** Built-in roles (Platform Admin, Organization Owner, Resident, Staff) with fine-grained permissions enforced via Spring Security (`@PreAuthorize`).
*   **Public Marketplace & Discovery:** Unauthenticated users can search, filter, and view organization profiles, amenities, and aggregate metrics.
*   **Property & Asset Management:** Manage hierarchical structures (Building -> Floor -> Room -> Bed) with real-time occupancy tracking. Manage assets attached to locations.
*   **Resident Lifecycle:** Users can request to join an organization. Owners approve/reject. Memberships track the resident's status.
*   **Complaint & Ticketing System:** Residents can submit complaints (with categories/priorities). Tracks resolution SLAs and metrics.
*   **Announcements & Notifications:** Broadcast messages to residents with real-time WebSocket delivery.
*   **Payment Tracking:** Manual ledger for tracking resident payments (month, amount, due date, status).
*   **Reviews & Service Metrics:** Residents can leave ratings/reviews. The system calculates and caches metrics like average resolution time and occupancy rates for public display.

---

## Getting Started

### Prerequisites

*   **Java 21**
*   **Maven 3.9+**
*   **Node.js 20+**
*   **PostgreSQL** (Local instance or a cloud provider like Supabase)

### 1. Backend Setup (Spring Boot)

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Set up environment variables. Copy the example file:
    ```bash
    copy .env.example .env
    ```
3.  Configure `.env` with your database credentials and a strong JWT secret:
    ```properties
    DATABASE_URL=jdbc:postgresql://<your-db-host>:<port>/<dbname>?user=<user>&password=<password>&sslmode=require
    JWT_SECRET=your_super_secret_key_that_is_at_least_32_characters_long
    SEED_DEMO_DATA=true # Optional: Set to true to populate demo organizations
    ```
4.  Run the Spring Boot application:
    ```bash
    mvn spring-boot:run
    ```
    *The backend runs on `http://localhost:8081` by default. Health check: `http://localhost:8081/api/v1/health`*

### 2. Frontend Setup (Next.js)

1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables (if needed based on your setup, check `.env.example`).
4.  Start the development server:
    ```bash
    npm run dev
    ```
    *The frontend will be available at `http://localhost:3000`.*

---

## Repository Structure

```
dwellio/
├── backend/               # Spring Boot API
│   ├── src/main/java/com/dwellio/
│   │   ├── auth/          # Authentication & Security
│   │   ├── organization/  # Organization Management
│   │   ├── accommodation/ # Buildings, Rooms, Beds
│   │   ├── ...            # Other domain modules
│   │   └── DwellioApplication.java # Application Entry Point
│   └── pom.xml
├── frontend/              # Next.js UI Application
│   ├── src/
│   │   ├── app/           # Next.js App Router (Pages & Layouts)
│   │   ├── components/    # Reusable React Components
│   │   ├── hooks/         # Custom React Hooks
│   │   └── lib/           # Utilities and API clients
│   └── package.json
├── Dwellio.md             # Detailed Product Requirements Document (PRD)
├── render.yaml            # Deployment configuration
└── README.md              # This file
```

---

## License

MIT License
