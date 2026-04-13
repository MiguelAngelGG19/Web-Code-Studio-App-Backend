import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { PhysiotherapistModel } from "../../persistence/sequelize/client";

/**
 * **************************************************************************
 * MIDDLEWARE: requireActivePlan
 * DESCRIPCIÓN: Verifica que el fisioterapeuta tenga un plan de suscripción
 *              activo (plan_activo = 'activo') antes de acceder a los
 *              recursos operativos de la plataforma.
 *
 * FLUJO:
 *   - Pacientes → pasan siempre (no tienen plan)
 *   - Fisios con plan_activo = 'activo' → pasan
 *   - Fisios con plan_activo = 'inactivo' → 402 Payment Required
 *
 * USO EN RUTAS:
 *   router.get('/patients', authMiddleware, requireApproval, requireActivePlan, ...)
 * **************************************************************************
 */
export const requireActivePlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Sin usuario en el request (authMiddleware no corrió)
  if (!req.user) {
    res.status(401).json({ success: false, message: "No autorizado." });
    return;
  }

  // ✅ Los pacientes pasan siempre — el plan es exclusivo del fisioterapeuta
  if (req.user.role === 'patient') {
    next();
    return;
  }

  try {
    // Buscamos el fisio en la BD usando el id_user que viene del JWT
    const fisio = await PhysiotherapistModel.findOne({
      where: { id_user: req.user.id },
      attributes: ['plan_activo', 'plan_type', 'plan_expires_at']
    }) as any;

    if (!fisio) {
      res.status(404).json({ success: false, message: "Fisioterapeuta no encontrado." });
      return;
    }

    const planActivo = fisio.getDataValue('plan_activo');
    const planExpires = fisio.getDataValue('plan_expires_at');

    // Verificar si el plan está activo
    const estaActivo = planActivo === 'activo';

    // Verificar si la suscripción no ha vencido (si tiene fecha de expiración)
    const noVencido = !planExpires || new Date(planExpires) > new Date();

    if (!estaActivo || !noVencido) {
      res.status(402).json({
        success: false,
        code: 'PLAN_REQUERIDO',
        message: "Necesitas una suscripción activa para acceder a esta funcionalidad. Por favor, elige un plan en la sección de Membresías."
      });
      return;
    }

    // ✅ Plan activo y vigente — continuar
    next();
  } catch (error: any) {
    console.error("Error en requireActivePlan:", error);
    res.status(500).json({ success: false, message: "Error interno al verificar el plan." });
  }
};
