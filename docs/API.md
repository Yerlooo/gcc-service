# GCC Web — API Reference

Base URL (development): `http://localhost:4000/api`

All request and response bodies are JSON. The API is stateless apart from
PostgreSQL and the two authentication cookies.

- [Conventions](#conventions)
- [Authentication](#authentication)
- [Public endpoints](#public-endpoints)
- [Admin endpoints](#admin-endpoints)
- [Error codes](#error-codes)

## Conventions

### Success envelope

```json
{ "success": true, "data": { } }
```

Paginated responses add:

```json
{
  "success": true,
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

### Error envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validasi gagal.",
    "details": [{ "path": "customer.phone", "message": "Nomor WhatsApp tidak valid." }]
  }
}
```

### HTTP status

| Status | Meaning |
| --- | --- |
| `200` | success |
| `201` | resource created (booking, login is `200`, stock movement is `201`) |
| `400` | malformed or logically invalid request |
| `401` | missing/expired session, bad signature |
| `403` | authenticated but wrong role |
| `404` | resource not found (also used to avoid confirming a tracking code) |
| `409` | conflict: slot full, duplicate, invalid transition |
| `422` | Zod validation failure or unprocessable state |
| `429` | rate limited |
| `500` | unexpected server error |
| `502` | Midtrans rejected a request |
| `503` | database not ready or payment gateway not configured |

### Money and dates

- Booking, payment, dashboard and inventory money is a JSON **number**.
- Catalogue prices (`/services`, `/admin/services`, `/admin/categories`) are
  Prisma `Decimal` values and therefore serialise as **strings** such as
  `"75000"`. Convert with `Number()` before doing arithmetic.
- Date-times are ISO-8601 UTC strings (`2026-10-22T01:00:00.000Z`).
- Booking dates submitted by customers are Jakarta-local `YYYY-MM-DD`.
- Booking slots are `08:00-10:00`, `10:00-12:00`, `13:00-15:00`, `15:00-17:00`.

### Rate limits

| Scope | Limit |
| --- | --- |
| Login | 8 failed attempts / IP / 15 min |
| Create booking | 10 / IP / hour |
| Tracking, testimonial submit, Snap | 20 / IP / 15 min |
| General public API | 120 / IP / min |

Rate-limited responses return `429 RATE_LIMITED`.

## Authentication

Cookies set on login:

| Cookie | Default TTL | Attributes |
| --- | --- | --- |
| `gcc_access` | 15 minutes | httpOnly, path `/`, SameSite Lax (dev) / None+Secure (prod) |
| `gcc_refresh` | 7 days | same |

Send cookies with `credentials: 'include'` (browser) or a cookie jar (cURL).
Access tokens are also accepted as `Authorization: Bearer <token>`.

### `POST /auth/login`

```bash
curl -i -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@gcc-web.id","password":"Admin#12345"}'
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "…",
      "name": "GCC Admin",
      "email": "admin@gcc-web.id",
      "phone": "6281200000001",
      "role": "ADMIN",
      "isActive": true,
      "technician": null
    },
    "expiresAt": "2026-10-28T01:00:00.000Z"
  }
}
```

Failure is always `401 UNAUTHORIZED` with “Email atau kata sandi salah.”
Unknown emails and wrong passwords are indistinguishable.

### `POST /auth/refresh`

Uses `gcc_refresh`, rotates both cookies and returns the same shape as login.
A reused/stale refresh token revokes every session for that user.

### `POST /auth/logout`

Revokes the current refresh session and clears both cookies. Always returns
success, even if the token was already invalid.

### `GET /auth/me`

Requires a valid access token. Returns the safe user object shown above.
The admin layout uses this to decide whether to redirect to `/admin/login`.

## Public endpoints

### `GET /health`

```json
{
  "success": true,
  "data": { "status": "ok", "database": "up", "time": "2026-10-21T03:00:00.000Z" }
}
```

Returns `503 NOT_READY` if PostgreSQL is unreachable.

### `GET /services`

Query: `category` (category slug), `featured=true|false`.

Returns active categories that contain at least one active service. Each
service includes active variants sorted by `sortOrder`.

```json
{
  "success": true,
  "data": [
    {
      "id": "…",
      "slug": "servis-ac",
      "name": "Servis & Perawatan AC",
      "description": "…",
      "services": [
        {
          "id": "…",
          "slug": "cuci-ac",
          "name": "Cuci AC",
          "shortDescription": "…",
          "description": "…",
          "basePrice": "75000",
          "unit": "UNIT",
          "durationMinutes": 60,
          "warrantyDays": 7,
          "isFeatured": true,
          "sortOrder": 1,
          "variants": [
            {
              "id": "…",
              "name": "AC 0,5–1 PK",
              "price": "75000",
              "durationMinutes": 60,
              "sortOrder": 1,
              "isActive": true
            }
          ]
        }
      ]
    }
  ]
}
```

### `GET /services/:slug`

Returns one active service with the same fields plus
`category: { slug, name }`. `404 NOT_FOUND` if missing or inactive.

### `GET /bookings/availability?date=YYYY-MM-DD`

```json
{
  "success": true,
  "data": {
    "date": "2026-10-22",
    "slots": [
      {
        "id": "08:00-10:00",
        "label": "08.00–10.00",
        "start": "08:00",
        "end": "10:00",
        "capacity": 3,
        "booked": 1,
        "remaining": 2,
        "available": true
      },
      {
        "id": "10:00-12:00",
        "label": "10.00–12.00",
        "start": "10:00",
        "end": "12:00",
        "capacity": 3,
        "booked": 3,
        "remaining": 0,
        "available": false,
        "reason": "Slot penuh."
      }
    ]
  }
}
```

Past dates return all slots unavailable with reason “Tanggal sudah lewat.”
Today’s slots whose start time has passed return reason “Jam ini sudah lewat.”
`capacity` comes from `SLOT_CAPACITY` (default 3).

### `POST /bookings`

```bash
curl -X POST http://localhost:4000/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{
    "serviceId": "5f3c2c9e-…",
    "variantId": "b8e0f1a2-…",
    "scheduledDate": "2026-10-24",
    "slot": "10:00-12:00",
    "propertyType": "RUMAH",
    "unitCount": 2,
    "notes": "Gate kompleks, hubungi sebelum masuk.",
    "customer": {
      "name": "Ayu Lestari",
      "phone": "081311110001",
      "email": "ayu@example.com",
      "address": "Jl. Melati No. 12, RT 03/RW 05",
      "city": "Jakarta Selatan",
      "district": "Kebayoran Baru",
      "postalCode": "12130",
      "notes": "Anjing di halaman, mohon diikat."
    }
  }'
```

Validation:

| Field | Rule |
| --- | --- |
| `serviceId` | UUID of an active service |
| `variantId` | optional UUID belonging to that service |
| `scheduledDate` | `YYYY-MM-DD`, today or later, at most 60 days ahead |
| `slot` | one of the four slot ids; must not have started |
| `propertyType` | `RUMAH`, `APARTEMEN`, `KANTOR`, `RUKO`, `LAINNYA` (default `RUMAH`) |
| `unitCount` | integer 1–20 |
| `notes` | optional, ≤ 600 chars |
| `customer.name` | 2–100 chars |
| `customer.phone` | Indonesian mobile, normalised to `62…` |
| `customer.email` | optional valid email, ≤ 120 |
| `customer.address` | 10–300 chars |
| `customer.city`, `district` | 2–80 chars |
| `customer.postalCode` | optional exactly 5 digits |

The server recomputes the price from the active variant or service base price.
Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "…",
    "code": "GCC-261024-7K2M",
    "status": "PENDING",
    "statusLabel": "Menunggu konfirmasi",
    "paymentStatus": "UNPAID",
    "scheduledAt": "2026-10-24T03:00:00.000Z",
    "slotLabel": "10.00–12.00",
    "unitCount": 2,
    "basePrice": 150000,
    "addOnTotal": 0,
    "discount": 0,
    "total": 150000,
    "customer": { "…": "…" },
    "service": { "name": "Cuci AC", "slug": "cuci-ac" },
    "variant": { "name": "AC 0,5–1 PK" }
  }
}
```

Codes use `GCC-YYMMDD-XXXX` with a random four-character suffix. At most 3
active bookings may share a slot; the check runs inside a serializable
transaction. `409 CONFLICT` means the slot filled while the customer was
typing. WhatsApp notifications are sent after the response and do not affect
it.

### `GET /bookings/track/:code?phone=…`

The public tracking page normally sends the phone. Without a phone, only
masked customer details and no notes are returned (`verified: false`).
With a phone that does not match, the API returns `404` — it does not reveal
that the code exists.

```json
{
  "success": true,
  "data": {
    "code": "GCC-261024-7K2M",
    "status": "ASSIGNED",
    "statusLabel": "Teknisi ditugaskan",
    "paymentStatus": "UNPAID",
    "paymentMethod": null,
    "scheduledAt": "2026-10-24T03:00:00.000Z",
    "slotLabel": "10.00–12.00",
    "createdAt": "2026-10-21T02:12:00.000Z",
    "total": 150000,
    "city": "Jakarta Selatan",
    "district": "Kebayoran Baru",
    "service": { "name": "Cuci AC", "slug": "cuci-ac" },
    "variant": { "name": "AC 0,5–1 PK" },
    "technician": { "name": "Budi" },
    "customer": {
      "name": "Ayu Lestari",
      "phone": "6281311110001",
      "address": "Jl. Melati No. 12, RT 03/RW 05",
      "postalCode": "12130"
    },
    "notes": "Gate kompleks, hubungi sebelum masuk.",
    "verified": true,
    "history": [
      { "status": "PENDING", "label": "Menunggu konfirmasi", "note": "Pesanan dibuat melalui website.", "createdAt": "…" }
    ]
  }
}
```

### `GET /testimonials?featured=true|false&limit=9`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "…",
        "customerName": "Dimas Nugroho",
        "customerMeta": "Kembangan, Jakarta Barat · Cuci AC",
        "rating": 5,
        "content": "…",
        "createdAt": "…",
        "service": { "name": "Cuci AC", "slug": "cuci-ac" }
      }
    ],
    "average": 4.8,
    "total": 6
  }
}
```

Only published reviews are returned; `average` and `total` count all published
reviews, not just the requested limit.

### `POST /testimonials/submit`

```json
{ "code": "GCC-261018-AB12", "phone": "081311110001", "rating": 5, "content": "Pengerjaan rapi…" }
```

The booking must exist, belong to that phone, be `COMPLETED`, and not already
have a review. New reviews are created unpublished for moderation. Response
`201` includes `{ id, rating, createdAt, message }`.

### `GET /technicians`

Public, minimal technician list for the “meet the team” section:

```json
{ "success": true, "data": [{ "name": "Budi Santoso", "technician": { "zone": "…", "specialties": ["Cuci AC"] } }] }
```

### `GET /settings/public`

Returns `{ business, payment }` with the same shapes as
`docs/INTEGRATIONS.md`. Missing keys fall back to server defaults. The bank
account in the seed is a placeholder.

### `POST /payments/snap`

```bash
curl -X POST http://localhost:4000/api/payments/snap \
  -H 'Content-Type: application/json' \
  -d '{"code":"GCC-261024-7K2M","phone":"081311110001"}'
```

Returns `201`:

```json
{
  "success": true,
  "data": {
    "code": "GCC-261024-7K2M",
    "token": "…",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/…",
    "total": 150000
  }
}
```

Sets the booking’s payment status to `PENDING`, method to `MIDTRANS`, and
stores the Snap token in `paymentRef`. Returns `503 PAYMENT_UNAVAILABLE` when
`MIDTRANS_SERVER_KEY` is empty.

### `POST /payments/midtrans/notification`

Webhook for Midtrans. It must receive the raw notification fields
`order_id`, `status_code`, `gross_amount`, `signature_key`,
`transaction_status`, and optionally `fraud_status`, `transaction_id`,
`payment_type`. The API verifies the SHA-512 signature and the amount, maps the
transaction status, updates the booking, and records an audit entry. Unknown
order ids return `{ received: true, ignored: true }`.

## Admin endpoints

Every route below requires `gcc_access` (or Bearer token) and role `ADMIN`.
Authentication and role checks run before the controller.

### `GET /admin/dashboard?range=7d|30d`

Returns KPIs, today’s schedule, recent bookings, status breakdown, daily trend,
low stock, pending review count, latest pending reviews, and technician
workload:

```json
{
  "success": true,
  "data": {
    "generatedAt": "…",
    "range": "7d",
    "kpis": {
      "bookingsToday": 4,
      "pendingConfirmations": 2,
      "activeJobs": 3,
      "completedThisMonth": 6,
      "revenueThisMonth": 800000,
      "slotCapacity": 3
    },
    "todaySchedule": [],
    "recentBookings": [],
    "statusBreakdown": [{ "status": "PENDING", "label": "Menunggu konfirmasi", "count": 2 }],
    "trend": [{ "date": "2026-10-15", "bookings": 3, "revenue": 450000 }],
    "lowStock": [],
    "pendingTestimonials": 1,
    "latestTestimonials": [],
    "technicians": [{ "id": "…", "name": "Budi", "zone": "…", "isAvailable": true, "workload": 2, "capacity": 4 }]
  }
}
```

`revenueThisMonth` sums bookings with `paymentStatus = PAID` and `paidAt`
inside the current Jakarta month.

### `GET /admin/bookings`

Query:

| Param | Notes |
| --- | --- |
| `status` | `PENDING`, `CONFIRMED`, `ASSIGNED`, `EN_ROUTE`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `paymentStatus` | `UNPAID`, `PENDING`, `PAID`, `FAILED`, `REFUNDED` |
| `technicianId` | UUID |
| `from`, `to` | `YYYY-MM-DD`, Jakarta day bounds, inclusive |
| `q` | code, customer name, phone digits, or address |
| `page` | default 1 |
| `limit` | default 20, max 100 |

Each row includes `customer`, `service`, `variant`, `technician`, and numeric
money fields. Sorted by `scheduledAt desc`, then `createdAt desc`.

### `GET /admin/bookings/:id`

Full detail: customer, service with category, variant, technician with profile,
`history` (ascending, with `changedBy.name`), stock movements, testimonial,
and numeric money fields.

### `PATCH /admin/bookings/:id/status`

```json
{ "status": "CONFIRMED", "note": "Jadwal dikonfirmasi melalui WhatsApp." }
```

Only transitions from the state machine are accepted. `ASSIGNED`, `EN_ROUTE`,
`IN_PROGRESS`, and `COMPLETED` require an assigned technician. `COMPLETED` sets
`completedAt`. Writes history + audit and sends a WhatsApp status message.
Returns the full booking.

### `PATCH /admin/bookings/:id/assign`

```json
{ "technicianId": "0d7a…", "note": "Teknisi area Kebayoran." }
```

Rejects inactive/unavailable technicians, daily capacity overflow, a
same-slot conflict, and bookings already en route/in progress/completed.
Assigning a pending or confirmed order also moves it to `ASSIGNED`.

### `PATCH /admin/bookings/:id/payment`

```json
{ "status": "PAID", "method": "TRANSFER", "reference": "TRX-123", "note": "Transfer BCA" }
```

| Field | Notes |
| --- | --- |
| `status` | required payment status |
| `method` | required when moving to `PAID` or `PENDING` |
| `reference` | optional, ≤ 120 chars |
| `note` | audit-only note, ≤ 300 chars |

Refund only from `PAID`. A cancelled booking cannot be marked paid. `PAID`
sets `paidAt` and sends a receipt message. Without a status change, a
reference/method can still be corrected.

### Services and categories

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/admin/services` | all services, category, variants, booking count |
| `POST` | `/admin/services` | name, categoryId, shortDescription, description, basePrice, optional variants |
| `PATCH` | `/admin/services/:id` | partial service fields |
| `DELETE` | `/admin/services/:id` | soft deactivate (`isActive: false`) |
| `POST` | `/admin/services/:id/variants` | name, price, durationMinutes, sortOrder, isActive |
| `PATCH` | `/admin/services/:id/variants/:variantId` | partial variant |
| `DELETE` | `/admin/services/:id/variants/:variantId` | soft deactivate |

`POST /admin/services` body:

```json
{
  "categoryId": "0d7a…",
  "name": "Servis Kipas Angin",
  "slug": "servis-kipas-angin",
  "shortDescription": "Pembersihan dan pengecekan motor kipas.",
  "description": "Pembersihan menyeluruh, pelumasan, dan pengecekan kelistrikan…",
  "basePrice": 90000,
  "unit": "UNIT",
  "durationMinutes": 60,
  "warrantyDays": 14,
  "isActive": true,
  "isFeatured": false,
  "sortOrder": 4,
  "variants": [{ "name": "Kipas meja", "price": 90000, "durationMinutes": 45 }]
}
```

Slugs are generated from the name when omitted and made unique with `-2`,
`-3`, etc.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/admin/categories` | categories with service counts |
| `POST` | `/admin/categories` | name, optional slug/description/sortOrder/isActive |
| `PATCH` | `/admin/categories/:id` | partial |

There is no category delete endpoint; deactivate instead.

### Technicians

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/admin/technicians?date=YYYY-MM-DD` | all technicians, optional workload/remaining |
| `POST` | `/admin/technicians` | creates user + profile |
| `PATCH` | `/admin/technicians/:id` | user/profile fields, optional password |
| `DELETE` | `/admin/technicians/:id` | deactivates account and revokes sessions |

Create body:

```json
{
  "name": "Budi Santoso",
  "email": "budi@gcc-web.id",
  "phone": "081200000002",
  "password": "Teknisi#12345",
  "zone": "Jakarta Selatan · Kebayoran, Cilandak",
  "specialties": ["Cuci AC", "Isi freon"],
  "capacityPerDay": 4,
  "isAvailable": true,
  "notes": "Bisa unit cassette."
}
```

Responses return the user plus a nested `technician` profile:
`{ id, name, email, phone, isActive, createdAt, technician: { zone, specialties, capacityPerDay, isAvailable, notes } }`.
Changing a password revokes that technician’s sessions.

### Testimonials

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/admin/testimonials` | all reviews, unpublished first, newest first |
| `POST` | `/admin/testimonials` | create manually (customerName, content, rating, optional serviceId/bookingId/flags) |
| `PATCH` | `/admin/testimonials/:id` | partial, commonly `{ isPublished }`, `{ isFeatured }` |
| `DELETE` | `/admin/testimonials/:id` | permanent delete |

Publishing a featured review does not automatically publish it; send both
`{ "isPublished": true, "isFeatured": true }` when needed.

### Inventory

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/admin/inventory?q=&category=&lowStock=true` | items with `isLowStock` and numeric `costPrice` |
| `GET` | `/admin/inventory/categories` | distinct category strings |
| `POST` | `/admin/inventory` | create an item |
| `PATCH` | `/admin/inventory/:id` | update item fields except quantity |
| `DELETE` | `/admin/inventory/:id` | soft deactivate |
| `GET` | `/admin/inventory/:id/movements?limit=30` | movement history, max 100 |
| `POST` | `/admin/inventory/:id/movements` | record movement |

Create body:

```json
{
  "sku": "FRN-R32",
  "name": "Freon R32",
  "category": "Freon",
  "unit": "kg",
  "quantity": 8,
  "minQuantity": 3,
  "costPrice": 95000,
  "isActive": true
}
```

Movement body:

```json
{ "type": "OUT", "quantity": 2, "note": "Dipakai pesanan GCC-261021-AB12", "bookingId": "…" }
```

`IN` adds, `OUT` subtracts, and `ADJUSTMENT` sets the physical count
(`quantity` is the counted total, not a delta). The stored movement quantity is
the signed delta. Stock cannot go below zero. Response `201`:
`{ movement, item }`.

### Settings

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/admin/settings` | effective settings merged with defaults |
| `PUT` | `/admin/settings` | partial `business` and/or `payment` objects |

```json
{
  "business": {
    "name": "GCC Web",
    "tagline": "Servis AC dan elektronik rumah, dikerjakan rapi dan bergaransi.",
    "phone": "0812-3456-7890",
    "whatsapp": "6281234567890",
    "email": "halo@gcc-web.id",
    "address": "Jl. Contoh Raya No. 1",
    "city": "Jakarta Selatan",
    "district": "Kebayoran Baru",
    "serviceAreas": ["Jakarta Selatan", "Depok"],
    "hours": "Senin–Sabtu, 08.00–17.00",
    "instagram": ""
  },
  "payment": {
    "bankName": "BCA",
    "bankAccount": "1234567890",
    "accountName": "GCC Web",
    "note": "Konfirmasi bukti transfer melalui WhatsApp."
  }
}
```

The request is strict: unknown top-level keys are rejected. Missing fields are
merged into the current stored value. Settings writes are audited.

## Error codes

| Code | Typical cause |
| --- | --- |
| `VALIDATION_ERROR` | Zod issues; inspect `details[].path` |
| `BAD_REQUEST` | past date, quantity, stock, amount mismatch |
| `UNAUTHORIZED` | no/expired access token, bad credentials |
| `FORBIDDEN` | technician calling an admin route |
| `NOT_FOUND` | missing record, mismatched tracking phone |
| `CONFLICT` | full slot, duplicate record, invalid transition, capacity |
| `UNPROCESSABLE` | status transition not allowed, missing technician, refund rules |
| `RATE_LIMITED` | limiter exceeded |
| `PAYMENT_UNAVAILABLE` | Midtrans key not configured |
| `PAYMENT_GATEWAY_ERROR` | Midtrans rejected the Snap request |
| `INVALID_SIGNATURE` | Midtrans webhook signature mismatch |
| `NOT_READY` | `/health` database probe failed |
| `INTERNAL_ERROR` | unhandled server error |

## Postman

1. Create an environment with `baseUrl = http://localhost:4000/api`.
2. Send `POST {{baseUrl}}/auth/login` with the admin credentials and enable
   cookie storage for the collection.
3. All `/admin/*` requests then reuse the `gcc_access` cookie. No bearer token
   variable is required.
4. Import the request examples above, or generate a collection from this file.
