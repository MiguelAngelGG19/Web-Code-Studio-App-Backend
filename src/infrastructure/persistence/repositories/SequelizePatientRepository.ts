import { PatientRepository } from "../../../application/ports/out/PatientRepository";
import { CreatePatientDTO } from "../../../application/dtos/patient.dto";
import { Patient } from "../../../domain/entities/Patient";
import { PatientModel } from "../sequelize/client";

export class SequelizePatientRepository implements PatientRepository {
  async create(data: CreatePatientDTO): Promise<Patient> {
    const created = await PatientModel.create(data as any);
    return created.toJSON() as Patient;
  }

  async findAll(limit: number, offset: number): Promise<{ rows: Patient[]; count: number }> {
    const result = await PatientModel.findAndCountAll({ limit, offset });
    return { rows: result.rows.map(r => r.toJSON() as Patient), count: result.count };
  }
}
