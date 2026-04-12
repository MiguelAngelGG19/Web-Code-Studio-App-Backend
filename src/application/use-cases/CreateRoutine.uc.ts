import { RoutineRepository } from "../ports/out/RoutineRepository";
import { CreateRoutineDTO } from "../dtos/routine.dto";
import { NotificationModel } from "../../infrastructure/persistence/sequelize/client";

export class CreateRoutineUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  async execute(data: CreateRoutineDTO) {
    // Regla de negocio: La fecha de fin no puede ser menor a la de inicio
    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new Error("La fecha de fin no puede ser anterior a la de inicio.");
    }
    const routine = await this.routineRepository.createWithExercises(data);

    // NUEVO: Disparar notificación de rutina creada
    try {
      await NotificationModel.create({
        type: 'rutina',
        message: `Tu fisioterapeuta te ha asignado la nueva rutina "${data.name}". Válida hasta el ${data.endDate}.`,
        id_patient: data.patientId,
        id_physio: data.physiotherapistId,
        origin: 'physio'
      });
    } catch (error) {
      console.error("Error al crear la notificación de rutina:", error);
    }

    return routine;
  }
}