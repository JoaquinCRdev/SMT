import { z } from "zod";
import { normalizeStatus } from "../../utils/status.js";

export const machineSchema = z.object({
  name: z.string().min(15).max(100),
  tipo: z.enum(["maquina", "otro"]),
  brand: z.string().min(2).max(50),
  model: z.string().min(2).max(50),
  serialNumber: z.string().min(5).max(50),
  description: z.string().max(500).optional(),
  status: z.preprocess(
    (value) => (value === undefined ? value : normalizeStatus(value)),
    z.enum(["active", "inactive", "maintenance"]).optional(),
  ),
});

export const updateMachineSchema = machineSchema.partial();
