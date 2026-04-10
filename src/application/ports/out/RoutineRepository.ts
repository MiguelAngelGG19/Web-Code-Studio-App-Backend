import { CreateRoutineDTO, CreateRoutineTemplateDTO, RoutineExerciseItemDTO } from "../../dtos/routine.dto";
import { CreateRoutineTemplateDirectDTO } from "../../use-cases/CreateRoutineTemplateDirect.uc";

export interface AddExercisesOptions {
  replaceExisting?: boolean;
  name?: string;
  startDate?: string;
  endDate?: string;
}

export interface AddTemplateExercisesOptions {
  replaceExisting?: boolean;
}

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
  addExercises(routineId: number, exerciseIds: number[], exerciseItems?: RoutineExerciseItemDTO[], options?: AddExercisesOptions): Promise<any>;

  // Plantillas: guardar rutina existente como plantilla reusable
  createTemplateFromRoutine(data: CreateRoutineTemplateDTO): Promise<any>;

  // Plantillas: crear plantilla directa (sin paciente/rutina origen)
  createTemplateDirect(data: CreateRoutineTemplateDirectDTO): Promise<any>;

  // Plantillas: agregar ejercicios a una plantilla ya existente
  addExercisesToTemplate(templateId: number, exerciseIds: number[], exerciseItems?: RoutineExerciseItemDTO[], name?: string, tag?: string, options?: AddTemplateExercisesOptions): Promise<any>;

  // Plantillas: listado por fisioterapeuta (opcionalmente filtrado por etiqueta)
  findTemplatesByPhysio(physiotherapistId: number, tag?: string): Promise<any[]>;

  // Plantillas: detalle por ID
  findTemplateById(templateId: number): Promise<any | null>;
} 