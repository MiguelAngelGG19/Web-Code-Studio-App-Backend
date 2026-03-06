/**
 * **************************************************************************
 * CONTROLADOR DE EJERCICIOS - INTERFACE ADAPTER
 * PROYECTO: ACTIVA
 * DESCRIPCIÓN: Gestión del catálogo multimedia de ejercicios de rehabilitación.
 * **************************************************************************
 */

import { Request, Response } from "express";
import { ExerciseSchema } from "../../../application/dtos/schemas";

/**
 * Clase controladora para la entidad Ejercicio.
 * Gestiona el banco de datos de ejercicios disponibles para los fisioterapeutas.
 */
export class ExerciseController {
  
  /**
   * Constructor: Inyecta los Casos de Uso del dominio (Inyección de Dependencias).
   * @param createExercise Caso de uso para dar de alta nuevos ejercicios.
   * @param listExercises Caso de uso para la recuperación paginada del catálogo.
   * @param getExerciseById Caso de uso para obtener la ficha técnica de un ejercicio.
   */
  constructor(
    private readonly createExercise: any, 
    private readonly listExercises: any,
    private readonly getExerciseById: any
  ) {}

  // ============================================================
  // 1. OPERACIONES DE ESCRITURA (COMMANDS)
  // ============================================================

  /**
   * Agrega un nuevo ejercicio al catálogo global del sistema.
   * @endpoint POST /api/exercises
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validación estricta con Zod (Esquema definido en DTOs)
      const validatedData = ExerciseSchema.parse(req.body);
      const exercise = await this.createExercise.execute(validatedData);
      
      res.status(201).json({ 
        success: true, 
        message: "Ejercicio añadido correctamente al catálogo.",
        data: exercise 
      });
    } catch (error: any) {
      // Captura de errores de validación de formato
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          success: false, 
          message: "Datos del ejercicio inválidos.", 
          errors: error.errors 
        });
        return;
      }
      
      // Captura de duplicidad de nombres (Nombre de ejercicio debe ser único)
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(409).json({ 
          success: false, 
          message: "Ya existe un ejercicio registrado con ese nombre." 
        });
        return;
      }

      res.status(400).json({ success: false, message: error.message });
    }
  };

  // ============================================================
  // 2. OPERACIONES DE LECTURA (QUERIES)
  // ============================================================

  /**
   * Recupera el catálogo de ejercicios con soporte para paginación.
   * @endpoint GET /api/exercises
   */
  list = async (req: Request, res: Response): Promise<void> => {
    try {
      // Configuración de límites y saltos para el scroll infinito o tablas
      const limit = Math.min(Number(req.query.limit ?? 20), 100);
      const page = Math.max(Number(req.query.page ?? 1), 1);
      const offset = (page - 1) * limit;

      const result = await this.listExercises.execute({ limit, offset });
      
      res.status(200).json({ 
        success: true, 
        page, 
        limit, 
        total: result.count, // Facilita la lógica de paginación en el Frontend
        rows: result.rows 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error al recuperar el banco de ejercicios." });
    }
  };

  /**
   * Obtiene la ficha técnica completa de un ejercicio por su ID.
   * Útil para mostrar videos y descripciones detalladas en la App móvil.
   * @endpoint GET /api/exercises/:id
   */
  getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const exerciseId = parseInt(req.params.id, 10);
      
      if (isNaN(exerciseId)) {
        res.status(400).json({ success: false, message: "El ID proporcionado no es un identificador válido." });
        return;
      }

      const exercise = await this.getExerciseById.execute(exerciseId);

      if (!exercise) {
        res.status(404).json({ success: false, message: "El ejercicio solicitado no existe." });
        return;
      }

      res.status(200).json({ success: true, data: exercise });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}