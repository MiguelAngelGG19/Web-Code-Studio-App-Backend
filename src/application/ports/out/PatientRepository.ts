import { Patient } from "../../../domain/entities/Patient";
import { CreatePatientDTO } from "../../dtos/patient.dto";
export type UpdatePatientDTO = Partial<CreatePatientDTO>;
export interface PatientRepository {
  create(data: CreatePatientDTO): Promise<Patient>;
  findAll(limit: number, offset: number): Promise<{ rows: Patient[]; count: number }>;
  update(id: number, data: UpdatePatientDTO): Promise<Patient | null>;
}