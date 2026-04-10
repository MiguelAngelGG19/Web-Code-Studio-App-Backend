import { RoutineRepository } from "../ports/out/RoutineRepository";
import { RoutineExerciseItemDTO } from "../dtos/routine.dto";
import { AddExercisesOptions } from "../ports/out/RoutineRepository";

/**
 * Caso de uso: Añade ejercicios a una rutina ya existente.
 * Endpoint destino: PUT /api/routines/:id
 */
export class AddExercisesToRoutineUseCase {
  constructor(private readonly routineRepo: RoutineRepository) {}

  async execute(routineId: number, exerciseIds: number[], exerciseItems?: RoutineExerciseItemDTO[], options?: AddExercisesOptions): Promise<any> {
    const hasIds = Array.isArray(exerciseIds) && exerciseIds.length > 0;
    const hasItems = Array.isArray(exerciseItems) && exerciseItems.length > 0;

    if (!hasIds && !hasItems) {
      throw new Error("Debes proporcionar al menos un ID de ejercicio.");
    }

    const ids = hasIds
      ? exerciseIds
      : (exerciseItems || []).map(item => item.exerciseId);

    return this.routineRepo.addExercises(routineId, ids, exerciseItems, options);
  }
}
