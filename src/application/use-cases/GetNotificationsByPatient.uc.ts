import { SequelizeNotificationRepository } from "../../infrastructure/persistence/repositories/SequelizeNotificationRepository";

export class GetNotificationsByPatientUseCase {
  constructor(private repo: SequelizeNotificationRepository) {}

  async execute(id_patient: number): Promise<any[]> {
    return this.repo.findByPatient(id_patient);
  }
}
