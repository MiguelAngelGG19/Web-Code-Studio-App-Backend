import jwt from "jsonwebtoken";
import { PatientRepository } from "../ports/out/PatientRepository";

export class LoginPatientByEmailUseCase {
  constructor(private readonly patientRepo: PatientRepository) {}

  async execute(email: string): Promise<{ token: string; patient: object }> {

    const raw = await this.patientRepo.findByEmail(email);
    if (!raw) {
      throw new Error("No estás registrado. Contacta a tu fisioterapeuta.");
    }

    // Mapeo robusto: acepta tanto snake_case (BD) como camelCase (por si acaso)
    const patient = {
      id:               raw.id_patient   ?? raw.id,
      firstName:        raw.first_name   ?? raw.firstName,
      lastNameP:        raw.last_name_paternal ?? raw.lastNameP,
      lastNameM:        raw.last_name_maternal ?? raw.lastNameM,
      email:            raw.email,
      physiotherapistId: raw.id_physio   ?? raw.physiotherapistId ?? null,
    };

    const token = jwt.sign(
      { id: patient.id, email: patient.email, role: "paciente" },
      process.env.JWT_SECRET || "secret_dev",
      { expiresIn: "8h" }
    );

    return { token, patient };
  }
}
