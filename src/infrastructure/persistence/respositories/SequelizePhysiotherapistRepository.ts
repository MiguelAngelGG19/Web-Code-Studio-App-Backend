import { PhysiotherapistModel } from "../models/Physiotherapist.model";

export class SequelizePhysiotherapistRepository {
  async create(data: {
    firstName: string;
    lastNameP: string;
    lastNameM: string | null;
    birthYear: number | null;
    professionalLicense: string | null;
    curp: string | null;
  }) {
    const created = await PhysiotherapistModel.create({
      first_name: data.firstName,
      last_name_p: data.lastNameP,
      last_name_m: data.lastNameM,
      birth_year: data.birthYear,
      professional_license: data.professionalLicense,
      curp: data.curp,
    });

    return {
      id: created.get("idFisioterapeuta"),
      firstName: created.get("first_name"),
      lastNameP: created.get("last_name_p"),
      lastNameM: created.get("last_name_m"),
      birthYear: created.get("birth_year"),
      professionalLicense: created.get("professional_license"),
      curp: created.get("curp"),
      createdAt: created.get("created_at"),
    };
  }
}