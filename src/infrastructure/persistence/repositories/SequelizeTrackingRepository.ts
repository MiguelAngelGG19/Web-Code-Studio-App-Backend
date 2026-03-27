import { TrackingModel } from "../sequelize/client";

export class SequelizeTrackingRepository {

  async create(data: any): Promise<any> {
    const record = await TrackingModel.create(data);
    return record.toJSON();
  }

  async findByPatient(id_patient: number): Promise<any[]> {
    const records = await TrackingModel.findAll({ where: { id_patient } });
    return records.map(r => r.toJSON());
  }
}
