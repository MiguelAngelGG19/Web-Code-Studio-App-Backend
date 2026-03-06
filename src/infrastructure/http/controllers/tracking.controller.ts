/**
 * **************************************************************************
 * CONTROLADOR DE SEGUIMIENTO (TRACKING) - INTERFACE ADAPTER
 * PROYECTO: ACTIVA
 * DESCRIPCIÓN: Gestión de reportes de dolor y alertas de pacientes.
 * **************************************************************************
 */

import { Request, Response } from "express";
import { TrackingSchema } from "../../../application/dtos/schemas";

/**
 * Clase controladora para la entidad Tracking.
 * Gestiona el registro de la Escala Visual Analógica (EVA) enviada por los pacientes.
 */
export class TrackingController {
  
  /**
   * Constructor: Inyecta el Caso de Uso del dominio (Inyección de Dependencias).
   * @param registerPainLevel Caso de uso que procesa el nivel de dolor y genera alertas automáticas.
   */
  constructor(private readonly registerPainLevel: any) {}

  // ============================================================
  // 1. OPERACIONES DE ESCRITURA (COMMANDS)
  // ============================================================

  /**
   * Registra el nivel de dolor y observaciones tras finalizar una rutina.
   * Si el nivel de dolor es >= 7, el sistema marcará el registro con una alerta.
   * @endpoint POST /api/tracking
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validación estricta del esquema de seguimiento (Zod)
      const validatedData = TrackingSchema.parse(req.body);
      
      // Ejecución de la lógica de negocio
      const tracking = await this.registerPainLevel.execute(validatedData);
      
      res.status(201).json({ 
        success: true, 
        message: "Reporte de molestias registrado exitosamente.",
        data: tracking 
      });
    } catch (error: any) {
      // Manejo de errores de validación de formato (Zod)
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          success: false, 
          message: "Los datos del reporte de dolor no cumplen con el formato requerido.", 
          errors: error.errors 
        });
        return;
      }
      
      // Errores generales de lógica de negocio o base de datos
      res.status(400).json({ 
        success: false, 
        message: error.message || "No se pudo procesar el registro de seguimiento." 
      });
    }
  };
}