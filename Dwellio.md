# PRD - Dwellio

## Product Name

**Dwellio**

**Tagline:**
A multi-tenant platform for managing Hostels, PGs, Co-Living Spaces, and Gated Communities.

---

# Vision

Dwellio is a multi-tenant SaaS platform designed to serve two primary user groups:

### 1. Organizations

* Hostels
* PGs (Paying Guest Accommodations)
* Co-Living Spaces
* Gated Communities

### 2. Residents

* Students
* Tenants
* Community Members

The platform enables organizations to efficiently manage their operations while allowing residents to discover, join, interact with, and receive services from organizations.

Dwellio functions as both:

* A public discovery marketplace
* An internal community management system

---

# Goals

The platform should provide:

* Resident Management
* Building, Room, and Bed Management
* Complaint Management
* Payment Tracking
* Asset Management
* Announcements & Notices
* Reviews & Ratings
* Availability Tracking
* Real-Time Notifications
* Role-Based Access Control (RBAC)
* Multi-Tenant Organization Management

---

# Non Goals (V1)

The following features are intentionally excluded from Version 1:

* AI-powered features
* Machine Learning integrations
* Payment Gateway Integration
* Visitor Management
* Face Recognition
* IoT Device Integrations
* Smart Locks
* Mess/Food Management
* Inventory Management
* Automated Billing
* Accounting Systems
* Mobile Applications

---

# User Types

## Platform Admin

Controls and manages the entire platform.

### Permissions

* View all organizations
* Verify organizations
* Suspend organizations
* Manage platform settings
* Access platform-wide analytics
* Moderate reported reviews

---

## Organization Owner

Highest authority within an organization.

### Permissions

* Full access to organization resources
* Create and manage staff accounts
* Assign roles and permissions
* Approve or reject resident requests
* Manage organization profile
* Manage buildings, rooms, beds, complaints, payments, and announcements

### Rules

* Owner always has all permissions
* Owner role cannot be modified or deleted

---

## Staff

Users assigned specific permissions by the Organization Owner.

### Example Roles

* Manager
* Secretary
* Treasurer
* Maintenance Staff
* Security Staff

### Permissions

Configurable through RBAC.

---

## Resident

Community members who belong to an organization.

### Permissions

* Join organizations
* View announcements
* Raise complaints
* View payment records
* Submit reviews and ratings
* Receive notifications
* View room and bed allocation details

---

# Organization Types

## Supported in V1

* HOSTEL
* PG
* CO_LIVING
* GATED_COMMUNITY

## Future Support

* APARTMENT
* STUDENT_ACCOMMODATION

---

## Organization Status & Verification

### Organization Status

* PENDING
* VERIFIED
* REJECTED
* SUSPENDED

### Workflow

1. Owner creates organization
2. Organization enters PENDING status
3. Platform Admin reviews organization
4. Admin approves or rejects
5. Approved organizations become publicly visible

### Rules

* Only VERIFIED organizations appear in public search.
* SUSPENDED organizations are hidden from public discovery.

---

# Multi-Tenant Architecture

Each organization operates in complete isolation.

### Requirement

Data belonging to one organization must never be accessible by another organization.

### Tenant Isolation

All organization-specific entities must contain:

* organization_id

### Future Support

Subdomain-based tenancy:

Examples:

* abc.dwellio.com
* greenvalley.dwellio.com

### V1 Routing Strategy

Use slug-based routing:

```text
/org/{slug}
```

Example:

```text
dwellio.com/org/abc-hostel
```

---

# Public Marketplace

Visitors can browse organizations without creating an account.

---

## Search

Search organizations by:

* Name
* Type
* City
* Area

---

## Filters

* Hostel
* PG
* Co-Living
* Community

---

## Organization Profile

Public organization pages should display:

* Name
* Description
* Photos
* Amenities
* Reviews
* Ratings
* Available Capacity
* Contact Information
* Location
* Organization Type

## Amenities Module

### Purpose

Allows organizations to advertise facilities and enables residents to filter organizations.

### Example Amenities

* WiFi
* Laundry
* Parking
* Gym
* Power Backup
* CCTV
* Housekeeping
* Food Service
* Water Purifier
* Security

### Requirements

* Amenities must appear on organization profiles.
* Amenities must be searchable and filterable.

---

# Resident Flow

## Registration

Users can create an account.

### Fields

* Full Name
* Email
* Phone Number
* Password

---

## Browse Organizations

Users can:

* Search organizations
* View organization profiles
* View ratings and reviews
* Check availability

---

## Join Organization

Users submit a join request.

### Workflow

1. Resident submits request
2. Organization Owner reviews request
3. Owner approves or rejects request
4. Approved user becomes a resident

## Join Request Management

### Join Request Status

* PENDING
* APPROVED
* REJECTED
* CANCELLED

### Optional Documents

Organizations may request:

* College ID
* Employee ID
* Government ID
* Custom documents

### Workflow

1. Resident submits request
2. Owner reviews request
3. Owner approves or rejects
4. Membership record is created upon approval

---

## Membership Module

### Purpose

Represents a user's membership within an organization.

A user account can exist independently of organizations and may join organizations through membership records.

### Membership Fields

* id
* user_id
* organization_id
* role_id
* status
* joined_at
* left_at

### Membership Status

* PENDING
* ACTIVE
* REJECTED
* LEFT

### Rules

* Users never belong directly to organizations.
* Memberships connect users and organizations.
* All resident access is granted through active memberships.

---

# Organization Management

## Basic Information

### Fields

* Name
* Description
* Type
* Address
* Latitude
* Longitude
* Contact Number
* Email Address
* Photos

---

# Building Structure

Organizations can manage physical accommodation structures.

### Hierarchy

```text
Organization
 └── Building
      └── Floor
           └── Room
                └── Bed
```

### Example

```text
ABC Hostel
 └── Building A
      └── Floor 2
           └── Room 205
                ├── Bed A
                └── Bed B
```

---

# Building Visualization Module

## Purpose

Provide a visual representation of an organization's physical structure and occupancy.

## V1 Features

### Hierarchy View

Display:

Organization
→ Building
→ Floor
→ Room
→ Bed

in a visual expandable tree structure.

### Occupancy View

Display room and bed availability using visual indicators:

* AVAILABLE
* OCCUPIED
* BLOCKED

Example:

Room 101 → Available
Room 102 → Occupied

### Room Details View

When a room is selected, display:

* Room information
* Bed occupancy
* Assigned residents
* Room status

### Bed View

Display all beds inside a room with occupancy status.

### Asset View

Allow users to view assets assigned to specific buildings, floors, or rooms.

Examples:

* WiFi Router
* Washing Machine
* Water Purifier

Display current asset status.

### Real-Time Updates

Building visualization must update automatically using WebSockets when:

* Room occupancy changes
* Bed allocation changes
* Asset status changes

## Non Goals (V1)

Do NOT include:

* 3D Building Rendering
* Three.js
* CAD-style Floor Designers
* Interactive Floor Planning

## Future Enhancements

### V2

* Drag-and-drop Floor Plan Designer
* Visual Room Layout Builder
* Facility Placement Mapping

### V3

* Full 3D Building Visualization
* Three.js / React Three Fiber Support
* Interactive Building Navigation

---

# Resident Management

## Resident Profile

### Fields

* Name
* Email
* Phone Number
* Emergency Contact
* Join Date
* Status

### Status Values

* ACTIVE
* INACTIVE
* LEFT

---

# Room Allocation

Residents are assigned to beds rather than rooms directly.

### Requirements

Maintain allocation history.

Track:

* Previous Rooms
* Previous Beds
* Move-In Dates
* Move-Out Dates

---

# Availability Management

Track occupancy and availability metrics.

### Metrics

* Total Rooms
* Occupied Rooms
* Vacant Rooms
* Total Beds
* Occupied Beds
* Available Beds

### Requirements

* Visible on public organization profiles
* Updated in real time

---

# Complaint Management

Residents can submit complaints.

### Fields

* Title
* Description
* Category
* Priority
* Status
* Created By
* Assigned To
* Created At
* Updated At
* Resolved At
* Closed At

### Categories

* WiFi
* Water
* Electricity
* Cleaning
* Security
* Maintenance
* Other

### Priority Levels

* LOW
* MEDIUM
* HIGH
* CRITICAL

### Status Values

* OPEN
* IN_PROGRESS
* RESOLVED
* CLOSED

### Metrics Support

Resolved At and Closed At timestamps are used to calculate:

* Average Complaint Resolution Time
* Complaint Resolution Rate
* Organization Service Metrics

---

# Announcements

Organizations can publish announcements.

### Types

* General Updates
* Maintenance Notices
* Events
* Payment Reminders

### Requirements

Residents should receive notifications whenever a new announcement is published.

---

# Payment Tracking

Version 1 supports payment tracking only.

### No Payment Gateway Integration

Payments are recorded manually.

### Fields

* Resident
* Month
* Amount
* Due Date
* Status
* Notes

### Status Values

* PAID
* PENDING
* OVERDUE

### Requirements

Maintain complete payment history.

---

# Asset Management

Organizations can manage assets and equipment.

### Examples

* WiFi Router
* Washing Machine
* Water Purifier
* Generator
* CCTV
* Other Equipment

### Fields

* Name
* Category
* Status
* Location
* Purchase Date
* Last Maintenance Date

### Status Values

* WORKING
* MAINTENANCE_REQUIRED
* OUT_OF_SERVICE

### Requirements

* Manual updates only
* No IoT integration in V1

---

# Reviews & Ratings

Residents can review organizations.

### Features

* Submit ratings
* Write reviews

### Rating Scale

1–5 Stars

### Rules

* Organization owners cannot delete reviews
* Reviews can only be reported for moderation

---

## Organization Service Metrics

### Purpose

Provide transparency and trust for residents.

### Metrics

#### Average Complaint Resolution Time

Example:

* 2.4 Days

#### Complaint Resolution Rate

Example:

* 92%

#### Open Complaint Count

Example:

* 8

#### Resident Satisfaction Score

Calculated using:

* Ratings
* Reviews
* Complaint Resolution Performance

### Public Visibility

These metrics should be displayed on public organization profiles.

### Examples

Organization A

* Rating: 4.7
* Average Resolution Time: 1.2 Days
* Resolution Rate: 96%

Organization B

* Rating: 4.2
* Average Resolution Time: 7.4 Days
* Resolution Rate: 72%

### Purpose

Allow residents to compare organizations using actual operational performance rather than only reviews.

---

# Notifications

Real-time notifications should be supported.

### Technology

Spring Boot WebSockets

### Notification Examples

* Complaint Updated
* Join Request Approved
* New Announcement Published
* Payment Reminder

### Notification States

* UNREAD
* READ

---

# Role-Based Access Control (RBAC)

RBAC is mandatory.

### Core Tables

* memberships
* roles
* permissions
* role_permissions
* user_roles

### Relationship Model

User
↓
Membership
↓
Role
↓
Organization

A user's access to an organization is determined through an active membership and assigned role.

Memberships act as the bridge between users and organizations.

### Rules

* Owner always has all permissions
* Owner permissions cannot be modified
* Custom roles are supported

### Example Roles

* Manager
* Security
* Treasurer
* Maintenance

---

# Dashboard

## Platform Admin Dashboard

### Platform Metrics

* Total Organizations
* Verified Organizations
* Pending Organizations
* Suspended Organizations
* Total Residents
* Total Active Users
* Total Complaints
* Open Complaints
* Platform Growth Metrics

### Platform Actions

* Verify Organizations
* Suspend Organizations
* Moderate Reviews
* View Audit Logs
* View Platform Analytics

## Owner Dashboard

### Metrics

* Total Residents
* Occupancy Rate
* Available Beds
* Open Complaints
* Pending Payments
* Monthly Revenue
* Asset Status Summary

---

## Resident Dashboard

### Information

* Current Organization
* Room & Bed Details
* Payment Records
* Complaints
* Announcements
* Notifications

---

# File Uploads

Use Cloudinary for media storage.

### Supported Uploads

* Organization Photos
* Asset Photos
* User Profile Images

---

# Audit Trail

Track important system activities.

### Events

* Resident Added
* Resident Removed
* Complaint Updated
* Role Changed
* Payment Updated
* Room Allocation Changed

### Stored Information

* User
* Action
* Entity
* Timestamp

---

# Tech Stack

## Frontend

* Next.js 14+
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Query (TanStack Query)
* Axios
* Zustand (State Management)

---

## Backend

* Java 21
* Spring Boot 3+
* Spring Security
* Spring Data JPA
* Spring Validation
* Spring WebSocket
* Lombok
* MapStruct

---

## Database

* PostgreSQL(Supabase)

---

## Authentication & Authorization

* JWT Authentication
* Refresh Tokens
* Role-Based Access Control (RBAC)

---

## File Storage

* Cloudinary

---

## Real-Time Communication

* Spring Boot WebSockets
* STOMP Protocol

---

## API Architecture

* REST APIs
* OpenAPI / Swagger Documentation

---

## Deployment

### Frontend

* Vercel

### Backend

* Railway or Render

### Database

* PostgreSQL(supabase)

### Media Storage
`
* Cloudinary

---

# Additional Architectural Requirements (Final Review)

## Subscription & Plan Model

### Purpose

Prepare the platform for future monetization without requiring major schema changes.

### Plan Types

* FREE
* PRO
* ENTERPRISE

### Rules

* Every organization belongs to a plan.
* V1 will not implement billing.
* Plan restrictions and billing logic are future enhancements.

---

## Organization Contact Directory

### Purpose

Allow residents to quickly identify important contacts.

### Contact Types

* Owner
* Manager
* Emergency Contact
* Maintenance Contact
* Security Contact

### Requirements

* Organizations can maintain multiple contact records.
* Contact visibility can be configured by organization owners.

---

## Soft Delete Strategy

### Purpose

Prevent accidental loss of important data and preserve historical records.

### Requirements

All major entities should support:

* created_at
* updated_at
* deleted_at

### Applicable Entities

* Organizations
* Buildings
* Floors
* Rooms
* Beds
* Memberships
* Complaints
* Payments
* Assets
* Reviews

### Rules

* Records are never permanently removed during normal operations.
* Deleted records are hidden from standard application views.

---

## Resident Exit Workflow

### Purpose

Provide a structured process when residents leave an organization.

### Exit Process

1. Resident initiates move-out request or organization starts exit process.
2. Move-out date is recorded.
3. Bed allocation is released.
4. Membership status becomes LEFT.
5. Historical records remain available.

### Tracked Information

* Move-Out Date
* Exit Reason
* Previous Bed
* Previous Room

---

## Complaint Attachments

### Purpose

Allow residents to provide evidence and context when reporting issues.

### Supported Attachments

* Images
* PDFs

### Examples

* Water leakage photo
* Broken equipment image
* Maintenance report PDF

### Requirements

* Multiple attachments per complaint are supported.
* Attachments are stored using Cloudinary.

---

## Review Restrictions

### Rules

* Only ACTIVE members can submit reviews.
* One resident may submit only one review per organization.
* Residents may edit their existing review.
* Organization owners cannot delete reviews.
* Reviews can be reported for moderation.

---

## Activity Feed

### Purpose

Provide visibility into recent organization activities.

### Example Events

* Resident Joined
* Resident Left
* Complaint Created
* Complaint Resolved
* Payment Recorded
* Announcement Published
* Review Submitted

### Visibility

#### Organization Owner

Can view organization activity.

#### Platform Admin

Can view platform-wide activity.

### Requirements

Activity Feed should be generated automatically from Audit Trail events.

---

## Search Ranking

### Purpose

Improve organization discovery experience.

### Ranking Factors

* Verification Status
* Average Rating
* Complaint Resolution Rate
* Average Resolution Time
* Profile Completeness

### Rules

Search results should prioritize higher-quality organizations.

---

# Suggested Project Structure

## Frontend

```text
apps/web
├── app
├── components
├── features
├── hooks
├── services
├── store
├── types
└── utils
```

---

## Backend

```text
src/main/java
├── auth
├── organization
├── resident
├── room
├── complaint
├── payment
├── announcement
├── review
├── notification
├── asset
├── role
├── audit
└── common
```

---

# V1 MVP Modules

1. Authentication
2. Organizations
3. Organization Verification
4. Memberships
5. Roles & Permissions
6. Amenities
7. Residents
8. Buildings
9. Floors
10. Rooms
11. Beds
12. Join Requests
13. Complaints
14. Announcements
15. Payments
16. Asset Management
17. Reviews & Ratings
18. Service Metrics
19. Availability Tracking
20. Notifications
21. Dashboards
22. Audit Trail

---

# Success Criteria

The MVP will be considered successful if:

* Organizations can onboard and manage residents
* Residents can join organizations and interact with services
* Occupancy and availability are tracked accurately
* Complaints and announcements function end-to-end
* Payments can be tracked manually
* Reviews and ratings are publicly visible
* Multi-tenant isolation is maintained
* Real-time notifications work reliably

---

# Future Enhancements (V2)

* Payment Gateway Integration
* Visitor Management
* Mobile Applications
* Smart Device Integrations
* Automated Billing
* Subscription Plans
* Analytics & Reporting
* AI-Powered Insights
* Subdomain-Based Multi-Tenancy
* Inventory Management
* Mess/Food Management
* Community Events Management
* Advanced Resident Verification
