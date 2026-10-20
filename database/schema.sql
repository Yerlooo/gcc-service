-- ─────────────────────────────────────────────────────────────
-- GCC Web — PostgreSQL schema
-- Target: PostgreSQL 15+
--
-- Apply to an EMPTY database:
--   createdb gcc_web
--   psql -d gcc_web -f database/schema.sql
--
-- This file mirrors apps/api/prisma/schema.prisma. If the Prisma
-- schema changes, update this file in the same commit.
-- ─────────────────────────────────────────────────────────────

BEGIN;

-- ─────────────────────────── Enums ───────────────────────────

CREATE TYPE "Role" AS ENUM ('ADMIN', 'TECHNICIAN');

CREATE TYPE "BookingStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'ASSIGNED',
  'EN_ROUTE',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'UNPAID',
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE "PaymentMethod" AS ENUM (
  'CASH',
  'TRANSFER',
  'QRIS',
  'EWALLET',
  'MIDTRANS'
);

CREATE TYPE "BookingSource" AS ENUM ('WEBSITE', 'WHATSAPP', 'PHONE');

CREATE TYPE "ServiceUnit" AS ENUM ('UNIT', 'POINT', 'PACKAGE', 'METER');

CREATE TYPE "PropertyType" AS ENUM ('RUMAH', 'APARTEMEN', 'KANTOR', 'RUKO', 'LAINNYA');

CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- ─────────────────────────── Identity ───────────────────────────

CREATE TABLE "User" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "phone"        TEXT,
  "passwordHash" TEXT NOT NULL,
  "role"         "Role" NOT NULL DEFAULT 'TECHNICIAN',
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

CREATE TABLE "Session" (
  "id"               TEXT NOT NULL,
  "userId"           TEXT NOT NULL,
  "refreshTokenHash" TEXT NOT NULL,
  "userAgent"        TEXT,
  "ip"               TEXT,
  "expiresAt"        TIMESTAMP(3) NOT NULL,
  "revokedAt"        TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TechnicianProfile" (
  "id"             TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "zone"           TEXT NOT NULL,
  "specialties"    TEXT[] NOT NULL,
  "capacityPerDay" INTEGER NOT NULL DEFAULT 4,
  "isAvailable"    BOOLEAN NOT NULL DEFAULT true,
  "notes"          TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TechnicianProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TechnicianProfile_userId_key" ON "TechnicianProfile"("userId");

ALTER TABLE "TechnicianProfile"
  ADD CONSTRAINT "TechnicianProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────── Catalogue ───────────────────────────

CREATE TABLE "ServiceCategory" (
  "id"          TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

CREATE TABLE "Service" (
  "id"               TEXT NOT NULL,
  "categoryId"       TEXT NOT NULL,
  "slug"             TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "description"      TEXT NOT NULL,
  "basePrice"        DECIMAL(12,2) NOT NULL,
  "unit"             "ServiceUnit" NOT NULL DEFAULT 'UNIT',
  "durationMinutes"  INTEGER NOT NULL DEFAULT 60,
  "warrantyDays"     INTEGER NOT NULL DEFAULT 30,
  "isActive"         BOOLEAN NOT NULL DEFAULT true,
  "isFeatured"       BOOLEAN NOT NULL DEFAULT false,
  "sortOrder"        INTEGER NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
CREATE INDEX "Service_categoryId_isActive_idx" ON "Service"("categoryId", "isActive");
CREATE INDEX "Service_isFeatured_idx" ON "Service"("isFeatured");

ALTER TABLE "Service"
  ADD CONSTRAINT "Service_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ServiceVariant" (
  "id"              TEXT NOT NULL,
  "serviceId"       TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "price"           DECIMAL(12,2) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "sortOrder"       INTEGER NOT NULL DEFAULT 0,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceVariant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceVariant_serviceId_name_key" ON "ServiceVariant"("serviceId", "name");
CREATE INDEX "ServiceVariant_serviceId_isActive_idx" ON "ServiceVariant"("serviceId", "isActive");

ALTER TABLE "ServiceVariant"
  ADD CONSTRAINT "ServiceVariant_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────── Customers & orders ───────────────────────────

CREATE TABLE "Customer" (
  "id"         TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "phone"      TEXT NOT NULL,
  "email"      TEXT,
  "address"    TEXT NOT NULL,
  "city"       TEXT NOT NULL,
  "district"   TEXT NOT NULL,
  "postalCode" TEXT,
  "notes"      TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
CREATE INDEX "Customer_city_district_idx" ON "Customer"("city", "district");

CREATE TABLE "Booking" (
  "id"              TEXT NOT NULL,
  "code"            TEXT NOT NULL,
  "customerId"      TEXT NOT NULL,
  "serviceId"       TEXT NOT NULL,
  "variantId"       TEXT,
  "technicianId"    TEXT,
  "status"          "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "paymentStatus"   "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "paymentMethod"   "PaymentMethod",
  "source"          "BookingSource" NOT NULL DEFAULT 'WEBSITE',
  "scheduledAt"     TIMESTAMP(3) NOT NULL,
  "slotLabel"       TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "propertyType"    "PropertyType" NOT NULL DEFAULT 'RUMAH',
  "address"         TEXT NOT NULL,
  "city"            TEXT NOT NULL,
  "district"        TEXT NOT NULL,
  "postalCode"      TEXT,
  "notes"           TEXT,
  "unitCount"       INTEGER NOT NULL DEFAULT 1,
  "basePrice"       DECIMAL(12,2) NOT NULL,
  "addOnTotal"      DECIMAL(12,2) NOT NULL DEFAULT 0,
  "discount"        DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total"           DECIMAL(12,2) NOT NULL,
  "paymentRef"      TEXT,
  "paidAt"          TIMESTAMP(3),
  "completedAt"     TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Booking_code_key" ON "Booking"("code");
CREATE INDEX "Booking_status_scheduledAt_idx" ON "Booking"("status", "scheduledAt");
CREATE INDEX "Booking_technicianId_scheduledAt_idx" ON "Booking"("technicianId", "scheduledAt");
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");
CREATE INDEX "Booking_scheduledAt_idx" ON "Booking"("scheduledAt");

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ServiceVariant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_technicianId_fkey"
  FOREIGN KEY ("technicianId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "BookingStatusHistory" (
  "id"          TEXT NOT NULL,
  "bookingId"   TEXT NOT NULL,
  "status"      "BookingStatus" NOT NULL,
  "note"        TEXT,
  "changedById" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingStatusHistory_bookingId_createdAt_idx"
  ON "BookingStatusHistory"("bookingId", "createdAt");

ALTER TABLE "BookingStatusHistory"
  ADD CONSTRAINT "BookingStatusHistory_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingStatusHistory"
  ADD CONSTRAINT "BookingStatusHistory_changedById_fkey"
  FOREIGN KEY ("changedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Testimonial" (
  "id"           TEXT NOT NULL,
  "bookingId"    TEXT,
  "serviceId"    TEXT,
  "customerName" TEXT NOT NULL,
  "customerMeta" TEXT,
  "rating"       INTEGER NOT NULL DEFAULT 5,
  "content"      TEXT NOT NULL,
  "isPublished"  BOOLEAN NOT NULL DEFAULT false,
  "isFeatured"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Testimonial_bookingId_key" ON "Testimonial"("bookingId");
CREATE INDEX "Testimonial_isPublished_isFeatured_idx"
  ON "Testimonial"("isPublished", "isFeatured");
CREATE INDEX "Testimonial_serviceId_idx" ON "Testimonial"("serviceId");

ALTER TABLE "Testimonial"
  ADD CONSTRAINT "Testimonial_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Testimonial"
  ADD CONSTRAINT "Testimonial_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────── Operations ───────────────────────────

CREATE TABLE "InventoryItem" (
  "id"          TEXT NOT NULL,
  "sku"         TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "category"    TEXT NOT NULL,
  "unit"        TEXT NOT NULL,
  "quantity"    INTEGER NOT NULL DEFAULT 0,
  "minQuantity" INTEGER NOT NULL DEFAULT 0,
  "costPrice"   DECIMAL(12,2) NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");
CREATE INDEX "InventoryItem_category_idx" ON "InventoryItem"("category");
CREATE INDEX "InventoryItem_quantity_idx" ON "InventoryItem"("quantity");

CREATE TABLE "StockMovement" (
  "id"          TEXT NOT NULL,
  "itemId"      TEXT NOT NULL,
  "type"        "StockMovementType" NOT NULL,
  "quantity"    INTEGER NOT NULL,
  "note"        TEXT,
  "bookingId"   TEXT,
  "createdById" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StockMovement_itemId_createdAt_idx"
  ON "StockMovement"("itemId", "createdAt");
CREATE INDEX "StockMovement_bookingId_idx" ON "StockMovement"("bookingId");

ALTER TABLE "StockMovement"
  ADD CONSTRAINT "StockMovement_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockMovement"
  ADD CONSTRAINT "StockMovement_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StockMovement"
  ADD CONSTRAINT "StockMovement_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Setting" (
  "key"       TEXT NOT NULL,
  "value"     JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "AuditLog" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT,
  "action"    TEXT NOT NULL,
  "entity"    TEXT NOT NULL,
  "entityId"  TEXT,
  "meta"      JSONB,
  "ip"        TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
