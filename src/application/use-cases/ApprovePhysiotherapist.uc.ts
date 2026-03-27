import { PhysiotherapistRepository } from "../ports/out/PhysiotherapistRepository";

export class ApprovePhysiotherapistUseCase {
  constructor(private readonly physioRepo: PhysiotherapistRepository) {}

  async execute(
    id: number,
    action: "approved" | "rejected"
  ): Promise<{ message: string }> {

    const fisio = await this.physioRepo.findById(id);
    if (!fisio) {
      throw new Error("Fisioterapeuta no encontrado.");
    }

    await this.physioRepo.updateStatus(id, action);

    const msg = action === "approved"
      ? "Fisioterapeuta aprobado exitosamente."
      : "Fisioterapeuta rechazado.";

    return { message: msg };
  }
}
