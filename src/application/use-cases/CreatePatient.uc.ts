import { PatientRepository } from "../ports/out/PatientRepository";
import { CreatePatientDTO } from "../dtos/patient.dto";

export class CreatePatientUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(data: CreatePatientDTO) {
    return await this.patientRepository.create(data);
  }
}
