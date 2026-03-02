import { Request, Response } from "express";
import { PatientSchema } from "../../../application/dtos/schemas";

export class PatientController {
  constructor(private readonly createPatient: any, private readonly listPatients: any) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = PatientSchema.parse(req.body);
      const patient = await this.createPatient.execute(validatedData);
      res.status(201).json({ success: true, data: patient });
    } catch (error: any) {
      // 1. Error de Formato (Zod)
      if (error.errors) {
        res.status(400).json({ success: false, message: "Error de validación de formato", errors: error.errors });
        return;
      }
      // 2. Error de Datos Duplicados (Sequelize)
      if (error.name === 'SequelizeUniqueConstraintError') {
        const campoDuplicado = error.errors[0]?.path || "desconocido";
        res.status(409).json({ success: false, message: `El registro ya existe. El campo '${campoDuplicado}' está duplicado.` });
        return;
      }
      // 3. Otros Errores (Ej. Llave foránea incorrecta)
      res.status(400).json({ success: false, message: error.message });
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = Math.min(Number(req.query.limit ?? 20), 100);
      const page = Math.max(Number(req.query.page ?? 1), 1);
      const offset = (page - 1) * limit;

      const result = await this.listPatients.execute({ limit, offset });
      res.status(200).json({ success: true, page, limit, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}