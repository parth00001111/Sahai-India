-- CreateEnum
CREATE TYPE "OrgInviteStatus" AS ENUM ('pending', 'accepted', 'revoked');

-- CreateTable
CREATE TABLE "org_invitations" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'staff',
    "token" TEXT NOT NULL,
    "status" "OrgInviteStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_invitations_token_key" ON "org_invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "org_invitations_orgId_email_key" ON "org_invitations"("orgId", "email");

-- AddForeignKey
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
