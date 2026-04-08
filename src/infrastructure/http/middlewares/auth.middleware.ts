import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: number; role: string; status?: string; id_physio?: number };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Token no proporcionado." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    // 🔥 EL ARREGLO ESTÁ AQUÍ: Le damos la misma llave de respaldo que usa el Login
    const secretKey = process.env.JWT_SECRET || "secret_dev";
    
    const decoded = jwt.verify(token, secretKey) as { id: number; role: string };
    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    // 🕵️‍♂️ Extra: Imprimimos el error real en la consola del backend por si acaso
    console.error("Error en authMiddleware:", error);
    res.status(401).json({ success: false, message: "Token inválido o expirado." });
  }
};