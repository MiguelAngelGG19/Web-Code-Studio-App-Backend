import jwt from "jsonwebtoken";
import { PatientRepository } from "../ports/out/PatientRepository";

export class LoginPatientByEmailUseCase {
  constructor(private readonly patientRepo: PatientRepository) {}

  async execute(email: string): Promise<{ token: string; patient: object }> {

    const normalizedEmail = email.trim().toLowerCase();
    const raw = await this.patientRepo.findByEmail(normalizedEmail);
    if (!raw) {
      throw new Error(
        "No hay cuenta de paciente con ese correo. Comprueba mayúsculas y espacios; si eres fisioterapeuta, entra por la web de fisio."
      );
    }

    const birthDate = raw.birth_date ?? raw.birthDate ?? null;
    let birthYear: number | null = null;
    if (birthDate) {
      const y = new Date(birthDate as string).getFullYear();
      if (!isNaN(y)) birthYear = y;
    }

    const height = raw.height != null && raw.height !== "" ? Number(raw.height) : null;
    const weight = raw.weight != null && raw.weight !== "" ? Number(raw.weight) : null;

    // Mapeo robusto + datos clínicos para la app móvil (perfil sin esperar otro GET)
    const patient = {
      id: raw.id_patient ?? raw.id,
      firstName: raw.first_name ?? raw.firstName,
      lastNameP: raw.last_name_paternal ?? raw.lastNameP,
      lastNameM: raw.last_name_maternal ?? raw.lastNameM,
      email: raw.email ?? raw.User?.email ?? normalizedEmail,
      physiotherapistId: raw.id_physio ?? raw.physiotherapistId ?? null,
      birthYear: birthYear ?? undefined,
      birthDate: birthDate ?? undefined,
      height: height != null && !isNaN(height) ? height : undefined,
      weight: weight != null && !isNaN(weight) ? weight : undefined,
    };

    // IMPORTANTE: role debe ser "patient" (inglés) para que requireApproval
    // lo reconozca y deje pasar al paciente sin exigir status de fisioterapeuta.
    const token = jwt.sign(
      { id: patient.id, email: patient.email ?? normalizedEmail, role: "patient" },
      process.env.JWT_SECRET || "secret_dev",
      { expiresIn: "8h" }
    );

    return { token, patient };
  }
}
