import { Request, Response } from "express";
// 1. SOLUCIÓN: Importamos UpdatePatientSchema
import { PatientSchema, UpdatePatientSchema } from "../../../application/dtos/schemas";

export class PatientController {
  constructor(
    private readonly createPatient: any,
    private readonly listPatients: any,
    private readonly updatePatient: any
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = PatientSchema.parse(req.body);
      const patient = await this.createPatient.execute(validatedData);
      res.status(201).json({ success: true, data: patient });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ success: false, message: "Error de validación de formato", errors: error.errors });
        return;
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        const campoDuplicado = error.errors[0]?.path || "desconocido";
        res.status(409).json({ success: false, message: `El registro ya existe. El campo '${campoDuplicado}' está duplicado.` });
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

      const result = await this.listPatients.execute({ limit, offset });
      res.status(200).json({ success: true, page, limit, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // 2. SOLUCIÓN: Definimos explícitamente <{ id: string }> en el Request
  update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const patientId = parseInt(req.params.id);
      if (isNaN(patientId)) {
        res.status(400).json({ success: false, message: "El ID del paciente debe ser un número válido." });
        return;
      }

      const validatedData = UpdatePatientSchema.parse(req.body);

      const updatedPatient = await this.updatePatient.execute(patientId, validatedData);

      if (!updatedPatient) {
        res.status(404).json({ success: false, message: "Paciente no encontrado." });
        return;
      }

      res.status(200).json({ success: true, data: updatedPatient });
    } catch (error: any) {
      if (error.errors) {
        res.status(400).json({ success: false, message: "Error de validación", errors: error.errors });
        return;
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(409).json({ success: false, message: "El correo electrónico ingresado ya está en uso por otro paciente." });
        return;
      }
      res.status(500).json({ success: false, message: error.message });
    }
  };
} // <-- ESTA ES LA ÚNICA LLAVE QUE CIERRA LA CLASE AL FINAL