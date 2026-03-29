import { SequelizeAppointmentRepository } from "../../infrastructure/persistence/repositories/SequelizeAppointmentRepository";

export class UpdateAppointmentUseCase {
  constructor(private repo: SequelizeAppointmentRepository) {}

  async execute(id: number, data: Partial<{ scheduled_at: string; notes: string; status: string }>): Promise<any> {
    const updated = await this.repo.update(id, data);
    if (!updated) throw new Error("Cita no encontrada.");
    return updated;
  }
}
