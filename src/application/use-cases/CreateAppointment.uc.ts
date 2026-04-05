import { SequelizeAppointmentRepository } from "../../infrastructure/persistence/repositories/SequelizeAppointmentRepository";

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
    
    // 1. Validación básica de que no vengan campos vacíos
    if (!data.id_patient || !data.id_physio || !data.date || !data.start_time || !data.end_time) {
      throw new Error("Faltan datos obligatorios para crear la cita (paciente, fisio, fecha u hora).");
    }

    // 🪄 2. MAGIA ANTI-CHOQUES DE HORARIO
    // Obtenemos todas las citas de ese fisio (Reutilizamos la función que ya existe en el repo)
    const allAppointments = await this.repo.findByPhysio(data.id_physio);

    // Filtramos para quedarnos SOLO con las citas de ese mismo día y que NO estén canceladas
    const dayAppointments = allAppointments.filter(app => 
        app.date === data.date && 
        app.status !== 'cancelled' 
    );

    // Convertimos las horas de la NUEVA cita a objetos de tiempo para compararlas
    const newStart = new Date(`1970-01-01T${data.start_time}`);
    const newEnd = new Date(`1970-01-01T${data.end_time}`);

    // Revisamos las citas de ese día una por una
    for (const app of dayAppointments) {
        // Horas de la cita que ya estaba en la Base de Datos
        const existStart = new Date(`1970-01-01T${app.start_time}`);
        const existEnd = new Date(`1970-01-01T${app.end_time}`);

        // Fórmula universal para detectar cruce de horarios: 
        // (El inicio nuevo es antes que el fin existente) Y (El fin nuevo es después que el inicio existente)
        if (newStart < existEnd && newEnd > existStart) {
            
            // Le damos formato bonito a las horas para el mensaje (de "14:00:00" a "14:00")
            const horaInicio = app.start_time.substring(0, 5);
            const horaFin = app.end_time.substring(0, 5);
            
            // ¡Lanzamos la bomba! Esto cancela el guardado y se va directo a tu Toast de Angular
            throw new Error(`Horario no disponible. Se cruza con una cita programada de ${horaInicio} a ${horaFin}.`);
        }
    }

    // 3. Si logró pasar el ciclo for sin lanzar error, el horario está libre y seguro. ¡Guardamos!
    return this.repo.create(data);
  }
}