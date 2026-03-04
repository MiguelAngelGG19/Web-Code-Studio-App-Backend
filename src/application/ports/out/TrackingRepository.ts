import { CreateTrackingDTO } from "../../dtos/tracking.dto";

export interface TrackingRepository {
  create(data: CreateTrackingDTO): Promise<any>;
}