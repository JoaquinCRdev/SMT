import { z } from "zod";

export const machineSchema = z.object({
  name: z.string().min(15).max(100),
  tipo: z.enum(["maquina", "otro"]),
  brand: z.string().min(2).max(50),
  model: z.string().min(2).max(50),
  serialNumber: z.string().min(5).max(50),
  description: z.string().max(500).optional(),
  status: z
    .enum(["active", "inactive", "maintenance"])
    .optional(),
});