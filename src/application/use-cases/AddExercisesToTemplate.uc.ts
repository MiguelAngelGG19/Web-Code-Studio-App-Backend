import { RoutineRepository } from "../ports/out/RoutineRepository";
import { RoutineExerciseItemDTO } from "../dtos/routine.dto";

export class AddExercisesToTemplateUseCase {
  constructor(private readonly routineRepo: RoutineRepository) {}

  async execute(templateId: number, exerciseIds: number[], exerciseItems?: RoutineExerciseItemDTO[], name?: string, tag?: string): Promise<any> {
    const hasIds = Array.isArray(exerciseIds) && exerciseIds.length > 0;
    const hasItems = Array.isArray(exerciseItems) && exerciseItems.length > 0;

    if (!hasIds && !hasItems) {
      throw new Error("Debes proporcionar al menos un ejercicio para la plantilla.");
    }

    const ids = hasIds
      ? exerciseIds
      : (exerciseItems || []).map(item => item.exerciseId);

    return this.routineRepo.addExercisesToTemplate(templateId, ids, exerciseItems, name, tag);
  }
}