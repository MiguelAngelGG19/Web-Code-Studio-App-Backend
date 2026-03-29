import { Request, Response } from "express";
import { CreateAppointmentUseCase } from "../../../application/use-cases/CreateAppointment.uc";
import { GetAppointmentsByPatientUseCase } from "../../../application/use-cases/GetAppointmentsByPatient.uc";
import { UpdateAppointmentUseCase } from "../../../application/use-cases/UpdateAppointment.uc";

export class AppointmentController {
  constructor(
    private createAppointment: CreateAppointmentUseCase,
    private getAppointmentsByPatient: GetAppointmentsByPatientUseCase,
    private updateAppointment: UpdateAppointmentUseCase
  ) {
    this.create = this.create.bind(this);
    this.getByPatient = this.getByPatient.bind(this);
    this.update = this.update.bind(this);
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.createAppointment.execute(req.body);
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
}
