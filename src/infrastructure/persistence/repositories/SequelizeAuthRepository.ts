import { IAuthRepository } from "../../../application/ports/IAuthRepository";
import { PhysiotherapistModel } from "../sequelize/client";

export class SequelizeAuthRepository implements IAuthRepository {

  async findByEmail(email: string): Promise<any | null> {
    const fisio = await PhysiotherapistModel.findOne({
      where: { email }
    });
    return fisio ? fisio.get({ plain: true }) : null;
  }

  async register(data: {
    firstName: string;
    lastNameP: string;
    lastNameM: string;
    birthYear: number;
    email: string;
    password: string;
    professionalLicense: string;
    curp: string;
  }): Promise<any> {
    const nuevo = await PhysiotherapistModel.create({
      firstName:           data.firstName,
      lastNameP:           data.lastNameP,
      lastNameM:           data.lastNameM,
      birthYear:           data.birthYear,
      email:               data.email,
      password:            data.password,
      professionalLicense: data.professionalLicense,
      curp:                data.curp,
      status:              "activo",
      emailVerified:       true,
    });
    return nuevo.get({ plain: true });
  }
}
