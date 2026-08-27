import { z } from "zod";

const orgTypeEnum = z.enum(["ngo", "govt", "hospital", "shelter", "foodbank"]);

const orgLegalStructureEnum = z.enum([
  "ngo_trust",
  "section8",
  "society",
  "govt_body",
  "social_enterprise",
  "other",
]);

const focusAreaEnum = z.enum([
  "Education",
  "Healthcare",
  "Women & child welfare",
  "Livelihoods",
  "Disaster relief",
  "Elder care",
  "Environment",
  "Legal aid",
]);

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name is required"),
  type: orgTypeEnum,
  legalStructure: orgLegalStructureEnum,

  registrationNumber: z.string().trim().min(3, "Registration number is required"),
  yearEstablished: z.coerce
    .number()
    .int()
    .min(1800, "Enter a valid year")
    .max(new Date().getFullYear(), "Year cannot be in the future"),
  website: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  description: z.string().trim().max(700, "Description too long").optional(),

  contactName: z.string().trim().min(2, "Contact person name is required"),
  designation: z.string().trim().min(2, "Designation is required"),
  email: z.string().trim().email("Enter a valid email address"),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number")
    .optional(),

  address: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required"),
  district: z.string().trim().min(2, "District is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "Enter a valid 6-digit PIN code"),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),

  serviceAreas: z.string().trim().min(1, "Service areas are required"),
  beneficiariesCount: z.coerce.number().int().nonnegative().optional(),
  focusAreas: z.array(focusAreaEnum).min(1, "Select at least one focus area"),

  registrationCertUrl: z.string().trim().url("Invalid file URL"),
  panDocUrl: z.string().trim().url("Invalid file URL"),
  addressProofUrl: z.string().trim().url("Invalid file URL").optional(),
  authLetterUrl: z.string().trim().url("Invalid file URL").optional(),
  logoUrl: z.string().trim().url("Invalid file URL").optional(),
});

export const verifyOrganizationSchema = z.object({
  verificationStatus: z.enum(["pending", "verified", "rejected"]),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();