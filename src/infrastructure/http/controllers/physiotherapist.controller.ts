/**
 * **************************************************************************
 * CONTROLADOR DE FISIOTERAPEUTAS - INTERFACE ADAPTER
 * PROYECTO: ACTIVA
 * DESCRIPCIÓN: Manejo de peticiones HTTP para la gestión de especialistas médicos.
 * **************************************************************************
 */

import { Request, Response } from "express";
import { PhysiotherapistSchema } from "../../../application/dtos/schemas";
import { ApprovePhysiotherapistUseCase } from "../../../application/use-cases/ApprovePhysiotherapist.uc";
import { ListPendingPhysiotherapistsUseCase } from "../../../application/use-cases/ListPendingPhysiotherapists.uc";


/**
 * Clase controladora para la entidad Fisioterapeuta.
 * Actúa como puente entre las peticiones de la Plataforma Web y la lógica de negocio.
 */
export class PhysiotherapistController {
  
  /**
   * Constructor: Inyecta los Casos de Uso del dominio (Inyección de Dependencias).
   * @param createPhysio Caso de uso para el registro inicial de especialistas.
   * @param getPhysioById Caso de uso para recuperar el perfil profesional.
   */
  constructor(
    private readonly createPhysio: any,
    private readonly getPhysioById: any,
    private readonly approveUseCase:      ApprovePhysiotherapistUseCase,      // ← nuevo
  private readonly listPendingUseCase:  ListPendingPhysiotherapistsUseCase // ← nuevo
  ) {}

  // ============================================================
  // 1. OPERACIONES DE ESCRITURA (COMMANDS)
  // ============================================================

  /**
   * Registra un nuevo especialista en la plataforma.
   * @endpoint POST /api/physiotherapists
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validación de integridad de datos (Zod)
      const validatedData = PhysiotherapistSchema.parse(req.body);
      
      // Ejecución de lógica de negocio (Incluye encriptación de contraseña)
      const physio = await this.createPhysio.execute(validatedData);
      
      res.status(201).json({ 
        success: true, 
        message: "Especialista registrado correctamente.",
        data: physio 
      });
    } catch (error: any) {
      // Manejo de errores de validación de formato
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          success: false, 
          message: "Datos de registro inválidos.", 
          errors: error.errors 
        });
        return;
      }
      
      // Manejo de errores de unicidad (Cédula o CURP duplicados)
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path || "desconocido";
        res.status(409).json({ 
          success: false, 
          message: `Conflicto de identidad: El dato en el campo '${field}' ya se encuentra registrado.` 
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
   * Recupera el perfil completo de un fisioterapeuta.
   * @endpoint GET /api/physiotherapists/:id
   */
  getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const physioId = parseInt(req.params.id, 10);
      
      if (isNaN(physioId)) {
        res.status(400).json({ success: false, message: "El ID proporcionado no es un valor numérico válido." });
        return;
      }

      const physio = await this.getPhysioById.execute(physioId);

      if (!physio) {
        res.status(404).json({ success: false, message: "Especialista no encontrado en el sistema." });
        return;
      }

      res.status(200).json({ success: true, data: physio });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error interno al recuperar el perfil." });
    }
  };
  approve = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { action } = req.body; // "approved" o "rejected"

    if (action !== "approved" && action !== "rejected") {
      res.status(400).json({ message: "Acción inválida. Usa 'approved' o 'rejected'." });
      return;
    }

    const result = await this.approveUseCase.execute(id, action as "approved" | "rejected");
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};



listPending = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await this.listPendingUseCase.execute();
    res.status(200).json({ success: true, rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

}