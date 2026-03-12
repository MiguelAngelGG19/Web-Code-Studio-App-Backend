import { PatientRepository } from "../../../application/ports/out/PatientRepository";
import { CreatePatientDTO, UpdatePatientDTO } from "../../../application/dtos/patient.dto";
import { Patient } from "../../../domain/entities/Patient";
import { PatientModel } from "../sequelize/client";

export class SequelizePatientRepository implements PatientRepository {
  
  // 1. Método para Crear
  async create(data: CreatePatientDTO): Promise<Patient> {
    const created = await PatientModel.create(data as any);
    return created.toJSON() as Patient;
  }

  // 2. Método para Listar (Paginación)
  async findAll(limit: number, offset: number): Promise<{ rows: Patient[]; count: number }> {
    const result = await PatientModel.findAndCountAll({ limit, offset });
    return { rows: result.rows.map(r => r.toJSON() as Patient), count: result.count };
  }

  // 3. NUEVO: Método para Editar
  async update(id: number, data: UpdatePatientDTO): Promise<Patient | null> {
    // 1. Ejecutamos la actualización en la base de datos
    const [affectedRows] = await PatientModel.update(data, {
      where: { id: id }
    });

    // 2. Si no se afectó ninguna fila, el paciente no existe
    if (affectedRows === 0) return null;

    // 3. Buscamos y devolvemos el paciente ya actualizado
    const updatedPatient = await PatientModel.findByPk(id);
    return updatedPatient?.toJSON() as Patient;
  }
  // 4. NUEVO: Método para Buscar por ID
  async findById(id: number): Promise<Patient | null> {
    const patient = await PatientModel.findByPk(id);
    return patient ? (patient.toJSON() as Patient) : null;
  }

  async findByEmail(email: string): Promise<any | null> {
  const patient = await PatientModel.findOne({ where: { email } });
  return patient ? patient.get({ plain: true }) : null;
}


}
