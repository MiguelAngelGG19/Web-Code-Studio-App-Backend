import { IAuthRepository } from "../../../application/ports/IAuthRepository";
// IMPORTANTE: Añadí 'sequelize' a la importación. Si tu conexión no se exporta desde 'client',
// asegúrate de importarla desde tu archivo de configuración de base de datos (ej. database.ts)
import { PhysiotherapistModel, UserModel, sequelize } from "../sequelize/client";
import bcrypt from "bcrypt";

export class SequelizeAuthRepository implements IAuthRepository {

  async findByEmail(email: string): Promise<any | null> {
    // El email está en UserModel, no en PhysiotherapistModel
    const user = await UserModel.findOne({ where: { email } });
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
      //const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await UserModel.create({
        email:    data.email,
        password: data.password, // <-- Guardamos la contraseña sin encriptar para que bcrypt pueda compararla después
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
}