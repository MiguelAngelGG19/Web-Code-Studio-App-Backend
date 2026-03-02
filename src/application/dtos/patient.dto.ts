export type CreatePatientDTO = {
  firstName: string;
  lastNameP: string;
  lastNameM?: string; // Opcional
  birthYear: number;
  sex: string;
  height: number;
  weight: number;
  email: string;      // CAMPO AÑADIDO: Correo electrónico (Único)
  physiotherapistId: number;
};