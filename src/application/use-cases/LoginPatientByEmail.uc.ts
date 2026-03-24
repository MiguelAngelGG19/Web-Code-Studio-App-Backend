import jwt from "jsonwebtoken";
import { PatientRepository } from "../ports/out/PatientRepository";

export class LoginPatientByEmailUseCase {
  constructor(private readonly patientRepo: PatientRepository) {}

  async execute(email: string): Promise<{ token: string; patient: object }> {
    
    const patient = await this.patientRepo.findByEmail(email);
    if (!patient) {
      throw new Error("No estás registrado. Contacta a tu fisioterapeuta.");
    }

    const token = jwt.sign(
      { id: patient.id, email: patient.email, role: "paciente" },
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
