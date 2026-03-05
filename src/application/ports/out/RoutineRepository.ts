import { CreateRoutineDTO } from "../../dtos/routine.dto";

export interface RoutineRepository {
  // Guardará la rutina y también sus ejercicios en la tabla intermedia
  createWithExercises(data: CreateRoutineDTO): Promise<any>;
}