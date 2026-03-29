import { SequelizeAppointmentRepository } from "../../infrastructure/persistence/repositories/SequelizeAppointmentRepository";

export class CreateAppointmentUseCase {
  constructor(private repo: SequelizeAppointmentRepository) {}

  async execute(data: {
    id_patient: number;
    id_physio: number;
    scheduled_at: string;
    notes?: string;
  }): Promise<any> {
    if (!data.id_patient || !data.id_physio || !data.scheduled_at) {
      throw new Error("id_patient, id_physio y scheduled_at son requeridos.");
    }
    return this.repo.create(data);
  }
}
