import { Request, Response } from "express";
import { GetDashboardStatsUseCase } from "../../../application/use-cases/GetDashboardStats.uc";

export class DashboardController {
  constructor(private getDashboardStatsUseCase: GetDashboardStatsUseCase) {
    this.getStats = this.getStats.bind(this);
  }

  async getStats(req: any, res: Response): Promise<void> {
    try {
      // Recuerda que tu token guarda el id_physio real
      const idPhysio = req.user.id_physio; 
      
      if (!idPhysio) {
        res.status(403).json({ message: "No tienes un perfil de fisioterapeuta asignado." });
        return;
      }

      const result = await this.getDashboardStatsUseCase.execute(idPhysio);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}