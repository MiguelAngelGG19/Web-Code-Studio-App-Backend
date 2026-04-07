export type RoutineExerciseItemDTO = {
  exerciseId: number;
  repetitions?: number;
  sets?: number;
  exerciseOrder?: number;
  notes?: string;
};

export type CreateRoutineDTO = {
  name: string;
  startDate: string; // Formato YYYY-MM-DD
  endDate: string;   // Formato YYYY-MM-DD
  physiotherapistId: number;
  patientId: number;
  exerciseIds?: number[]; // Compatibilidad hacia atrás
  exerciseItems?: RoutineExerciseItemDTO[]; // Nuevo: payload detallado por ejercicio
};

export type CreateRoutineTemplateDTO = {
  routineId: number;
  physiotherapistId: number;
  name?: string;
  tag?: string;
};
