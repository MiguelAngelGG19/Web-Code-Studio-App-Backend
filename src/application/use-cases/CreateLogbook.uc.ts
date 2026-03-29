import { SequelizeLogbookRepository } from "../../infrastructure/persistence/repositories/SequelizeLogbookRepository";

export class CreateLogbookUseCase {
  constructor(private repo: SequelizeLogbookRepository) {}

  async execute(data: {
    id_appointment: number;
    notes: string;
    pain_level?: number;
  }): Promise<any> {
    if (!data.id_appointment || !data.notes) {
      throw new Error("id_appointment y notes son requeridos.");
    }
    return this.repo.create(data);
  }
}
