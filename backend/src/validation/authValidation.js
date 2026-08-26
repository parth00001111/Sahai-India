import { z } from "zod";

export const signupSchema = z
  .object({
    
    email: z
    .string()
    .email("Invalid email"),
    
    password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
    phone: z
      .string()
      .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
      .optional(),
    
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

export const signinSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email"),

    

    password: z
      .string()
      .min(1, "Password is required"),
  })
  