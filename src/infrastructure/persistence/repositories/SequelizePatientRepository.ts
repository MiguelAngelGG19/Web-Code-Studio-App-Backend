import { QueryTypes } from "sequelize";
import { PatientRepository } from "../../../application/ports/out/PatientRepository";
import { CreatePatientDTO, UpdatePatientDTO } from "../../../application/dtos/patient.dto";
import { Patient } from "../../../domain/entities/Patient";
import { PatientModel, UserModel, sequelize } from "../sequelize/client";

export class SequelizePatientRepository implements PatientRepository {

  // 🪄 CAMBIO A ANY PARA RECIBIR EL PAQUETE COMPLETO
  async create(data: any): Promise<Patient> {
    // 🪄 1. INICIAMOS LA TRANSACCIÓN MÁGICA DE SEQUELIZE
    const t = await PatientModel.sequelize!.transaction();

    try {
      // 2. Crear usuario asociado a la transacción
      const newUser = await UserModel.create(data.userData, { transaction: t });

      // 3. Obtener el ID recién creado
      const idUsuarioGenerado = newUser.getDataValue('id_user') || (newUser as any).id;

      // 4. Crear paciente asociado a la transacción
      const patientDataToSave = {
        ...data.patientData,
        id_user: idUsuarioGenerado
      };

      const created = await PatientModel.create(patientDataToSave, { transaction: t });

      // 5. SI NADA FALLÓ, GUARDAMOS EN BASE DE DATOS DEFINITIVAMENTE
      await t.commit();
      return created.toJSON() as Patient;

    } catch (error) {
      // 💣 6. SI ALGO FALLÓ, HACEMOS ROLLBACK (Borra el usuario fantasma)
      await t.rollback();
      throw error; 
    }
  }

  // 🪄 MODIFICAMOS PARA RECIBIR EL OBJETO COMPLETO CON EL ID DEL FISIO
  async findAll(params: any): Promise<{ rows: Patient[]; count: number }> {
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    const idPhysio = params.id_physio; // <-- CANDADO DE SEGURIDAD

    const result = await PatientModel.findAndCountAll({ 
      limit, 
      offset,
      where: {
        id_physio: idPhysio // 🪄 SOLO TRAE PACIENTES DE ESTE FISIO
      },
      include: [
        { 
          model: UserModel, 
          attributes: ['email'] 
        }
      ]
    });
    
    return { rows: result.rows.map(r => r.toJSON() as Patient), count: result.count };
  }

  async findById(id: number): Promise<Patient | null> {
    const patient = await PatientModel.findByPk(id, {
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
    const normalized = email.trim().toLowerCase();
    const userRows = await sequelize.query<{ id_user: number }>(
      `SELECT id_user FROM users WHERE LOWER(TRIM(email)) = :normalized LIMIT 1`,
      { replacements: { normalized }, type: QueryTypes.SELECT }
    );
    const row = userRows[0];
    if (!row) return null;

    const patient = await PatientModel.findOne({
      where: { id_user: row.id_user },
      include: [{ model: UserModel, attributes: ["email"] }],
    });
    return patient ? patient.get({ plain: true }) : null;
  }
}