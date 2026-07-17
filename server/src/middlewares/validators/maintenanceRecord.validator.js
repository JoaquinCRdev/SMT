import { z } from "zod";

export const createRecordSchema = z.object({
  machineId: z.string().optional(),
  planId: z.string().optional(),
  title: z.string().min(5).max(100),
  description: z.string().max(1000).optional(),
  performedAt: z.string(),
  duration: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  partsUsed: z.string().max(500).optional(),
  technician: z.string().max(100).optional(),
  results: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});
