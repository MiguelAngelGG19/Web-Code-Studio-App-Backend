import { NotificationModel } from "../sequelize/client";

export class SequelizeNotificationRepository {

  async create(data: any): Promise<any> {
    const notif = await NotificationModel.create(data);
    return notif.toJSON();
  }

  async findByPatient(id_patient: number): Promise<any[]> {
    const notifs = await NotificationModel.findAll({ where: { id_patient } });
    return notifs.map(n => n.toJSON());
  }

  async markAsRead(id: number): Promise<void> {
    await NotificationModel.update({ is_read: 1 }, { where: { id_notification: id } });
  }
}
