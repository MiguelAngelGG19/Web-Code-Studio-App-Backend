import { TrackingModel } from "../sequelize/client";

export class SequelizeTrackingRepository {

  async create(data: any): Promise<any> {
    const record = await TrackingModel.create({
      date: data.date,
      pain_level: data.painLevel,
      feedback: data.postObservations,
      id_routine: data.routineId,
      id_patient: data.patientId,
      // id_exercise is now nullable
    });
    return record.toJSON();
  }

  async findByPatient(id_patient: number): Promise<any[]> {
    const records = await TrackingModel.findAll({ where: { id_patient } });
    return records.map(r => r.toJSON());
  }
}
