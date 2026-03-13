import { PhysiotherapistRepository } from "../ports/out/PhysiotherapistRepository";

export class ApprovePhysiotherapistUseCase {
  constructor(private readonly physioRepo: PhysiotherapistRepository) {}

  async execute(
    id: number,
    action: "activo" | "suspendido"
  ): Promise<{ message: string }> {

    const fisio = await this.physioRepo.findById(id);
    if (!fisio) {
      throw new Error("Fisioterapeuta no encontrado.");
    }

    await this.physioRepo.updateStatus(id, action);

    const msg = action === "activo"
      ? "Fisioterapeuta aprobado exitosamente."
      : "Fisioterapeuta suspendido.";

    return { message: msg };
  }
}
