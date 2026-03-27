import { AppointmentModel, LogbookModel } from "../sequelize/client";

export class SequelizeAppointmentRepository {

  async create(data: any): Promise<any> {
    const appt = await AppointmentModel.create(data);
    return appt.toJSON();
  }

  async findById(id: number): Promise<any | null> {
    const appt = await AppointmentModel.findByPk(id);
    return appt ? appt.toJSON() : null;
  }

  async findByPatient(id_patient: number): Promise<any[]> {
    const appts = await AppointmentModel.findAll({ where: { id_patient } });
    return appts.map(a => a.toJSON());
  }

  async findByPhysio(id_physio: number): Promise<any[]> {
    const appts = await AppointmentModel.findAll({ where: { id_physio } });
    return appts.map(a => a.toJSON());
  }

  async update(id: number, data: any): Promise<any | null> {
    const [affected] = await AppointmentModel.update(data, { where: { id_appointment: id } });
    if (affected === 0) return null;
    const updated = await AppointmentModel.findByPk(id);
    return updated?.toJSON();
  }
}
