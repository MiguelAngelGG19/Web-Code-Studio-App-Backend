import { LogbookModel } from "../sequelize/client";

export class SequelizeLogbookRepository {

  async create(data: any): Promise<any> {
    const entry = await LogbookModel.create(data);
    return entry.toJSON();
  }

  async findByAppointment(id_appointment: number): Promise<any | null> {
    const entry = await LogbookModel.findOne({ where: { id_appointment } });
    return entry ? entry.toJSON() : null;
  }

  async update(id: number, data: any): Promise<any | null> {
    const [affected] = await LogbookModel.update(data, { where: { id_logbook: id } });
    if (affected === 0) return null;
    const updated = await LogbookModel.findByPk(id);
    return updated?.toJSON();
  }
}
