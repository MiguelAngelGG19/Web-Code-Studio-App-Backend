import { PatientRepository } from "../../../application/ports/out/PatientRepository";
import { CreatePatientDTO, UpdatePatientDTO } from "../../../application/dtos/patient.dto";
import { Patient } from "../../../domain/entities/Patient";
import { PatientModel, UserModel } from "../sequelize/client";

export class SequelizePatientRepository implements PatientRepository {

  async create(data: CreatePatientDTO): Promise<Patient> {
    const created = await PatientModel.create(data as any);
    return created.toJSON() as Patient;
  }

 async findAll(limit: number, offset: number): Promise<{ rows: Patient[]; count: number }> {
    const result = await PatientModel.findAndCountAll({ 
      limit, 
      offset,
      // 🪄 LA MAGIA DEL JOIN: Traemos el correo de la tabla Users
      include: [
        { 
          model: UserModel, 
          attributes: ['email'] // Solo traemos el email para no saturar la red
        }
      ]
    });
    
    return { rows: result.rows.map(r => r.toJSON() as Patient), count: result.count };
  }

  async findById(id: number): Promise<Patient | null> {
    const patient = await PatientModel.findByPk(id, {
      // 🪄 TAMBIÉN LO PONEMOS AQUÍ para cuando veas el detalle de 1 solo paciente
      include: [
        { 
          model: UserModel, 
          attributes: ['email'] 
        }
      ]
    });
    return patient ? patient.toJSON() as Patient : null;
  }

  async update(id: number, data: UpdatePatientDTO): Promise<Patient | null> {
    const [affectedRows] = await PatientModel.update(data, { where: { id_patient: id } });
    if (affectedRows === 0) return null;
    const updated = await PatientModel.findByPk(id);
    return updated?.toJSON() as Patient;
  }


  async findByEmail(email: string): Promise<any | null> {
    const user = await UserModel.findOne({ where: { email } });
    if (!user) return null;
    const patient = await PatientModel.findOne({ where: { id_user: (user as any).id_user } });
    return patient ? patient.get({ plain: true }) : null;
  }
}
