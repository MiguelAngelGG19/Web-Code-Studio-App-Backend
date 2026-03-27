export interface RegisterPhysiotherapistDto {
  firstName: string;
  lastNameP: string;
  lastNameM: string;
  birthDate: string;
  email: string;
  password: string;
  professionalLicense: string;
  curp: string;
}

export interface LoginPhysiotherapistDto {
  email: string;
  password: string;
}
