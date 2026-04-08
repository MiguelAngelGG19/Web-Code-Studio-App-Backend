import { RoutineRepository } from "../ports/out/RoutineRepository";

export class GetRoutineTemplateByIdUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  async execute(templateId: number) {
    if (!templateId || templateId <= 0) {
      throw new Error("ID de plantilla inválido.");
    }

    const template = await this.routineRepository.findTemplateById(templateId);
    if (!template) {
      throw new Error("Plantilla no encontrada.");
    }

    return template;
  }
}
