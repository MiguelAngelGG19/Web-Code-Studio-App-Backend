import { RoutineRepository } from "../ports/out/RoutineRepository";

export class GetPatientRoutineHistoryUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  async execute(patientId: number) {
    const history = await this.routineRepository.findAllByPatientId(patientId);
    return history; // Si no hay rutinas, devolverá un arreglo vacío [], lo cual es correcto para un historial.
  }
}