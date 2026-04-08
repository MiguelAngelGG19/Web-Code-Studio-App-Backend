import { RoutineRepository } from "../ports/out/RoutineRepository";
import { RoutineExerciseItemDTO } from "../dtos/routine.dto";

export type CreateRoutineTemplateDirectDTO = {
  name: string;
  tag?: string;
  physiotherapistId: number;
  exerciseIds?: number[];
  exerciseItems?: RoutineExerciseItemDTO[];
};

export class CreateRoutineTemplateDirectUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  async execute(data: CreateRoutineTemplateDirectDTO) {
    if (!data.name || data.name.trim().length < 3) {
      throw new Error("El nombre de la plantilla es obligatorio (min 3 caracteres).");
    }

    if (!data.physiotherapistId || data.physiotherapistId <= 0) {
      throw new Error("physiotherapistId es obligatorio.");
    }

    return this.routineRepository.createTemplateDirect(data);
  }
}
