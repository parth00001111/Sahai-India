ALTER TABLE "reports"
ADD COLUMN "reference" TEXT,
ADD COLUMN "title" TEXT,
ADD COLUMN "category" TEXT,
ADD COLUMN "routedDepartment" TEXT,
ADD COLUMN "jurisdiction" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "district" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "pincode" TEXT,
ADD COLUMN "postOffice" TEXT,
ADD COLUMN "locationVerifiedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "reports" ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE UNIQUE INDEX "reports_reference_key" ON "reports"("reference");
CREATE INDEX "reports_userId_createdAt_idx" ON "reports"("userId", "createdAt");
CREATE INDEX "reports_status_category_idx" ON "reports"("status", "category");
