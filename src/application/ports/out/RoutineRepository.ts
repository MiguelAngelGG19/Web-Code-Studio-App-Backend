import { CreateRoutineDTO } from "../../dtos/routine.dto";

export interface RoutineRepository {
  // Guardará la rutina y también sus ejercicios en la tabla intermedia
  createWithExercises(data: CreateRoutineDTO): Promise<any>;
  // NUEVO: Buscar rutina activa de un paciente con sus ejercicios
  findActiveByPatientId(patientId: number): Promise<any | null>;
  // NUEVO: Buscar rutina por su propio ID
  findById(id: number): Promise<any | null>;
}