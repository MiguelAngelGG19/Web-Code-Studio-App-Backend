import { TrackingRepository } from "../../../application/ports/out/TrackingRepository";
import { CreateTrackingDTO } from "../../../application/dtos/tracking.dto";
import { TrackingModel } from "../sequelize/client";

export class SequelizeTrackingRepository implements TrackingRepository {
  async create(data: CreateTrackingDTO): Promise<any> {
    const created = await TrackingModel.create(data as any);
    return created.toJSON();
  }
}
