-- Add the practical access information citizens need before requesting a service.
-- Columns remain nullable so existing catalogue entries continue to load; the API
-- requires these values for every newly created service.
ALTER TABLE "services"
ADD COLUMN "applicationProcess" TEXT,
ADD COLUMN "feeDetails" TEXT;
