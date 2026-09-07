import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["pending", "in_progress", "done"]).optional(),
  assignedTo: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().max(500).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["pending", "in_progress", "done"]).optional(),
  assignedTo: z.string().optional(),
});

export const changeTaskStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "done"]),
});

export const assignTaskSchema = z.object({
  assignedTo: z.string(),
});
