import { RoutineRepository } from "../ports/out/RoutineRepository";

export class ListRoutineTemplatesUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  async execute(physiotherapistId: number, tag?: string) {
    if (!physiotherapistId || physiotherapistId <= 0) {
      throw new Error("ID de fisioterapeuta inválido para listar plantillas.");
    }

    return this.routineRepository.findTemplatesByPhysio(physiotherapistId, tag);
  }
}
