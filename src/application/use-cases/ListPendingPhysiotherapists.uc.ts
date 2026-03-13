import { PhysiotherapistRepository } from "../ports/out/PhysiotherapistRepository";

export class ListPendingPhysiotherapistsUseCase {
  constructor(private readonly physioRepo: PhysiotherapistRepository) {}

  async execute(): Promise<any[]> {
    return await this.physioRepo.findByStatus("pendiente");
  }
}
