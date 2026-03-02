import { PatientRepository } from "../ports/out/PatientRepository";

export class ListPatientsUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(params: { limit: number; offset: number }) {
    // Le pedimos al repositorio que nos traiga la lista de pacientes con paginación
    return await this.patientRepository.findAll(params.limit, params.offset);
  }
}