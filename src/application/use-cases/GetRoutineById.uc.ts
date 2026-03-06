import { RoutineRepository } from "../ports/out/RoutineRepository";

export class GetRoutineByIdUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  async execute(id: number) {
    const routine = await this.routineRepository.findById(id);
    
    if (!routine) {
      throw new Error(`No se encontró ninguna rutina con el ID ${id}`);
    }

    return routine;
  }
}