import { TrackingRepository } from "../ports/out/TrackingRepository";
import { RoutineRepository } from "../ports/out/RoutineRepository";
import { CreateTrackingDTO } from "../dtos/tracking.dto";
import { CreateNotificationUseCase } from "./CreateNotification.uc";

/**
 * Registra seguimiento (EVA) en la tabla `tracking` con las FK requeridas
 * (id_patient, id_routine, id_exercise, date).
 */
export class RegisterPainLevelUseCase {
  constructor(
    private readonly trackingRepo: TrackingRepository,
    private readonly routineRepo: RoutineRepository,
    private readonly createNotification?: CreateNotificationUseCase
  ) {}

  async execute(data: CreateTrackingDTO, patientId: number) {
    const routine = await this.routineRepo.findById(data.routineId);
    if (!routine) {
      throw new Error("Rutina no encontrada.");
    }

    const routinePatientId = routine.id_patient ?? routine.idPatient;
    if (Number(routinePatientId) !== Number(patientId)) {
      throw new Error("Esta rutina no está asignada a tu cuenta.");
    }

    const exercises = routine.exercises || [];
    let idExercise = data.exerciseId;
    if (!idExercise && exercises.length > 0) {
      const first = exercises[0] as any;
      idExercise = first.id_exercise ?? first.id;
    }
    if (!idExercise) {
      throw new Error("La rutina no tiene ejercicios vinculados; no se puede registrar el seguimiento.");
    }

    const notesParts = [data.postObservations, data.intraObservations].filter(
      (s) => typeof s === "string" && s.trim().length > 0
    ) as string[];

    const row = {
      date: new Date().toISOString().slice(0, 10),
      completed: 1,
      pain_level: data.painLevel,
      feedback: (data.postObservations ?? "").trim(),
      notes: notesParts.length ? notesParts.join("\n---\n") : null,
      interrupted: 0,
      id_routine: data.routineId,
      id_exercise: idExercise,
      id_patient: patientId,
    };

    const tracking = await this.trackingRepo.create(row as any);

    if (this.createNotification && data.painLevel >= 7) {
      const idPhysio = routine.id_physio ?? routine.physiotherapistId;
      try {
        await this.createNotification.execute({
          id_patient: patientId,
          id_physio: idPhysio != null ? Number(idPhysio) : undefined,
          message:
            `Alerta: el paciente reportó dolor ${data.painLevel}/10 tras la sesión.` +
            (data.postObservations?.trim() ? ` Comentario: ${data.postObservations.trim()}` : ""),
          type: "mensaje",
        });
      } catch {
        /* no bloquear el registro principal */
      }
    }

    return tracking;
  }
}
