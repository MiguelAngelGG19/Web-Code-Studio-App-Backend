import { PatientRepository } from "../ports/out/PatientRepository";

export class CreatePatientUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(data: any) {
    // Simplemente le pasa el paquete completo (UserData + PatientData) al repositorio
    return await this.patientRepository.create(data);
  }
}