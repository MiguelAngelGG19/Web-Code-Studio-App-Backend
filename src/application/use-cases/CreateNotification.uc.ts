import { SequelizeNotificationRepository } from "../../infrastructure/persistence/repositories/SequelizeNotificationRepository";

export class CreateNotificationUseCase {
  constructor(private repo: SequelizeNotificationRepository) {}

  async execute(data: {
    id_patient: number;
    message: string;
    type?: string;
    id_physio?: number;
  }): Promise<any> {
    if (!data.id_patient || !data.message) {
      throw new Error("id_patient y message son requeridos.");
    }
    const payload: any = {
      id_patient: data.id_patient,
      message: data.message,
      type: data.type ?? "mensaje",
    };
    if (data.id_physio != null) {
      payload.id_physio = data.id_physio;
    }
    return this.repo.create(payload);
  }
}
