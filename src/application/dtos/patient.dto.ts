export type CreatePatientDTO = {
  firstName: string;
  lastNameP: string;
  lastNameM?: string;
  birthYear: number;
  sex: string;
  height: number;
  weight: number;
  email: string;
  physiotherapistId: number;
};

// DTO para actualización (campos opcionales)
export type UpdatePatientDTO = Partial<CreatePatientDTO>;