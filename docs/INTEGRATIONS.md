# GCC Web — Integrations

The service business can run with no third-party account: orders are stored in
PostgreSQL, customers can pay cash or transfer, and WhatsApp messages are
logged to the server console. Two integrations make it production-grade:
WhatsApp delivery and Midtrans online payment.

- [WhatsApp](#1-whatsapp)
- [Midtrans](#2-midtrans)
- [Manual bank transfer](#3-manual-bank-transfer)
- [Other integrations](#4-other-integrations)
- [Security and operations](#5-security-and-operations)

## 1. WhatsApp

### 1.1 What is already integrated

`apps/api/src/integrations/whatsapp.ts` sends messages through a provider HTTP
API. It is used for:

| Event | Recipient | Content |
| --- | --- | --- |
| Booking created | customer | code, service, variant, unit count, schedule, estimated total, tracking link |
| Booking created | admin | code, customer name/phone, service, schedule, district/city, total |
| Status changed | customer | new status, technician name (or “will be assigned”), optional note, tracking link |
| Payment marked paid | customer | code, total, tracking link |

Messages are sent **after** the API response with `Promise.allSettled` /
fire-and-forget. A provider failure never fails the booking, but it is written
to the log.

The public contact form is **not** a server-side message queue. It composes a
`wa.me` link and opens WhatsApp with the text prefilled. That keeps the form
working without storing enquiry data, but it cannot be tracked server-side.

### 1.2 Environment

```env
WHATSAPP_PROVIDER=mock          # mock | fonnte | wablas
WHATSAPP_API_URL=https://api.fonnte.com/send
WHATSAPP_TOKEN=
ADMIN_WHATSAPP=6281234567890
WEB_ORIGIN=https://gcc-web.id
```

- `mock` (or any provider with an empty token) logs the message and returns
  success. This is the default and is safe for local development.
- Phone numbers are normalised to the `628…` form before sending.
- `ADMIN_WHATSAPP` receives the new-order alert. Use the business owner’s
  number, not a personal number that changes often.
- `WEB_ORIGIN` builds the tracking link; set it to the real HTTPS origin in
  production.

### 1.3 Fonnte

1. Create a Fonnte account and connect a WhatsApp device.
2. Copy the device token.
3. Set:

```env
WHATSAPP_PROVIDER=fonnte
WHATSAPP_API_URL=https://api.fonnte.com/send
WHATSAPP_TOKEN=<device token>
```

The adapter sends `application/x-www-form-urlencoded`:

```
Authorization: <device token>
target=6281234567890
message=Halo ...
```

Fonnte expects the token in the `Authorization` header (not `Bearer`). Verify
the current API contract in their dashboard; provider APIs change.

### 1.4 Wablas

```env
WHATSAPP_PROVIDER=wablas
WHATSAPP_API_URL=https://api.wablas.com/api/send-message
WHATSAPP_TOKEN=<token>
```

The adapter sends JSON `{ "phone": "628…", "message": "…" }` with the token in
the `Authorization` header. Some Wablas accounts require a different endpoint
or a `secret` query parameter; use the URL and header shown in your account.

### 1.5 Message templates

Templates are plain text in `whatsapp.ts`. Keep them short and actionable:

**Customer, booking created**

```
Halo Ayu, pesanan Anda di GCC Web sudah kami terima.

Kode: GCC-261024-7K2M
Layanan: Cuci AC — AC 0,5–1 PK (2 unit)
Jadwal: Sabtu, 24 Okt 2026 · 10.00–12.00
Estimasi: Rp150.000

Pantau status: https://gcc-web.id/lacak?code=GCC-261024-7K2M
Admin akan mengonfirmasi dan menugaskan teknisi. Balas pesan ini jika ada yang perlu diubah.
```

**Admin, new order**

```
Pesanan baru masuk.
GCC-261024-7K2M · Ayu Lestari · 6281311110001
Cuci AC (AC 0,5–1 PK) × 2
24 Okt 2026 10.00–12.00
Kebayoran Baru, Jakarta Selatan
Total Rp150.000
```

**Status change**

```
Halo Ayu, status pesanan GCC-261024-7K2M diperbarui.

Status: Teknisi ditugaskan
Teknisi: Budi

Lihat detail: https://gcc-web.id/lacak?code=GCC-261024-7K2M
```

If you edit a template, keep the booking code and tracking link. Those are the
two things customers need.

### 1.6 Testing

Without a provider:

1. Leave `WHATSAPP_PROVIDER=mock`.
2. Create a booking through `/booking`.
3. Watch the API console for `[whatsapp:mock] → 628…` and the message body.
4. Move the booking through admin statuses and confirm a message per change.

With a provider:

1. Set a test recipient in `ADMIN_WHATSAPP` first.
2. Create one booking; confirm the admin alert and the customer message.
3. Check the provider dashboard for delivery/read states.
4. Test a failed send (temporarily use a bad token) and confirm the API still
   returns success and logs a warning.

### 1.7 Operational rules

- **Opt-in:** a booking is a transaction, so a confirmation message is
  expected. Do not use these numbers for marketing without consent.
- **Quiet hours:** the adapter sends immediately. Avoid sending status updates
  late at night; route them through a queue with a delay if needed.
- **Rate limits:** WhatsApp providers and WhatsApp itself limit messages. At
  volume, move sends to a queue with retry/backoff.
- **No inbound automation:** replies go to the provider’s inbox or the phone.
  The app does not parse incoming WhatsApp messages.
- **No secrets in the client:** the token is server-only. Never prefix it with
  `NEXT_PUBLIC_`.
- **Template drift:** Indonesian text lives in code, not a CMS. If marketing
  needs to change copy, move templates into settings and version them.

## 2. Midtrans

### 2.1 What is integrated

The API integrates **Midtrans Snap** server-side:

1. Customer opens a booking and chooses to pay online (the public UI links to
   the tracking page; the Snap request is an API feature).
2. `POST /api/payments/snap` with `{ code, phone }`.
3. The API verifies the booking and phone, then calls Snap with:
   - `order_id = booking.code`
   - `gross_amount = round(booking.total)`
   - one item line for the total
   - customer name, phone, email, billing address
   - `finish` callback to `/lacak?code=…`
4. Snap returns a token and redirect URL. The booking becomes
   `paymentStatus = PENDING`, `paymentMethod = MIDTRANS`, and the token is
   stored in `paymentRef`.
5. The customer is redirected to the Snap page to choose a channel.
6. Midtrans calls `POST /api/payments/midtrans/notification`. The API verifies
   the signature and amount, maps the status, updates the booking, sends a
   WhatsApp receipt on first `PAID`, and writes an audit row.

`MIDTRANS_CLIENT_KEY` is reserved for a future Snap.js embed. The current flow
uses the server-returned `redirectUrl`, so only the server key is required.

### 2.2 Sandbox setup

1. Create a Midtrans sandbox account.
2. Copy **Server Key** and **Client Key** from Settings → Access Keys.
3. Set:

```env
MIDTRANS_SERVER_KEY=SB-Mid-server-…
MIDTRANS_CLIENT_KEY=SB-Mid-client-…
MIDTRANS_IS_PRODUCTION=false
```

With an empty server key, `/payments/snap` returns:

```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_UNAVAILABLE",
    "message": "Pembayaran online belum tersedia. Silakan pilih transfer atau bayar tunai di lokasi."
  }
}
```

This is expected until the key is set.

### 2.3 Notification URL

In Midtrans: Settings → Configuration → Payment Notification URL:

```
https://gcc-web.id/api/payments/midtrans/notification
```

For local testing, expose the API with a tunnel (ngrok, Cloudflare Tunnel) and
use the public URL. Midtrans cannot call `localhost`.

The handler must be publicly reachable without cookies. It authenticates the
request with the signature, not a session.

### 2.4 Signature and status mapping

Signature:

```
SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
```

The API compares it in constant time with `signature_key`. It also checks that
`Math.round(gross_amount)` equals the booking total. A mismatch returns
`400 BAD_REQUEST`; an invalid signature returns `401 INVALID_SIGNATURE`.

Status mapping:

| Midtrans `transaction_status` | `fraud_status` | Stored `PaymentStatus` |
| --- | --- | --- |
| `capture` | not `challenge` | `PAID` |
| `capture` | `challenge` | `PENDING` |
| `settlement` | — | `PAID` |
| `pending` | — | `PENDING` |
| `deny`, `cancel`, `expire`, `failure` | — | `FAILED` |
| `refund`, `partial_refund` | — | `REFUNDED` |
| anything else | — | `PENDING` |

If a booking is already `PAID` and a later non-paid notification arrives, it is
ignored so a delayed `pending` cannot un-pay a settled order. Unknown
`order_id`s are acknowledged with `{ received: true, ignored: true }` so
Midtrans stops retrying.

### 2.5 Sandbox test cards

Use the test cards from Midtrans’s simulator. A typical success test:

1. Create a booking in the app.
2. Call `/api/payments/snap` with its code and customer phone.
3. Open `redirectUrl`.
4. Pay with a sandbox card.
5. Confirm:
   - Midtrans dashboard shows `settlement`;
   - booking `paymentStatus` becomes `PAID`;
   - `paidAt` and `paymentRef` are set;
   - the customer receives the WhatsApp receipt (mock log is enough locally);
   - the admin booking detail shows the payment.

Test failure/expiry too. Do not ship until the webhook works from the public
internet, not just via a local manual POST.

### 2.6 Going live

1. Complete Midtrans account verification and switch to production keys.
2. Set `MIDTRANS_IS_PRODUCTION=true`.
3. Re-check the notification URL (production domain, HTTPS).
4. Make one small real transaction and refund it through the Midtrans
   dashboard.
5. Confirm the API maps it correctly and stores `paidAt`.
6. Keep the sandbox environment available for future tests.

### 2.7 Limitations

- There is no refund API call from admin. Refunds are handled in the Midtrans
  dashboard, then an admin sets `REFUNDED` manually. Audit both.
- Snap.js is not embedded; the customer leaves the site for the payment page.
- The item line is a single total, not one line per service and variant. This
  is acceptable for reconciliation by `order_id`; itemise it if finance needs
  a detailed Midtrans report.
- Notifications are processed synchronously. At higher volume, enqueue them and
  return `200` quickly.
- The `finish` redirect does not itself mark payment paid. Only the webhook
  does. Never trust the browser redirect for payment state.

## 3. Manual bank transfer

Settings → Pembayaran stores the bank name, account number, account holder, and
a note. These values are returned by `/api/settings/public` and shown on the
tracking and contact pages.

- `bankAccount` in seed is `0000000000`; replace it before launch. The admin
  settings page shows a warning while it is the placeholder.
- Customers transfer the exact total and send proof via WhatsApp.
- An admin marks the booking `PAID` with method `TRANSFER` and an optional
  reference after verifying the transfer.
- There is no automatic bank reconciliation. At volume, use a payment gateway
  or a bank mutation webhook.

## 4. Other integrations

| Need | Current state | Recommended next step |
| --- | --- | --- |
| Maps / address picker | plain address fields | add Google Maps Places or a free geocoder with a location pin |
| Email | none | add transactional email for receipts and admin alerts |
| Analytics | none | privacy-friendly analytics with consent |
| Google Business Profile | not connected | create profile, keep NAP consistent |
| Calendar for technicians | dashboard only | add ICS feed or Google Calendar sync |
| Accounting | none | export paid bookings (CSV) with date, code, customer, total, method |
| SMS fallback | none | add a provider when WhatsApp delivery is unreliable |

Do not add a third-party script to the public site without reviewing its
performance and privacy impact.

## 5. Security and operations

- Provider tokens and server keys are server-only. Check that no `NEXT_PUBLIC_`
  variable contains a secret.
- Rotate tokens immediately if exposed; then redeploy the API.
- Log provider failures without logging full message bodies containing customer
  phone numbers in production.
- Webhook endpoints are public by design. Rely on signature verification, not
  obscurity.
- Add idempotency if you move webhook handling to a queue; Midtrans can retry.
- Monitor: failed WhatsApp sends, 5xx from Snap, webhook 401s, and
  `paymentStatus = PENDING` bookings older than one hour.
- Alert the admin when a paid order has no technician assigned for the next
  day. That is the operational failure customers notice first.
