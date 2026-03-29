import { SequelizeAppointmentRepository } from "../../infrastructure/persistence/repositories/SequelizeAppointmentRepository";

export class GetAppointmentsByPatientUseCase {
  constructor(private repo: SequelizeAppointmentRepository) {}

  async execute(id_patient: number): Promise<any[]> {
    return this.repo.findByPatient(id_patient);
  }
}
