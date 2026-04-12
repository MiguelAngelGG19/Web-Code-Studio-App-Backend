/**
 * **************************************************************************
 * CONTROLADOR DE SEGUIMIENTO (TRACKING) - INTERFACE ADAPTER
 * PROYECTO: ACTIVA
 * **************************************************************************
 */

import { Request, Response } from "express";
import { TrackingSchema } from "../../../application/dtos/schemas";
import { AuthRequest } from "../middlewares/auth.middleware";

export class TrackingController {
  constructor(private readonly registerPainLevel: any) {}

  /**
   * POST /api/tracking — Solo pacientes (JWT con id = id_patient).
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = req as AuthRequest;
      const user = auth.user;
      if (!user || user.role !== "patient") {
        res.status(403).json({
          success: false,
          message: "Solo los pacientes pueden registrar seguimiento de sesión.",
        });
        return;
      }

      const validatedData = TrackingSchema.parse(req.body);
      const tracking = await this.registerPainLevel.execute(validatedData, user.id);

      res.status(201).json({
        success: true,
        message: "Reporte de molestias registrado exitosamente.",
        data: tracking,
      });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        res.status(400).json({
          success: false,
          message: "Los datos del reporte de dolor no cumplen con el formato requerido.",
          errors: error.issues ?? error.errors,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error?.message || "No se pudo procesar el registro de seguimiento.",
      });
    }
  };
}
