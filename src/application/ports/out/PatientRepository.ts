import { Patient } from "../../../domain/entities/Patient";
import { CreatePatientDTO } from "../../dtos/patient.dto";

export interface PatientRepository {
  create(data: CreatePatientDTO): Promise<Patient>;
  findAll(limit: number, offset: number): Promise<{ rows: Patient[]; count: number }>;
}