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
