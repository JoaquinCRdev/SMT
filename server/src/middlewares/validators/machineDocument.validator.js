import { z } from "zod";

export const createDocumentSchema = z.object({
  fileName: z.string().min(5).max(100),
  fileUrl: z.string().min(1),
  storagePath: z.string().min(1),
  fileType: z.enum(["pdf", "docx", "xlsx", "txt", "other"]),
  fileSize: z.number().nonnegative(),
});

export const updateDocumentSchema = z.object({
  fileName: z.string().min(5).max(100).optional(),
  fileUrl: z.string().min(1).optional(),
  storagePath: z.string().min(1).optional(),
  fileType: z.enum(["pdf", "docx", "xlsx", "txt", "other"]).optional(),
  fileSize: z.number().nonnegative().optional(),
});
