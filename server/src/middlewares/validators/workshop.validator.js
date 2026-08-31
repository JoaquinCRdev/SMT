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
