-- CreateEnum
CREATE TYPE "ServiceDeliveryMode" AS ENUM ('at_centre', 'doorstep', 'online', 'mobile_camp');

-- AlterTable
-- The temporary default on updatedAt backfills existing services safely. Prisma
-- supplies this value on subsequent writes, so the database default is removed.
ALTER TABLE "services"
ADD COLUMN "capacityUnit" TEXT,
ADD COLUMN "deliveryMode" "ServiceDeliveryMode" NOT NULL DEFAULT 'at_centre',
ADD COLUMN "availability" TEXT,
ADD COLUMN "serviceArea" TEXT,
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "eligibility" TEXT,
ADD COLUMN "requiredDocuments" TEXT,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "services" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "services_orgId_isActive_idx" ON "services"("orgId", "isActive");

-- CreateIndex
CREATE INDEX "services_categoryId_isActive_idx" ON "services"("categoryId", "isActive");

-- Enforce the application's one-organisation-per-user membership invariant.
-- This intentionally fails without deleting data if historical duplicate userId
-- memberships exist; audit and resolve those records before retrying deployment.
CREATE UNIQUE INDEX "org_members_userId_key" ON "org_members"("userId");
