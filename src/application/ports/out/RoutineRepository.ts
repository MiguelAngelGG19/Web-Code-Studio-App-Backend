import { CreateRoutineDTO, CreateRoutineTemplateDTO } from "../../dtos/routine.dto";

export interface RoutineRepository {
  // Guardará la rutina y también sus ejercicios en la tabla intermedia
  createWithExercises(data: CreateRoutineDTO): Promise<any>;
  // NUEVO: Buscar rutina activa de un paciente con sus ejercicios
  findActiveByPatientId(patientId: number): Promise<any | null>;
  // NUEVO: Buscar rutina por su propio ID
  findById(id: number): Promise<any | null>;
  // NUEVO: Buscar el historial completo de rutinas de un paciente
  findAllByPatientId(patientId: number): Promise<any[]>;
  // Añade ejercicios a una rutina existente (sin duplicar)
  addExercises(routineId: number, exerciseIds: number[]): Promise<any>;

  // Plantillas: guardar rutina existente como plantilla reusable
  createTemplateFromRoutine(data: CreateRoutineTemplateDTO): Promise<any>;

  // Plantillas: listado por fisioterapeuta (opcionalmente filtrado por etiqueta)
  findTemplatesByPhysio(physiotherapistId: number, tag?: string): Promise<any[]>;

  // Plantillas: detalle por ID
  findTemplateById(templateId: number): Promise<any | null>;
} 