import { z } from "zod";

export const createWorkshopSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  address: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
});

export const updateWorkshopSchema = createWorkshopSchema.partial();

export const joinWorkshopSchema = z.object({
  code: z
    .string()
    .transform((v) => v.trim().toUpperCase())
    .pipe(z.string().regex(/^[A-F0-9]{8}$/, "Invalid code format")),
});

export const requestActionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export const verifyJoinCodeSchema = z.object({
  code: z
    .string()
    .transform((v) => v.trim().toUpperCase())
    .pipe(z.string().regex(/^[A-HJ-NP-Z2-9]{6}$/, "Invalid code format")),
});

export const addMemberSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"]).optional().default("user"),
});

export const updateMemberSchema = z
  .object({
    name: z.string().min(3).max(50).optional(),
    role: z.enum(["user", "admin"]).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
