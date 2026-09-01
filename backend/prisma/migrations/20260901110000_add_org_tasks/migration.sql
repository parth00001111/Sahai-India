CREATE TYPE "OrgTaskStatus" AS ENUM ('assigned', 'in_progress', 'completed');
CREATE TYPE "OrgTaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE "org_tasks" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "complaintReference" TEXT,
    "area" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "priority" "OrgTaskPriority" NOT NULL DEFAULT 'medium',
    "status" "OrgTaskStatus" NOT NULL DEFAULT 'assigned',
    "beforeImageUrl" TEXT,
    "afterImageUrl" TEXT,
    "completionNote" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "org_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "org_tasks_orgId_status_idx" ON "org_tasks"("orgId", "status");
CREATE INDEX "org_tasks_assignedToId_status_idx" ON "org_tasks"("assignedToId", "status");

ALTER TABLE "org_tasks" ADD CONSTRAINT "org_tasks_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "org_tasks" ADD CONSTRAINT "org_tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "org_tasks" ADD CONSTRAINT "org_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
