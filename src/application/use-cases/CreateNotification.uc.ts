import { SequelizeNotificationRepository } from "../../infrastructure/persistence/repositories/SequelizeNotificationRepository";

export class CreateNotificationUseCase {
  constructor(private repo: SequelizeNotificationRepository) {}

  async execute(data: {
    id_patient: number;
    message: string;
    type?: string;
  }): Promise<any> {
    if (!data.id_patient || !data.message) {
      throw new Error("id_patient y message son requeridos.");
    }
    return this.repo.create(data);
  }
}
