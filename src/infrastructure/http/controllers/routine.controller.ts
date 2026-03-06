import { Request, Response } from "express";
import { RoutineSchema } from "../../../application/dtos/schemas";

export class RoutineController {
  constructor(
    private readonly createRoutine: any,
    private readonly getPatientRoutine: any,
    private readonly getRoutineById: any,
    private readonly getPatientRoutineHistory: any
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = RoutineSchema.parse(req.body);
      const routine = await this.createRoutine.execute(validatedData);
      res.status(201).json({ success: true, data: routine });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ success: false, message: "Error de validación", errors: error.errors });
        return;
      }
      // Error de nuestra regla de negocio de fechas
      res.status(400).json({ success: false, message: error.message });
    }
  };

  // SOLUCIÓN AL ERROR: Añadimos <{ patientId: string }> al lado de Request
  getByPatient = async (req: Request<{ patientId: string }>, res: Response): Promise<void> => {
    try {
      const patientId = parseInt(req.params.patientId, 10);
      if (isNaN(patientId)) {
        res.status(400).json({ success: false, message: "ID de paciente inválido" });
        return;
      }

      const routine = await this.getPatientRoutine.execute(patientId);
      res.status(200).json({ success: true, data: routine });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  };

  // NUEVO: Método para obtener rutina por su ID
  getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const routineId = parseInt(req.params.id, 10);
      if (isNaN(routineId)) {
        res.status(400).json({ success: false, message: "ID de rutina inválido." });
        return;
      }

      const routine = await this.getRoutineById.execute(routineId);
      res.status(200).json({ success: true, data: routine });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  };

   // NUEVO: Método para obtener el historial
  getHistoryByPatient = async (req: Request<{ patientId: string }>, res: Response): Promise<void> => {
    try {
      const patientId = parseInt(req.params.patientId, 10);
      if (isNaN(patientId)) {
        res.status(400).json({ success: false, message: "ID de paciente inválido" });
        return;
      }

      const history = await this.getPatientRoutineHistory.execute(patientId);
      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}