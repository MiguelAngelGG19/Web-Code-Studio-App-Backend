import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { PhysiotherapistModel } from "../../persistence/sequelize/client";

export const requireActivePlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "No autorizado." });
    return;
  }

  if (req.user.role === 'patient') {
    next();
    return;
  }

  try {
    // 🪄 PARCHE TYPESCRIPT: Le decimos que confíe en nosotros con el "any"
    const userId = req.user.id || (req as any).user.id_user;

    // 🪄 MAGIA ANTI-SEQUELIZE: Consulta SQL pura para que no ignore la BD
    const [results]: any = await PhysiotherapistModel.sequelize!.query(
      'SELECT plan_activo, plan_type, plan_expires_at FROM physiotherapist WHERE id_user = ? LIMIT 1',
      { replacements: [userId] }
    );

    if (!results || results.length === 0) {
      res.status(404).json({ success: false, message: "Fisioterapeuta no encontrado." });
      return;
    }

    const fisio = results[0];
    const planActivo = fisio.plan_activo;
    const planExpires = fisio.plan_expires_at;
    const planType = fisio.plan_type; 

    // Si es plan gratis, lo dejamos pasar a leer
    if (planType === 'free' || planType === 'gratis' || !planType) {
      next();
      return;
    }

    // Verificamos los planes de pago
    const estaActivo = String(planActivo) === '1' || String(planActivo) === 'true' || planActivo === 'activo' || planActivo === 1 || planActivo === true;
    const noVencido = !planExpires || new Date(planExpires) > new Date();

    if (!estaActivo || !noVencido) {
      res.status(402).json({
        success: false,
        code: 'PAYMENT_REQUIRED',
        message: "Necesitas una suscripción activa para acceder a esta funcionalidad. Por favor, elige un plan en la sección de Membresías."
      });
      return;
    }

    next();
  } catch (error: any) {
    console.error("Error en requireActivePlan:", error);
    res.status(500).json({ success: false, message: "Error interno al verificar el plan." });
  }
};