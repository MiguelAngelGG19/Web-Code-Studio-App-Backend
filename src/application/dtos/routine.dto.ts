export type CreateRoutineDTO = {
  name: string;
  startDate: string; // Formato YYYY-MM-DD
  endDate: string;   // Formato YYYY-MM-DD
  physiotherapistId: number;
  patientId: number;
  exerciseIds: number[]; // Arreglo con los IDs de los ejercicios seleccionados
};

export type CreateRoutineTemplateDTO = {
  routineId: number;
  physiotherapistId: number;
  name?: string;
  tag?: string;
};
