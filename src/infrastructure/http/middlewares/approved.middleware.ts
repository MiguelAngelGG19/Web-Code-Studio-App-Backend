import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const requireApproval = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "No autorizado." });
    return;
  }

  // ✅ Los pacientes tienen su propio rol y no pasan por el flujo de aprobación
  if (req.user.role === 'paciente') {
    next();
    return;
  }

  // 🛡️ Para fisioterapeutas: verificar que estén aprobados por el admin
  if (req.user.status !== 'approved') {
    res.status(403).json({ 
      success: false, 
      message: "Acceso denegado. Tu cuenta está en revisión por un administrador. Aún no puedes gestionar pacientes ni citas." 
    });
    return;
  }

  next();
};
