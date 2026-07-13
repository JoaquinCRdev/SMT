import { z } from "zod";

export const machineSchema = z.object({
  name: z.string(),
  brand: z.string(),
  model: z.string(),
  serialNumber: z.string(),
  description: z.string(),
  status: z.string(),
  userId: z.string().optional(),
});
