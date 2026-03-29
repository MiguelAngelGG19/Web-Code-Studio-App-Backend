import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { IAuthRepository } from "../ports/IAuthRepository";
import { LoginPhysiotherapistDto } from "../dtos/auth.dto";

export class LoginPhysiotherapistUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(dto: LoginPhysiotherapistDto): Promise<{ token: string; fisio: object }> {
    // 1. Buscar fisio por email
    const fisio = await this.authRepo.findByEmail(dto.email);
    if (!fisio) {
      throw new Error("Credenciales incorrectas.");
    }

    // 2. Verificar que la cuenta esté activa
   if (fisio.role !== "physio") {
      throw new Error("Tu cuenta aún no está activa. Contacta al administrador.");
    }

    // 3. Comparar contraseña
    const passwordMatch = await bcrypt.compare(dto.password, fisio.password);
    if (!passwordMatch) {
      throw new Error("Credenciales incorrectas.");
    }

    // 4. Generar JWT
    const token = jwt.sign(
      {
        id: fisio.id,
        email: fisio.email,
        role: "fisioterapeuta",
      },
      process.env.JWT_SECRET || "secret_dev",
      { expiresIn: "8h" }
    );

    return {
      token,
      fisio: {
        id: fisio.id,
        firstName: fisio.firstName,
        lastNameP: fisio.lastNameP,
        email: fisio.email,
      },
    };
  }
}
