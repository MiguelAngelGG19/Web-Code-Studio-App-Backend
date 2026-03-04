import { PhysiotherapistRepository } from "../ports/out/PhysiotherapistRepository";
import { Physiotherapist } from "../../domain/entities/Physiotherapist";

export class GetPhysiotherapistByIdUseCase {
  constructor(private readonly physioRepository: PhysiotherapistRepository) {}

  async execute(id: number): Promise<Physiotherapist | null> {
    return await this.physioRepository.findById(id);
  }
}