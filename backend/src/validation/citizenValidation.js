import { z } from "zod";

export const COMPLAINT_CATEGORIES = [
  "sanitation",
  "roads",
  "water",
  "electricity",
  "healthcare",
  "food",
  "shelter",
  "disaster",
  "safety",
  "other",
];

const requiredText = (label, maxLength) => z
  .string(`${label} is required`)
  .trim()
  .min(2, `${label} is required`)
  .max(maxLength, `${label} cannot exceed ${maxLength} characters`);

export const createComplaintSchema = z.object({
  title: requiredText("Complaint title", 140),
  category: z.enum(COMPLAINT_CATEGORIES, { message: "Select a valid complaint category" }),
  description: requiredText("Complaint details", 3000),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  address: requiredText("Complaint address", 500),
  city: requiredText("City or town", 120),
  district: requiredText("District", 120),
  state: requiredText("State or UT", 120),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  postOffice: requiredText("Post office", 160),
  lat: z.coerce.number().min(6, "Select a location within India").max(38, "Select a location within India"),
  lng: z.coerce.number().min(68, "Select a location within India").max(98, "Select a location within India"),
}).strict();
