/*
  Warnings:

  - Added the required column `city` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactName` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `designation` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `legalStructure` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pincode` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registrationNumber` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yearEstablished` to the `organizations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrgLegalStructure" AS ENUM ('ngo_trust', 'section8', 'society', 'govt_body', 'social_enterprise', 'other');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "addressProofUrl" TEXT,
ADD COLUMN     "authLetterUrl" TEXT,
ADD COLUMN     "beneficiariesCount" INTEGER,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "contactName" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "designation" TEXT NOT NULL,
ADD COLUMN     "district" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "focusAreas" TEXT[],
ADD COLUMN     "legalStructure" "OrgLegalStructure" NOT NULL,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "panDocUrl" TEXT,
ADD COLUMN     "pincode" TEXT NOT NULL,
ADD COLUMN     "registrationCertUrl" TEXT,
ADD COLUMN     "registrationNumber" TEXT NOT NULL,
ADD COLUMN     "serviceAreas" TEXT,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "yearEstablished" INTEGER NOT NULL;
