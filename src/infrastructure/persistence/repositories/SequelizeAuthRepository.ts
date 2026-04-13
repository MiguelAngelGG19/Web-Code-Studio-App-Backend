import { QueryTypes } from "sequelize";
import { IAuthRepository } from "../../../application/ports/IAuthRepository";
import { PhysiotherapistModel, UserModel, sequelize } from "../sequelize/client";
import bcrypt from "bcrypt";

export class SequelizeAuthRepository implements IAuthRepository {

  async findByEmail(email: string): Promise<any | null> {
    const normalized = email.trim().toLowerCase();
    const rows = await sequelize.query<{ id_user: number }>(
      `SELECT id_user FROM users WHERE LOWER(TRIM(email)) = :normalized LIMIT 1`,
      { replacements: { normalized }, type: QueryTypes.SELECT }
    );
    const row = rows[0];
    if (!row) return null;
    const user = await UserModel.findByPk(row.id_user);
    return user ? user.get({ plain: true }) : null;
  }

  async register(data: {
    firstName: string;
    lastNameP: string;
    lastNameM: string;
    birthDate: string;
    email: string;
    password: string;
    professionalLicense: string;
    curp: string;
  }): Promise<any> {

    // 1. Iniciamos la transacción
    const t = await sequelize.transaction();

    try {
      // 2. Crear usuario base (VINCULADO A LA TRANSACCIÓN)
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await UserModel.create({
        email:    data.email,
        password: hashedPassword, 
        role:     "physio",
      }, { transaction: t }); // <-- Le pasamos la transacción aquí

      const userId = (user.get({ plain: true }) as any).id_user;

      // 3. Crear perfil de fisioterapeuta (VINCULADO A LA TRANSACCIÓN)
      const physio = await PhysiotherapistModel.create({
        first_name:           data.firstName,
        last_name_paternal:   data.lastNameP,
        last_name_maternal:   data.lastNameM,
        birth_date:           data.birthDate,
        professional_license: data.professionalLicense,
        curp:                 data.curp,
        status:               "pending_profile",
        id_user:              userId,
      }, { transaction: t }); // <-- Y le pasamos la transacción aquí

      // 4. Si TODO salió perfecto, confirmamos los cambios en MySQL
      await t.commit();

      return physio.get({ plain: true });

    } catch (error) {
      // 5. ROLLBACK MÁGICO: Si la CURP o Cédula ya existen (falla el paso 3),
      // esto deshace el paso 2 automáticamente y borra al usuario fantasma.
      await t.rollback();
      
      // 6. Lanzamos el error hacia arriba para que el Controller lo atrape y se lo mande a Angular
      throw error;
    }
  }
  // 🪄 NUEVOS MÉTODOS PARA ACTUALIZAR PERFIL
  async findById(idUser: number): Promise<any | null> {
    const user = await UserModel.findByPk(idUser);
    return user ? user.get({ plain: true }) : null;
  }

  async updateEmail(idUser: number, newEmail: string): Promise<void> {
    await UserModel.update({ email: newEmail }, { where: { id_user: idUser } });
  }

  async updatePassword(idUser: number, newPasswordHash: string): Promise<void> {
    await UserModel.update({ password: newPasswordHash }, { where: { id_user: idUser } });
  }
}