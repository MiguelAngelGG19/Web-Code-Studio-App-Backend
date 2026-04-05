import { Request, Response } from "express";
import { RegisterPhysiotherapistUseCase } from "../../../application/use-cases/RegisterPhysiotherapist.uc";
import { LoginPhysiotherapistUseCase } from "../../../application/use-cases/LoginPhysiotherapist.uc";
import { LoginPatientByEmailUseCase } from "../../../application/use-cases/LoginPatientByEmail.uc"; // ← CAMBIO

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterPhysiotherapistUseCase,
    private readonly loginUseCase: LoginPhysiotherapistUseCase,
    private readonly loginPatientEmailUseCase: LoginPatientByEmailUseCase, // ← CAMBIO
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.registerUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      // 1. Detectamos si el error es por un duplicado en la base de datos (Regla UNIQUE)
      if (error.name === 'SequelizeUniqueConstraintError') {
        // Extraemos qué columna exacta causó el conflicto
        const field = error.errors[0]?.path; 
        
        let friendlyMessage = "Un dato proporcionado ya se encuentra registrado.";
        
        // Traducimos el campo de la base de datos a un mensaje humano
        if (field === 'curp') {
          friendlyMessage = "La CURP ingresada ya se encuentra registrada en el sistema.";
        } else if (field === 'professional_license' || field === 'professionalLicense') {
          friendlyMessage = "La Cédula Profesional ingresada ya está vinculada a otra cuenta.";
        } else if (field === 'email' || field === 'users.email') {
          friendlyMessage = "El correo electrónico ya está en uso. Por favor, inicia sesión.";
        }

        // Retornamos status 409 (Conflict) con nuestro mensaje personalizado
        res.status(409).json({ message: friendlyMessage });
        return;
      }

      // 2. Si es cualquier otro error (ej. faltan datos), devolvemos el error crudo 400
      res.status(400).json({ message: error.message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.loginUseCase.execute(req.body);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  };

  loginPatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ message: "Se requiere el correo." });
        return;
      }
      const result = await this.loginPatientEmailUseCase.execute(email);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  };
}