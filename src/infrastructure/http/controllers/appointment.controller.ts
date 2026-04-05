import { Request, Response } from "express";
import { CreateAppointmentUseCase } from "../../../application/use-cases/CreateAppointment.uc";
import { GetAppointmentsByPatientUseCase } from "../../../application/use-cases/GetAppointmentsByPatient.uc";
import { UpdateAppointmentUseCase } from "../../../application/use-cases/UpdateAppointment.uc";
import { GetAppointmentsByPhysioUseCase } from "../../../application/use-cases/GetAppointmentsByPhysio.uc";

export class AppointmentController {
  constructor(
    private createAppointment: CreateAppointmentUseCase,
    private getAppointmentsByPatient: GetAppointmentsByPatientUseCase,
    private updateAppointment: UpdateAppointmentUseCase,
    private getAppointmentsByPhysio: GetAppointmentsByPhysioUseCase
  ) {
    this.create = this.create.bind(this);
    this.getByPatient = this.getByPatient.bind(this);
    this.update = this.update.bind(this);
    this.getMyPhysioAppointments = this.getMyPhysioAppointments.bind(this);
  }

  async create(req: any, res: Response): Promise<void> {
    try {
      // 1. Extraemos el ID del fisio directamente del token de seguridad
      const physioId = req.user?.id || req.user?.id_user;

      if (!physioId) {
        res.status(401).json({ message: "No autorizado. No se detectó la sesión del fisioterapeuta." });
        return;
      }

      // 2. Armamos el paquete combinando lo que manda Angular + el ID seguro
      const appointmentData = {
        ...req.body,
        id_physio: physioId
      };

      // 3. Ejecutamos el caso de uso que acabamos de corregir
      const result = await this.createAppointment.execute(appointmentData);
      res.status(201).json(result);
      
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async getByPatient(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getAppointmentsByPatient.execute(Number(req.params.patientId));
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.updateAppointment.execute(Number(req.params.id), req.body);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
  // AGREGAR ESTA FUNCIÓN AL CONTROLADOR
  async getMyPhysioAppointments(req: any, res: Response): Promise<void> {
    try {
      const idPhysio = req.user?.id; // Saca el ID del token
      // Necesitarán crear un GetAppointmentsByPhysioUseCase que llame a findByPhysio en el repo
      // y conectarlo a una ruta GET /api/appointments
      const result = await this.getAppointmentsByPhysio.execute(idPhysio);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

