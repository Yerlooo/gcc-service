# GCC Web — Entity Relationship Diagram

The diagram and notes below mirror [`schema.sql`](./schema.sql) and
[`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma). PostgreSQL
15+ is the only supported database.

```mermaid
erDiagram
    User ||--o{ Session : "has sessions"
    User ||--o| TechnicianProfile : "has profile"
    User ||--o{ Booking : "is assigned to"
    User ||--o{ BookingStatusHistory : "changes"
    User ||--o{ StockMovement : "records"
    User ||--o{ AuditLog : "writes"

    ServiceCategory ||--o{ Service : "groups"
    Service ||--o{ ServiceVariant : "offers"
    Service ||--o{ Booking : "is booked"
    Service ||--o{ Testimonial : "is reviewed"

    Customer ||--o{ Booking : "places"
    ServiceVariant ||--o{ Booking : "selected as"
    Booking ||--o{ BookingStatusHistory : "records"
    Booking ||--o{ StockMovement : "consumes"
    Booking ||--o| Testimonial : "may receive"

    InventoryItem ||--o{ StockMovement : "moves"

    User {
        text id PK
        text name
        text email UK
        text phone
        text passwordHash
        Role role
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Session {
        text id PK
        text userId FK
        text refreshTokenHash
        text userAgent
        text ip
        datetime expiresAt
        datetime revokedAt
        datetime createdAt
    }

    TechnicianProfile {
        text id PK
        text userId FK,UK
        text zone
        text_array specialties
        int capacityPerDay
        boolean isAvailable
        text notes
        datetime createdAt
        datetime updatedAt
    }

    ServiceCategory {
        text id PK
        text slug UK
        text name
        text description
        int sortOrder
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Service {
        text id PK
        text categoryId FK
        text slug UK
        text name
        text shortDescription
        text description
        decimal basePrice
        ServiceUnit unit
        int durationMinutes
        int warrantyDays
        boolean isActive
        boolean isFeatured
        int sortOrder
        datetime createdAt
        datetime updatedAt
    }

    ServiceVariant {
        text id PK
        text serviceId FK
        text name
        decimal price
        int durationMinutes
        int sortOrder
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Customer {
        text id PK
        text name
        text phone UK
        text email
        text address
        text city
        text district
        text postalCode
        text notes
        datetime createdAt
        datetime updatedAt
    }

    Booking {
        text id PK
        text code UK
        text customerId FK
        text serviceId FK
        text variantId FK
        text technicianId FK
        BookingStatus status
        PaymentStatus paymentStatus
        PaymentMethod paymentMethod
        BookingSource source
        datetime scheduledAt
        text slotLabel
        int durationMinutes
        PropertyType propertyType
        text address
        text city
        text district
        text postalCode
        text notes
        int unitCount
        decimal basePrice
        decimal addOnTotal
        decimal discount
        decimal total
        text paymentRef
        datetime paidAt
        datetime completedAt
        datetime createdAt
        datetime updatedAt
    }

    BookingStatusHistory {
        text id PK
        text bookingId FK
        BookingStatus status
        text note
        text changedById FK
        datetime createdAt
    }

    Testimonial {
        text id PK
        text bookingId FK,UK
        text serviceId FK
        text customerName
        text customerMeta
        int rating
        text content
        boolean isPublished
        boolean isFeatured
        datetime createdAt
        datetime updatedAt
    }

    InventoryItem {
        text id PK
        text sku UK
        text name
        text category
        text unit
        int quantity
        int minQuantity
        decimal costPrice
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    StockMovement {
        text id PK
        text itemId FK
        StockMovementType type
        int quantity
        text note
        text bookingId FK
        text createdById FK
        datetime createdAt
    }

    Setting {
        text key PK
        jsonb value
        datetime updatedAt
    }

    AuditLog {
        text id PK
        text userId FK
        text action
        text entity
        text entityId
        jsonb meta
        text ip
        datetime createdAt
    }
```

## Relationship rules

| Parent | Child | Cardinality | On delete |
| --- | --- | --- | --- |
| `User` | `Session` | 1 : N | `CASCADE` |
| `User` | `TechnicianProfile` | 1 : 0..1 | `CASCADE` |
| `User` (technician) | `Booking` | 1 : N | `SET NULL` |
| `User` | `BookingStatusHistory.changedBy` | 1 : N | `SET NULL` |
| `User` | `AuditLog` | 1 : N | `SET NULL` |
| `ServiceCategory` | `Service` | 1 : N | `RESTRICT` |
| `Service` | `ServiceVariant` | 1 : N | `CASCADE` |
| `Customer` | `Booking` | 1 : N | `RESTRICT` |
| `Service` | `Booking` | 1 : N | `RESTRICT` |
| `ServiceVariant` | `Booking` | 1 : N | `SET NULL` |
| `Booking` | `BookingStatusHistory` | 1 : N | `CASCADE` |
| `Booking` | `Testimonial` | 1 : 0..1 | `SET NULL` |
| `Booking` | `StockMovement` | 1 : N | `SET NULL` |
| `Service` | `Testimonial` | 1 : N | `SET NULL` |
| `InventoryItem` | `StockMovement` | 1 : N | `CASCADE` |

Customers and catalogue rows are never hard-deleted while a booking references
them. Deactivate a service or technician instead of deleting history.

## Enum reference

| Enum | Values |
| --- | --- |
| `Role` | `ADMIN`, `TECHNICIAN` |
| `BookingStatus` | `PENDING`, `CONFIRMED`, `ASSIGNED`, `EN_ROUTE`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `PaymentStatus` | `UNPAID`, `PENDING`, `PAID`, `FAILED`, `REFUNDED` |
| `PaymentMethod` | `CASH`, `TRANSFER`, `QRIS`, `EWALLET`, `MIDTRANS` |
| `BookingSource` | `WEBSITE`, `WHATSAPP`, `PHONE` |
| `ServiceUnit` | `UNIT`, `POINT`, `PACKAGE`, `METER` |
| `PropertyType` | `RUMAH`, `APARTEMEN`, `KANTOR`, `RUKO`, `LAINNYA` |
| `StockMovementType` | `IN`, `OUT`, `ADJUSTMENT` |

## Booking state machine

```
PENDING ──► CONFIRMED ──► ASSIGNED ──► EN_ROUTE ──► IN_PROGRESS ──► COMPLETED
   │            │            │            │              │
   └────────────┴────────────┴────────────┴──────────────┴────────► CANCELLED
```

Every transition is validated by the API (`apps/api/src/lib/status.ts`) and
recorded in `BookingStatusHistory` with the acting admin, an optional note and
a timestamp. `COMPLETED` and `CANCELLED` are terminal. Cancelling a booking
frees its slot; completed bookings can no longer be reassigned.

## Money and time

- All prices are `DECIMAL(12,2)` in rupiah, computed server-side from the
  catalogue. The browser never submits a price.
- `Booking.scheduledAt` is stored as UTC. The API converts a Jakarta-local
  date plus slot id (`08:00-10:00`, `10:00-12:00`, `13:00-15:00`,
  `15:00-17:00`) with `Asia/Jakarta` rules before writing.
- `slotLabel` stores the slot id, matching `TIME_SLOTS` in
  `apps/api/src/lib/slots.ts`.
- Booking codes use `GCC-YYMMDD-XXXX` with a random four-character suffix and
  a database uniqueness check.

## Index rationale

| Index | Used by |
| --- | --- |
| `User(role, isActive)` | technician pickers and account lists |
| `Session(expiresAt)` | expired-session cleanup |
| `Service(categoryId, isActive)` | public catalogue by category |
| `Booking(status, scheduledAt)` | dashboard queue and slot counts |
| `Booking(technicianId, scheduledAt)` | daily technician workload |
| `Booking(scheduledAt)` | availability queries and today's schedule |
| `BookingStatusHistory(bookingId, createdAt)` | detail timeline in order |
| `Testimonial(isPublished, isFeatured)` | public testimonial sections |
| `StockMovement(itemId, createdAt)` | item movement history |
| `AuditLog(entity, entityId)` | tracing changes to one record |
