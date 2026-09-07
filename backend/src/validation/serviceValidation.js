import { z } from "zod";

export const SERVICE_CATEGORY_NAMES = [
  "Healthcare",
  "Food & nutrition",
  "Shelter",
  "Education",
  "Women & child support",
  "Livelihood",
  "Disaster relief",
  "Legal aid",
  "Elder care",
  "Other",
];

const categoryByLowercaseName = new Map(
  SERVICE_CATEGORY_NAMES.map((name) => [name.toLowerCase(), name]),
);

const serviceCategorySchema = z
  .string()
  .trim()
  .min(1, "Service category is required")
  .max(100, "Service category is too long")
  .transform((value) => value.replace(/\s+/g, " "))
  .refine(
    (value) => categoryByLowercaseName.has(value.toLowerCase()),
    "Select a valid service category",
  )
  .transform((value) => categoryByLowercaseName.get(value.toLowerCase()));

const nullableText = (maxLength, message) => z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().max(maxLength, message).nullable().optional(),
);

const nullableCapacity = z.preprocess(
  (value) => {
    if (value === null) return null;
    if (typeof value !== "string") return value;

    const trimmed = value.trim();
    if (trimmed === "") return null;
    return /^-?\d+$/.test(trimmed) ? Number(trimmed) : value;
  },
  z
    .number("Capacity must be a whole number")
    .int("Capacity must be a whole number")
    .min(0, "Capacity cannot be negative")
    .max(10_000_000, "Capacity is too large")
    .nullable()
    .optional(),
);

const serviceFields = {
  name: z
    .string()
    .trim()
    .min(2, "Service name is required")
    .max(140, "Service name cannot exceed 140 characters"),
  category: serviceCategorySchema,
  description: z
    .string()
    .trim()
    .min(2, "Service description is required")
    .max(1000, "Service description cannot exceed 1000 characters"),
  capacity: nullableCapacity,
  capacityUnit: nullableText(80, "Capacity unit cannot exceed 80 characters"),
  deliveryMode: z
    .enum(["at_centre", "doorstep", "online", "mobile_camp"])
    .optional(),
  availability: nullableText(200, "Availability cannot exceed 200 characters"),
  serviceArea: nullableText(300, "Service area cannot exceed 300 characters"),
  contactPhone: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z
      .string()
      .trim()
      .regex(/^[0-9+()\-\s]{7,20}$/, "Enter a valid public contact number")
      .refine(
        (value) => (value.match(/\d/g) || []).length >= 7,
        "Public contact number must contain at least 7 digits",
      )
      .nullable()
      .optional(),
  ),
  eligibility: nullableText(2000, "Eligibility cannot exceed 2000 characters"),
  requiredDocuments: nullableText(
    1000,
    "Required documents cannot exceed 1000 characters",
  ),
  isActive: z.boolean().optional(),
};

export const createServiceSchema = z
  .object(serviceFields)
  .strict()
  .transform((service) => ({ ...service, isActive: service.isActive ?? true }));

export const updateServiceSchema = z
  .object(serviceFields)
  .partial()
  .strict()
  .refine((updates) => Object.keys(updates).length > 0, {
    message: "Provide at least one service field to update",
  });
