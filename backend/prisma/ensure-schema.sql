-- Idempotente: usado quando `migrate deploy` não roda (ex.: P3005 / banco já existente).
-- Mantém o schema alinhado ao Prisma sem depender da tabela _prisma_migrations.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "documentHash" TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_documentHash_key') THEN
    CREATE UNIQUE INDEX "User_documentHash_key" ON "User" ("documentHash");
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_document_key') THEN
    DROP INDEX "User_document_key";
  END IF;
END $$;

ALTER TABLE "ApparelProduct" ADD COLUMN IF NOT EXISTS "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "CoverageProduct" ADD COLUMN IF NOT EXISTS "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

DO $$
BEGIN
  CREATE TYPE "DeliveryMethod" AS ENUM ('DELIVERY', 'PICKUP');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'DELIVERY',
  ADD COLUMN IF NOT EXISTS "recipientName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "recipientPhone" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "recipientDocument" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryZipCode" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryStreet" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryComplement" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryNeighborhood" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryCity" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryState" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingService" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "shippingEstimatedDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "mercadoPagoPreferenceId" TEXT,
  ADD COLUMN IF NOT EXISTS "mercadoPagoPaymentId" TEXT,
  ADD COLUMN IF NOT EXISTS "discountCodeId" TEXT,
  ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(10,2);

DO $$
BEGIN
  CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "DiscountCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "type" "DiscountType" NOT NULL,
  "value" DECIMAL(10,2) NOT NULL,
  "minOrderAmount" DECIMAL(10,2),
  "maxUses" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "includeFreight" BOOLEAN NOT NULL DEFAULT FALSE,
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DiscountCode_code_key" ON "DiscountCode" ("code");

ALTER TABLE "DiscountCode"
  ADD COLUMN IF NOT EXISTS "includeFreight" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS "DiscountUsage" (
  "id" TEXT NOT NULL,
  "discountCodeId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiscountUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DiscountUsage_discountCodeId_userId_key"
  ON "DiscountUsage" ("discountCodeId", "userId");
CREATE INDEX IF NOT EXISTS "DiscountUsage_orderId_idx" ON "DiscountUsage" ("orderId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Order_discountCodeId_fkey'
  ) THEN
    ALTER TABLE "Order"
      ADD CONSTRAINT "Order_discountCodeId_fkey"
      FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DiscountUsage_discountCodeId_fkey'
  ) THEN
    ALTER TABLE "DiscountUsage"
      ADD CONSTRAINT "DiscountUsage_discountCodeId_fkey"
      FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DiscountUsage_orderId_fkey'
  ) THEN
    ALTER TABLE "DiscountUsage"
      ADD CONSTRAINT "DiscountUsage_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
