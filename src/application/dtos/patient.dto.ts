import { z } from "zod";

export const createPatientSchema = z.object({
  firstName: z.string().min(1),
  lastNameP: z.string().min(1),
  lastNameM: z.string().optional().nullable(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
  sex: z.string().optional().nullable(),
  height: z.number().optional().nullable(),
  weight: z.number().optional().nullable(),
  physiotherapistId: z.number().int().positive(),
});
export type CreatePatientDTO = z.infer<typeof createPatientSchema>;