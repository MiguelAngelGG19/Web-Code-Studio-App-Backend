import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class LoginPatientWithGoogleUseCase {
  constructor(private readonly patientRepo: any) {}

  async execute(googleToken: string): Promise<{ token: string; patient: object }> {
    
    // 1. Verificar el token con Google
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch {
      throw new Error("Token de Google inválido o expirado.");
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error("No se pudo obtener el correo de Google.");
    }

    const email = payload.email;

    // 2. Buscar ese correo en la tabla paciente
    const patient = await this.patientRepo.findByEmail(email);
    if (!patient) {
      throw new Error("No estás registrado. Contacta a tu fisioterapeuta.");
    }

    // 3. Generar JWT propio
    const token = jwt.sign(
      {
        id: patient.id,
        email: patient.email,
        role: "paciente",
      },
      process.env.JWT_SECRET || "secret_dev",
      { expiresIn: "8h" }
    );

    return {
      token,
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastNameP: patient.lastNameP,
        email: patient.email,
      },
    };
  }
}
