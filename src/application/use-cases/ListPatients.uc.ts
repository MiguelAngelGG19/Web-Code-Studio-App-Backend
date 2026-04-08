import { PatientRepository } from "../ports/out/PatientRepository";

export class ListPatientsUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  // 🪄 Agregamos id_physio a los parámetros esperados
  async execute(params: { limit: number; offset: number; id_physio: number }) {
    
    // Le pasamos el paquete completo al repositorio (que ahora incluye el candado de seguridad)
    return await this.patientRepository.findAll(params);
  }
}