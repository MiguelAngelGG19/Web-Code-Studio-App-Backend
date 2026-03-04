import { TrackingRepository } from "../ports/out/TrackingRepository";
import { CreateTrackingDTO } from "../dtos/tracking.dto";

export class RegisterPainLevelUseCase {
  constructor(private readonly trackingRepository: TrackingRepository) {}

  async execute(data: CreateTrackingDTO) {
    // Si el nivel de dolor es mayor a 7, activamos la alerta automáticamente
    if (data.painLevel >= 7) {
      data.alert = 1;
    } else {
      data.alert = 0;
    }
    return await this.trackingRepository.create(data);
  }
}