import { z } from "zod";

export const signupValidation = z
  .object({
    phone: z
      .string()
      .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
      .optional(),

    email: z
      .string()
      .email("Invalid email"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),

    userType: z
      .enum(["citizen", "org_staff"])
      .default("citizen"),
  })
  .refine(
    (data) => data.phone,
    {
      message: "Either email or phone is required",
      path: ["email"],
    }
  );

export const signinValidation = z
  .object({
    email: z
      .string()
      .email("Invalid email"),

    phone: z
      .string()
      .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
      .optional(),

    password: z
      .string()
      .min(1, "Password is required"),
  })
  .refine(
    (data) => data.phone,
    {
      message: "Either email or phone is required",
      path: ["email"],
    }
  );