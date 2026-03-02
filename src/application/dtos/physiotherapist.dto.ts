export type CreatePhysiotherapistDTO = {
  firstName: string;
  lastNameP: string;
  lastNameM?: string; // Opcional
  birthYear: number;
  professionalLicense: string;
  curp: string;
  // Nota: Las URLs de documentos o fotos se pueden añadir después
};