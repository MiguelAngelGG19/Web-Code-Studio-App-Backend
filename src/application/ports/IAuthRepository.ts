export interface IAuthRepository {
  findByEmail(email: string): Promise<any | null>;
  register(data: {
    firstName: string;
    lastNameP: string;
    lastNameM: string;
    birthYear: number;
    email: string;
    password: string;
    professionalLicense: string;
    curp: string;
  }): Promise<any>;
}
