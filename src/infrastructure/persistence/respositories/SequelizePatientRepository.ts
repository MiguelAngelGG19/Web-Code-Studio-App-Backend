import { PatientModel } from "../models/Patient.model";

export class SequelizePatientRepository {
  async create(data: {
    firstName: string;
    lastNameP: string;
    lastNameM: string | null;
    birthYear: number | null;
    sex: string | null;
    height: number | null;
    weight: number | null;
    physiotherapistId: number;
  }) {
    const created = await PatientModel.create({
      first_name: data.firstName,
      last_name_p: data.lastNameP,
      last_name_m: data.lastNameM,
      birth_year: data.birthYear,
      sex: data.sex,
      height: data.height,
      weight: data.weight,
      physiotherapist_id: data.physiotherapistId,
    });

    return {
      id: created.get("idPaciente"),
      firstName: created.get("first_name"),
      lastNameP: created.get("last_name_p"),
      lastNameM: created.get("last_name_m"),
      birthYear: created.get("birth_year"),
      sex: created.get("sex"),
      height: created.get("height"),
      weight: created.get("weight"),
      createdAt: created.get("created_at"),
      physiotherapistId: created.get("physiotherapist_id"),
    };
  }

  async list({ limit, offset }: { limit: number; offset: number }) {
    const { rows, count } = await PatientModel.findAndCountAll({
      limit,
      offset,
      order: [["idPaciente", "DESC"]],
    });

    return {
      total: count,
      items: rows.map((r) => ({
        id: r.get("idPaciente"),
        firstName: r.get("first_name"),
        lastNameP: r.get("last_name_p"),
        lastNameM: r.get("last_name_m"),
        birthYear: r.get("birth_year"),
        sex: r.get("sex"),
        height: r.get("height"),
        weight: r.get("weight"),
        createdAt: r.get("created_at"),
        physiotherapistId: r.get("physiotherapist_id"),
      })),
    };
  }
}