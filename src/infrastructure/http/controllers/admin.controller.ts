import { Request, Response } from "express";
import { GetAdminOverviewUseCase } from "../../../application/use-cases/GetAdminOverview.uc";

export class AdminController {
  constructor(private readonly getAdminOverview: GetAdminOverviewUseCase) {}

  getOverview = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.getAdminOverview.execute();
      res.status(200).json({ success: true, ...data });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || "Error al obtener el resumen administrativo.",
      });
    }
  };
}
