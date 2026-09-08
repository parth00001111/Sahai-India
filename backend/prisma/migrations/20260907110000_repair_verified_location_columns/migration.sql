-- Repair schema drift where the original verified-location migration is
-- recorded as applied but these columns are absent from the live database.
ALTER TABLE "organizations"
ADD COLUMN IF NOT EXISTS "postOffice" TEXT,
ADD COLUMN IF NOT EXISTS "locationVerifiedAt" TIMESTAMP(3);

ALTER TABLE "org_tasks"
ADD COLUMN IF NOT EXISTS "postOffice" TEXT,
ADD COLUMN IF NOT EXISTS "complaintCategory" TEXT,
ADD COLUMN IF NOT EXISTS "routedDepartment" TEXT,
ADD COLUMN IF NOT EXISTS "locationVerifiedAt" TIMESTAMP(3);
