import { SequelizeLogbookRepository } from "../../infrastructure/persistence/repositories/SequelizeLogbookRepository";

export class GetLogbookByAppointmentUseCase {
  constructor(private repo: SequelizeLogbookRepository) {}

  async execute(id_appointment: number): Promise<any> {
    const entry = await this.repo.findByAppointment(id_appointment);
    if (!entry) throw new Error("Bitácora no encontrada para esta cita.");
    return entry;
  }
}
