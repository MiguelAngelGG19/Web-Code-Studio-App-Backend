/**
 * **************************************************************************
 * CONTROLADOR DE RUTINAS - INTERFACE ADAPTER
 * PROYECTO: ACTIVA
 * DESCRIPCIÓN: Manejo de peticiones HTTP relacionadas con la gestión de rutinas.
 * **************************************************************************
 */

import { Request, Response } from "express";
import { RoutineSchema } from "../../../application/dtos/schemas";
import { AddExercisesToRoutineUseCase } from "../../../application/use-cases/AddExercisesToRoutine.uc";

/**
 * Clase controladora para la entidad Rutina.
 * Orquesta la comunicación entre las peticiones HTTP y los Casos de Uso del negocio.
 */
export class RoutineController {
  
  /**
   * Constructor: Inyecta los Casos de Uso necesarios (Inyección de Dependencias).
   * @param createRoutine Caso de uso para asignación de nuevas rutinas transaccionales.
   * @param getPatientRoutine Caso de uso para obtener la rutina activa vigente de un paciente.
   * @param getRoutineById Caso de uso para obtener el detalle de una rutina específica por su ID.
   * @param getPatientRoutineHistory Caso de uso para obtener el historial clínico de rutinas.
   */
  constructor(
    private readonly createRoutine: any,
    private readonly getPatientRoutine: any,
    private readonly getRoutineById: any,
    private readonly getPatientRoutineHistory: any,
    private readonly addExercisesToRoutine: AddExercisesToRoutineUseCase,
    private readonly createRoutineTemplate: any,
    private readonly listRoutineTemplates: any,
    private readonly getRoutineTemplateById: any,
  ) {}

  // ============================================================
  // 1. OPERACIONES DE ESCRITURA (COMMANDS)
  // ============================================================

  /**
   * Crea una nueva rutina y vincula la lista de ejercicios seleccionados.
   * @endpoint POST /api/routines
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validación de integridad de datos con Zod
      const validatedData = RoutineSchema.parse(req.body);
      
      // Ejecución de la lógica de negocio (Involucra transacción en BD)
      const routine = await this.createRoutine.execute(validatedData);
      
      res.status(201).json({ 
        success: true, 
        message: "Rutina asignada exitosamente al paciente.",
        data: routine 
      });
    } catch (error: any) {
      // Captura de errores de validación de esquema
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          success: false, 
          message: "Datos de rutina inválidos o incompletos.", 
          errors: error.errors 
        });
        return;
      }
      // Errores de lógica de negocio (ej. fechas inválidas)
      res.status(400).json({ success: false, message: error.message });
    }
  };

  // ============================================================
  // 2. OPERACIONES DE LECTURA (QUERIES)
  // ============================================================

  /**
   * Recupera la rutina activa que el paciente debe realizar actualmente.
   * @endpoint GET /api/routines/patient/:patientId
   */
  getByPatient = async (req: Request<{ patientId: string }>, res: Response): Promise<void> => {
    try {
      const patientId = parseInt(req.params.patientId, 10);
      
      if (isNaN(patientId)) {
        res.status(400).json({ success: false, message: "El ID del paciente debe ser un valor numérico." });
        return;
      }

      const routine = await this.getPatientRoutine.execute(patientId);
      res.status(200).json({ success: true, data: routine });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  };

  /**
   * Obtiene el detalle técnico de una rutina específica (Histórica o Actual).
   * @endpoint GET /api/routines/:id
   */
  getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const routineId = parseInt(req.params.id, 10);
      
      if (isNaN(routineId)) {
        res.status(400).json({ success: false, message: "El identificador de rutina no es válido." });
        return;
      }

      const routine = await this.getRoutineById.execute(routineId);
      res.status(200).json({ success: true, data: routine });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  };

  /**
   * Recupera la cronología completa de rutinas asignadas a un paciente.
   * @endpoint GET /api/routines/history/patient/:patientId
   */
  getHistoryByPatient = async (req: Request<{ patientId: string }>, res: Response): Promise<void> => {
    try {
      const patientId = parseInt(req.params.patientId, 10);
      
      if (isNaN(patientId)) {
        res.status(400).json({ success: false, message: "ID de paciente inválido para consulta de historial." });
        return;
      }

      const history = await this.getPatientRoutineHistory.execute(patientId);
      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error interno al recuperar el historial clínico." });
    }
  };

  /**
   * Añade uno o más ejercicios a una rutina existente.
   * @endpoint PUT /api/routines/:id
   */
  update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const routineId = parseInt(req.params.id, 10);
      if (isNaN(routineId)) {
        res.status(400).json({ success: false, message: "ID de rutina inválido." });
        return;
      }

      const { exerciseIds } = req.body;
      if (!Array.isArray(exerciseIds) || exerciseIds.length === 0) {
        res.status(400).json({ success: false, message: "Se requiere un arreglo 'exerciseIds' no vacío." });
        return;
      }

      const updated = await this.addExercisesToRoutine.execute(routineId, exerciseIds);
      res.status(200).json({ success: true, message: "Ejercicios añadidos a la rutina.", data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * Convierte una rutina existente en plantilla reusable.
   * @endpoint POST /api/routines/:id/template
   */
  saveAsTemplate = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const routineId = parseInt(req.params.id, 10);
      if (isNaN(routineId)) {
        res.status(400).json({ success: false, message: "ID de rutina inválido." });
        return;
      }

      const physiotherapistId = Number(req.body?.physiotherapistId);
      if (!physiotherapistId) {
        res.status(400).json({ success: false, message: "Se requiere physiotherapistId para crear plantilla." });
        return;
      }

      const template = await this.createRoutineTemplate.execute({
        routineId,
        physiotherapistId,
        name: req.body?.name,
        tag: req.body?.tag,
      });

      res.status(201).json({ success: true, message: "Plantilla guardada exitosamente.", data: template });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * Lista plantillas de un fisioterapeuta.
   * @endpoint GET /api/routines/templates?physiotherapistId=1&tag=Columna
   */
  listTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const physiotherapistId = Number(req.query?.physiotherapistId);
      if (!physiotherapistId) {
        res.status(400).json({ success: false, message: "Se requiere query physiotherapistId." });
        return;
      }

      const tag = req.query?.tag ? String(req.query.tag) : undefined;
      const templates = await this.listRoutineTemplates.execute(physiotherapistId, tag);
      res.status(200).json({ success: true, data: templates });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * Detalle de plantilla por ID.
   * @endpoint GET /api/routines/templates/:id
   */
  getTemplateById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const templateId = parseInt(req.params.id, 10);
      if (isNaN(templateId)) {
        res.status(400).json({ success: false, message: "ID de plantilla inválido." });
        return;
      }

      const template = await this.getRoutineTemplateById.execute(templateId);
      res.status(200).json({ success: true, data: template });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  };
}