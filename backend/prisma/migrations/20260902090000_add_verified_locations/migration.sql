ALTER TABLE "organizations"
ADD COLUMN "postOffice" TEXT,
ADD COLUMN "locationVerifiedAt" TIMESTAMP(3);

ALTER TABLE "org_tasks"
ADD COLUMN "postOffice" TEXT,
ADD COLUMN "complaintCategory" TEXT,
ADD COLUMN "routedDepartment" TEXT,
ADD COLUMN "locationVerifiedAt" TIMESTAMP(3);
