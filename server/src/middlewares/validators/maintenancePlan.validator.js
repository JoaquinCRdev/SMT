import { z } from "zod";

const taskItemSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedTo: z.string().optional(),
});

export const createPlanSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(500).optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly", "custom"]),
  customDays: z.number().int().positive().optional(),
  tasks: z.array(taskItemSchema).optional(),
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
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const markPerformedSchema = z.object({
  performedAt: z.string().optional(),
  notes: z.string().max(500).optional(),
});
