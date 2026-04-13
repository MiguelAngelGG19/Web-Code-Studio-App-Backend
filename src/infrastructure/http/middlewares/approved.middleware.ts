import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware"; // Importamos la interfaz del otro archivo

export const requireApproval = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Verificamos que el usuario exista en la petición (esto lo pone el authMiddleware)
  if (!req.user) {
    res.status(401).json({ success: false, message: "No autorizado." });
    return;
  }

  // ✅ Los pacientes pasan directo — el campo 'status' es exclusivo de fisioterapeutas
  if (req.user.role === 'patient') {
    next();
    return;
  }

  // ✅ Administradores gestionan catálogo (ejercicios, etc.) sin perfil de fisio
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // 🛡️ EL CANDADO DE TITANIO: Si el fisio no está aprobado, lo rebotamos
  if (req.user.status !== 'approved') {
    res.status(403).json({ 
      success: false, 
      message: "Acceso denegado. Tu cuenta está en revisión por un administrador. Aún no puedes gestionar pacientes ni citas." 
    });
    return;
  }

  // Si su estatus es 'approved', le abrimos la puerta para que siga
  next();
};
