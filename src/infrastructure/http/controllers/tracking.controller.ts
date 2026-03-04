import { Request, Response } from "express";
import { TrackingSchema } from "../../../application/dtos/schemas";

export class TrackingController {
  constructor(private readonly registerPainLevel: any) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = TrackingSchema.parse(req.body);
      const tracking = await this.registerPainLevel.execute(validatedData);
      res.status(201).json({ success: true, data: tracking });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ success: false, message: "Error de validación", errors: error.errors });
        return;
      }
      res.status(400).json({ success: false, message: error.message });
    }
  };
}