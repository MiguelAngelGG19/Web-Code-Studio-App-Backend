import { CreateRoutineTemplateDTO } from "../dtos/routine.dto";
import { RoutineRepository } from "../ports/out/RoutineRepository";

export class CreateRoutineTemplateUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  async execute(data: CreateRoutineTemplateDTO) {
    if (!data.routineId || data.routineId <= 0) {
      throw new Error("ID de rutina inválido para crear plantilla.");
    }

    if (!data.physiotherapistId || data.physiotherapistId <= 0) {
      throw new Error("ID de fisioterapeuta inválido para crear plantilla.");
    }

    return this.routineRepository.createTemplateFromRoutine(data);
  }
}
