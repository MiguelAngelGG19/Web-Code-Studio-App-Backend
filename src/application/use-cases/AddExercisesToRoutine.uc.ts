import { RoutineRepository } from "../ports/out/RoutineRepository";

/**
 * Caso de uso: Añade ejercicios a una rutina ya existente.
 * Endpoint destino: PUT /api/routines/:id
 */
export class AddExercisesToRoutineUseCase {
  constructor(private readonly routineRepo: RoutineRepository) {}

  async execute(routineId: number, exerciseIds: number[]): Promise<any> {
    if (!exerciseIds || exerciseIds.length === 0) {
      throw new Error("Debes proporcionar al menos un ID de ejercicio.");
    }
    return this.routineRepo.addExercises(routineId, exerciseIds);
  }
}
