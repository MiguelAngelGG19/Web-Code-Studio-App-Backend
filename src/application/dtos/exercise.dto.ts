import { z } from "zod";

export const createExerciseSchema = z.object({
  name: z.string().min(1),
  bodyZone: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
});
export type CreateExerciseDTO = z.infer<typeof createExerciseSchema>;