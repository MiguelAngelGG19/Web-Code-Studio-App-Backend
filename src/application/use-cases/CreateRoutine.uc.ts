import { RoutineRepository } from "../ports/out/RoutineRepository";
import { CreateRoutineDTO } from "../dtos/routine.dto";

export class CreateRoutineUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  async execute(data: CreateRoutineDTO) {
    // Regla de negocio: La fecha de fin no puede ser menor a la de inicio
    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new Error("La fecha de fin no puede ser anterior a la de inicio.");
    }
    return await this.routineRepository.createWithExercises(data);
  }
}