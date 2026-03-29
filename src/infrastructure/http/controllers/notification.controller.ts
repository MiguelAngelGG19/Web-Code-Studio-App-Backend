import { Request, Response } from "express";
import { CreateNotificationUseCase } from "../../../application/use-cases/CreateNotification.uc";
import { GetNotificationsByPatientUseCase } from "../../../application/use-cases/GetNotificationsByPatient.uc";
import { MarkNotificationAsReadUseCase } from "../../../application/use-cases/MarkNotificationAsRead.uc";

export class NotificationController {
  constructor(
    private createNotification: CreateNotificationUseCase,
    private getNotificationsByPatient: GetNotificationsByPatientUseCase,
    private markNotificationAsRead: MarkNotificationAsReadUseCase
  ) {
    this.create = this.create.bind(this);
    this.getByPatient = this.getByPatient.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.createNotification.execute(req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async getByPatient(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getNotificationsByPatient.execute(Number(req.params.patientId));
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      await this.markNotificationAsRead.execute(Number(req.params.id));
      res.status(200).json({ message: "Notificación marcada como leída." });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}
