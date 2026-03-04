import { PatientRepository } from "../ports/out/PatientRepository";
import { Patient } from "../../domain/entities/Patient";

export class GetPatientByIdUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(id: number): Promise<Patient | null> {
    return await this.patientRepository.findById(id);
  }
}
