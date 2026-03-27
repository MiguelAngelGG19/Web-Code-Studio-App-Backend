import { IAuthRepository } from "../../../application/ports/IAuthRepository";
import { PhysiotherapistModel, UserModel } from "../sequelize/client";
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

    // 1. Crear usuario base
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await UserModel.create({
      email:    data.email,
      password: hashedPassword,
      role:     "physio",
    });

    const userId = (user.get({ plain: true }) as any).id_user;

    // 2. Crear perfil de fisioterapeuta
    const physio = await PhysiotherapistModel.create({
      first_name:           data.firstName,
      last_name_paternal:   data.lastNameP,
      last_name_maternal:   data.lastNameM,
      birth_date:           data.birthDate,
      professional_license: data.professionalLicense,
      curp:                 data.curp,
      status:               "pending_profile",
      id_user:              userId,
    });

    return physio.get({ plain: true });
  }
}
