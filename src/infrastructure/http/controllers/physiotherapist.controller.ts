import { Request, Response } from "express";
import { PhysiotherapistSchema } from "../../../application/dtos/schemas";

export class PhysiotherapistController {
  constructor(private readonly createPhysio: any) {}

 create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = PhysiotherapistSchema.parse(req.body);
      const physio = await this.createPhysio.execute(validatedData);
      res.status(201).json({ success: true, data: physio });
    } catch (error: any) {
      // SOLUCIÓN: Cambiamos error.errors por error.name === 'ZodError'
      if (error.name === 'ZodError') {
        res.status(400).json({ success: false, message: "Error de validación de formato", errors: error.errors });
        return;
      }
      // 2. Error de Datos Duplicados (Sequelize)
      if (error.name === 'SequelizeUniqueConstraintError') {
        const campoDuplicado = error.errors[0]?.path || "desconocido";
        res.status(409).json({ success: false, message: `No se puede registrar. El dato '${campoDuplicado}' (CURP o Cédula) ya pertenece a otro fisioterapeuta.` });
        return;
      }
      res.status(400).json({ success: false, message: error.message });
    }
  };
}
