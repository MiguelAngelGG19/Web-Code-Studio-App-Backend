import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

/** Solo cuentas con rol admin (JWT emitido por login-admin). */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "No autorizado." });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ success: false, message: "Solo administradores pueden acceder a este recurso." });
    return;
  }
  next();
};
