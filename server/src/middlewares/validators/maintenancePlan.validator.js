import { z } from "zod";

const userId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user id");

const taskItemSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedTo: userId.optional(),
});

export const createPlanSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(500).optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly", "custom"]),
  customDays: z.number().int().positive().optional(),
  tasks: z.array(taskItemSchema).optional(),
  assignedTo: z.array(userId).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const updatePlanSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().max(500).optional(),
  frequency: z
    .enum(["daily", "weekly", "monthly", "yearly", "custom"])
    .optional(),
  customDays: z.number().int().positive().optional(),
  tasks: z.array(taskItemSchema).optional(),
  assignedTo: z.array(userId).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const markPerformedSchema = z.object({
  performedAt: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// Endpoint dedicado para pausar/reanudar: usar el PUT general risked que el
// cliente mandara `tasks` y le creara tareas nuevas al solo querer pausar.
export const changePlanStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});
