import { SequelizeDashboardRepository } from "../../infrastructure/persistence/repositories/SequelizeDashboardRepository";

export class GetDashboardStatsUseCase {
  constructor(private dashboardRepo: SequelizeDashboardRepository) {}

  async execute(idPhysio: number): Promise<any> {
    if (!idPhysio) {
      throw new Error("No se pudo identificar al fisioterapeuta.");
    }
    
    // Aquí el caso de uso solo llama al repositorio que hace el trabajo pesado
    return await this.dashboardRepo.getDashboardData(idPhysio);
  }
}