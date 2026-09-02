import { z } from "zod";

export const addImageSchema = z.object({
  imageUrl: z.string().min(1),
  altText: z.string().max(100).optional(),
  sortOrder: z.number().nonnegative().optional(),
});

export const updateImageSchema = z.object({
  imageUrl: z.string().min(1).optional(),
  altText: z.string().max(100).optional(),
  sortOrder: z.number().nonnegative().optional(),
});

export const reorderImageSchema = z.object({
  sortOrder: z.number().nonnegative(),
});
