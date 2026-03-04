import { PatientRepository } from "../ports/out/PatientRepository";
import { UpdatePatientDTO } from "../dtos/patient.dto";
import { Patient } from "../../domain/entities/Patient";

export class UpdatePatient {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(id: number, data: UpdatePatientDTO): Promise<Patient | null> {
    // Aquí podríamos agregar lógica de negocio extra si fuera necesario.
    // Por ahora, simplemente delegamos al repositorio.
    return await this.patientRepository.update(id, data);
  }
}
