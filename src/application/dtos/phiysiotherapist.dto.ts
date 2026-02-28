import { z } from "zod";

export const createPhysioSchema = z.object({
  firstName: z.string().min(1),
  lastNameP: z.string().min(1),
  lastNameM: z.string().optional().nullable(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
  professionalLicense: z.string().optional().nullable(),
  curp: z.string().optional().nullable(),
});
export type CreatePhysioDTO = z.infer<typeof createPhysioSchema>;