import { Request, Response } from "express";
import { CreateAppointmentUseCase } from "../../../application/use-cases/CreateAppointment.uc";
import { GetAppointmentsByPatientUseCase } from "../../../application/use-cases/GetAppointmentsByPatient.uc";
import { UpdateAppointmentUseCase } from "../../../application/use-cases/UpdateAppointment.uc";
import { GetAppointmentsByPhysioUseCase } from "../../../application/use-cases/GetAppointmentsByPhysio.uc";
// 🪄 IMPORTAMOS EL MODELO DEL FISIO
import { PhysiotherapistModel } from "../../../infrastructure/persistence/sequelize/client";

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
      // 1. Extraemos el ID del usuario del token
      const userIdFromToken = req.user?.id || req.user?.id_user;

      if (!userIdFromToken) {
        res.status(401).json({ message: "No autorizado. No se detectó la sesión." });
        return;
      }

      // 🪄 2. TRADUCTOR DE IDs: Obtenemos el verdadero id_physio
      const physioRecord = await PhysiotherapistModel.findOne({ where: { id_user: userIdFromToken } });
      if (!physioRecord) {
        res.status(403).json({ message: "No tienes un perfil de fisioterapeuta válido para agendar." });
        return;
      }

      const idPhysioReal = (physioRecord as any).id_physio;

      // 3. Armamos el paquete combinando lo que manda Angular + el ID seguro
      const appointmentData = {
        ...req.body,
        id_physio: idPhysioReal
      };

      // 4. Ejecutamos el caso de uso
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

  async getMyPhysioAppointments(req: any, res: Response): Promise<void> {
    try {
      const userIdFromToken = req.user?.id || req.user?.id_user;
      
      if (!userIdFromToken) {
        res.status(401).json({ message: "No autorizado." });
        return;
      }

      // 🪄 TRADUCTOR DE IDs
      const physioRecord = await PhysiotherapistModel.findOne({ where: { id_user: userIdFromToken } });
      if (!physioRecord) {
        res.status(403).json({ message: "Perfil de fisioterapeuta no encontrado." });
        return;
      }

      const idPhysioReal = (physioRecord as any).id_physio;

      const result = await this.getAppointmentsByPhysio.execute(idPhysioReal);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}