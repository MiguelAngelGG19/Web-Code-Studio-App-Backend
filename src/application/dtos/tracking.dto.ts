export type CreateTrackingDTO = {
  startTime?: string;
  endTime?: string;
  painLevel: number; // 1 a 10
  postObservations?: string;
  intraObservations?: string;
  alert?: number; // 0 = Falso, 1 = Verdadero
  routineId: number;
  exerciseId?: number;
};