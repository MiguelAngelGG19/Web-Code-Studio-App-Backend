export type CreateExerciseDTO = {
  name: string;
  bodyZone: string;
  description: string;
  /** Ruta bajo /uploads/exercises/... o ausente (NULL en BD) */
  videoUrl?: string | null;
};