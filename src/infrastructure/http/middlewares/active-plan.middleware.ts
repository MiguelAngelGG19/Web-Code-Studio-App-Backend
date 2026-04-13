/**
 * **************************************************************************
 * MIDDLEWARE: Verificar que el fisioterapeuta tiene un plan activo en Stripe
 * **************************************************************************
 */

import { Request, Response, NextFunction } from "express";
import { PhysiotherapistModel } from "../../persistence/sequelize/client";

export async function requireActivePlan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;

    // Si no es fisio (ej. paciente), dejamos pasar
    if (user.role !== "physiotherapist") {
      next();
      return;
    }

    const physio: any = await PhysiotherapistModel.findOne({
      where: { id_user: user.id },
    });

    if (!physio) {
      res.status(404).json({ message: "Fisioterapeuta no encontrado." });
      return;
    }

    const status = physio.getDataValue("plan_status");

    if (status !== "active") {
      res.status(403).json({
        message: "Acceso denegado. Necesitas una suscripción activa para continuar.",
        code: "NO_ACTIVE_PLAN",
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
