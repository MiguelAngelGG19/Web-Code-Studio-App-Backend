import { Request, Response } from "express";
import { ExerciseSchema } from "../../../application/dtos/schemas";

export class ExerciseController {
  constructor(private readonly createExercise: any, private readonly listExercises: any) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = ExerciseSchema.parse(req.body);
      const exercise = await this.createExercise.execute(validatedData);
      res.status(201).json({ success: true, data: exercise });
    } catch (error: any) {
      // SOLUCIÓN: Cambiamos error.errors por error.name === 'ZodError'
      if (error.name === 'ZodError') {
        res.status(400).json({ success: false, message: "Error de validación de formato", errors: error.errors });
        return;
      }
      // 2. Error de Datos Duplicados (Sequelize)
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(409).json({ success: false, message: `Ya existe un ejercicio registrado con este mismo nombre.` });
        return;
      }
      res.status(400).json({ success: false, message: error.message });
    }
  
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = Math.min(Number(req.query.limit ?? 20), 100);
      const page = Math.max(Number(req.query.page ?? 1), 1);
      const offset = (page - 1) * limit;

      const result = await this.listExercises.execute({ limit, offset });
      res.status(200).json({ success: true, page, limit, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}