import { SequelizeAppointmentRepository } from "../../infrastructure/persistence/repositories/SequelizeAppointmentRepository";
import { NotificationModel } from "../../infrastructure/persistence/sequelize/client";

export class CreateAppointmentUseCase {
  constructor(private repo: SequelizeAppointmentRepository) {}

  async execute(data: {
    id_patient: number;
    id_physio: number;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    notes?: string;
  }): Promise<any> {
    
    if (!data.id_patient || !data.id_physio || !data.date || !data.start_time || !data.end_time) {
      throw new Error("Faltan datos obligatorios para crear la cita (paciente, fisio, fecha u hora).");
    }

    const allAppointments = await this.repo.findByPhysio(data.id_physio);

    // 🪄 DOBLE CANDADO: Filtramos por fecha, por estatus, Y POR FISIO
    const dayAppointments = allAppointments.filter(app => 
        app.id_physio === data.id_physio && // <-- CANDADO EXTRA
        app.date === data.date && 
        app.status !== 'cancelled' 
    );

    const newStart = new Date(`1970-01-01T${data.start_time}`);
    const newEnd = new Date(`1970-01-01T${data.end_time}`);

    for (const app of dayAppointments) {
        const existStart = new Date(`1970-01-01T${app.start_time}`);
        const existEnd = new Date(`1970-01-01T${app.end_time}`);

        if (newStart < existEnd && newEnd > existStart) {
            const horaInicio = app.start_time.substring(0, 5);
            const horaFin = app.end_time.substring(0, 5);
            
            throw new Error(`Horario no disponible en tu agenda. Se cruza con una cita programada de ${horaInicio} a ${horaFin}.`);
        }
    }

    const appointment = await this.repo.create(data);

    // NUEVO: Disparar notificación de cita creada
    try {
      await NotificationModel.create({
        type: 'cita',
        message: `Tu fisioterapeuta te ha agendado una nueva sesión el día ${data.date} a las ${data.start_time.substring(0, 5)}.`,
        id_patient: data.id_patient,
        id_physio: data.id_physio,
        origin: 'physio'
      });
    } catch (error) {
      console.error("Error al crear la notificación de cita:", error);
    }

    return appointment;
  }
}