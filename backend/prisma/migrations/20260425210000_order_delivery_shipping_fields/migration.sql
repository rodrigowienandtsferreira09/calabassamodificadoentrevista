-- Estrutura de entrega e frete no pedido (checkout + visão admin).
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
  ADD COLUMN IF NOT EXISTS "shippingEstimatedDays" INTEGER;
