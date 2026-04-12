import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const requireApproval = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "No autorizado." });
    return;
  }

  // Los pacientes no pasan por flujo de aprobacion de fisioterapeuta
  if (req.user.role === 'paciente') {
    next();
    return;
  }

  // Para fisioterapeutas: verificar aprobacion del admin
  if (req.user.status !== 'approved') {
    res.status(403).json({ 
      success: false, 
      message: "Acceso denegado. Tu cuenta esta en revision por un administrador. Aun no puedes gestionar pacientes ni citas." 
    });
    return;
  }

  next();
};
