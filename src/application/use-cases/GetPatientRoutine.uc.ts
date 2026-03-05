import { RoutineRepository } from "../ports/out/RoutineRepository";

export class GetPatientRoutineUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  async execute(patientId: number) {
    const routine = await this.routineRepository.findActiveByPatientId(patientId);
    
    if (!routine) {
      throw new Error(`No se encontró una rutina activa para el paciente con ID ${patientId}`);
    }

    return routine;
  }
}