import { Request, Response } from "express";
import { CreateLogbookUseCase } from "../../../application/use-cases/CreateLogbook.uc";
import { GetLogbookByAppointmentUseCase } from "../../../application/use-cases/GetLogbookByAppointment.uc";

export class LogbookController {
  constructor(
    private createLogbook: CreateLogbookUseCase,
    private getLogbookByAppointment: GetLogbookByAppointmentUseCase
  ) {
    this.create = this.create.bind(this);
    this.getByAppointment = this.getByAppointment.bind(this);
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.createLogbook.execute(req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async getByAppointment(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getLogbookByAppointment.execute(Number(req.params.appointmentId));
      res.status(200).json(result);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }
}
