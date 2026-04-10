import { Request, Response } from "express";
import { RegisterPhysiotherapistUseCase } from "../../../application/use-cases/RegisterPhysiotherapist.uc";
import { LoginPhysiotherapistUseCase } from "../../../application/use-cases/LoginPhysiotherapist.uc";
import { LoginPatientByEmailUseCase } from "../../../application/use-cases/LoginPatientByEmail.uc"; 
import { UpdateEmailUseCase } from "../../../application/use-cases/UpdateEmail.uc";
import { UpdatePasswordUseCase } from "../../../application/use-cases/UpdatePassword.uc";

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterPhysiotherapistUseCase,
    private readonly loginUseCase: LoginPhysiotherapistUseCase,
    private readonly loginPatientEmailUseCase: LoginPatientByEmailUseCase, 
    private updateEmailUseCase: UpdateEmailUseCase,    
    private updatePasswordUseCase: UpdatePasswordUseCase
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.registerUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path; 
        let friendlyMessage = "Un dato proporcionado ya se encuentra registrado.";
        
        if (field === 'curp') {
          friendlyMessage = "La CURP ingresada ya se encuentra registrada en el sistema.";
        } else if (field === 'professional_license' || field === 'professionalLicense') {
          friendlyMessage = "La Cédula Profesional ingresada ya está vinculada a otra cuenta.";
        } else if (field === 'email' || field === 'users.email') {
          friendlyMessage = "El correo electrónico ya está en uso. Por favor, inicia sesión.";
        }

        res.status(409).json({ message: friendlyMessage });
        return;
      }
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

  // 🪄 CONVERTIDAS A ARROW FUNCTIONS PARA QUE NUNCA PIERDAN EL CONTEXTO (this)
  updateEmail = async (req: any, res: any): Promise<void> => {
    try {
      const idUser = req.user.id; 
      const { email } = req.body;
      const result = await this.updateEmailUseCase.execute(idUser, email);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  updatePassword = async (req: any, res: any): Promise<void> => {
    try {
      const idUser = req.user.id; 
      const { passwordActual, passwordNueva } = req.body;
      const result = await this.updatePasswordUseCase.execute(idUser, passwordActual, passwordNueva);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}