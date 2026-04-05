// Ruta: src/application/use-cases/GetAppointmentsByPhysio.uc.ts
import { AppointmentRepository } from "../ports/out/AppointmentRepository"; // Ajustar ruta si es necesario

export class GetAppointmentsByPhysioUseCase {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(idPhysio: number) {
    return await this.appointmentRepository.findByPhysio(idPhysio);
  }
}