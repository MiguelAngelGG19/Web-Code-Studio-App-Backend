/**
 * **************************************************************************
 * CONTROLADOR DE PACIENTES - INTERFACE ADAPTER
 * PROYECTO: ACTIVA
 * DESCRIPCIÓN: Manejo de peticiones HTTP para la gestión clínica de pacientes.
 * **************************************************************************
 */

import { Request, Response } from "express";
import { PatientSchema, UpdatePatientSchema } from "../../../application/dtos/schemas";

/**
 * Clase controladora para la entidad Paciente.
 * Centraliza la lógica de comunicación entre el protocolo HTTP y las reglas de negocio.
 */
export class PatientController {
  
  /**
   * Constructor: Inyecta los Casos de Uso del dominio (Inyección de Dependencias).
   * @param createPatient Caso de uso para el registro de nuevos pacientes.
   * @param listPatients Caso de uso para la recuperación masiva y paginada.
   * @param updatePatient Caso de uso para la edición de perfiles existentes.
   * @param getPatientById Caso de uso para la consulta de expedientes individuales.
   */
  constructor(
    private readonly createPatient: any,
    private readonly listPatients: any,
    private readonly updatePatient: any,
    private readonly getPatientById: any
  ) {}

  // ============================================================
  // 1. OPERACIONES DE ESCRITURA (COMMANDS)
  // ============================================================

  /**
   * Registra un nuevo paciente en la plataforma.
   * @endpoint POST /api/patients
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validación estricta del esquema de datos (Zod)
      const validatedData = PatientSchema.parse(req.body);
      const patient = await this.createPatient.execute(validatedData);
      
      res.status(201).json({ 
        success: true, 
        message: "Paciente registrado exitosamente.",
        data: patient 
      });
    } catch (error: any) {
      // Tratamiento de errores de validación (Zod)
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          success: false, 
          message: "Error de validación en los datos del paciente.", 
          errors: error.errors 
        });
        return;
      }
      
      // Tratamiento de errores de duplicidad (Sequelize Unique)
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path || "desconocido";
        res.status(409).json({ 
          success: false, 
          message: `El registro falló: el campo '${field}' ya se encuentra registrado.` 
        });
        return;
      }

      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * Actualiza la información del expediente de un paciente.
   * @endpoint PUT /api/patients/:id
   */
  update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const patientId = parseInt(req.params.id, 10);
      
      if (isNaN(patientId)) {
        res.status(400).json({ success: false, message: "Identificador de paciente no válido para actualización." });
        return;
      }

      // Validación parcial: solo los campos enviados deben cumplir las reglas
      const validatedData = UpdatePatientSchema.parse(req.body);
      const updatedPatient = await this.updatePatient.execute(patientId, validatedData);

      if (!updatedPatient) {
        res.status(404).json({ success: false, message: "No se encontró el paciente para actualizar." });
        return;
      }

      res.status(200).json({ 
        success: true, 
        message: "Información actualizada correctamente.",
        data: updatedPatient 
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ success: false, message: "Datos de actualización inválidos.", errors: error.errors });
        return;
      }
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(409).json({ success: false, message: "El correo electrónico ya pertenece a otro paciente." });
        return;
      }

      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ============================================================
  // 2. OPERACIONES DE LECTURA (QUERIES)
  // ============================================================

  /**
   * Obtiene la lista global de pacientes con soporte de paginación.
   * @endpoint GET /api/patients
   */
  list = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parámetros de paginación seguros
      const limit = Math.min(Number(req.query.limit ?? 20), 100);
      const page = Math.max(Number(req.query.page ?? 1), 1);
      const offset = (page - 1) * limit;

      const result = await this.listPatients.execute({ limit, offset });
      
      res.status(200).json({ 
        success: true, 
        page, 
        limit, 
        total: result.count,
        rows: result.rows 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error al recuperar el listado de pacientes." });
    }
  };

  /**
   * Recupera el expediente detallado de un paciente por su ID.
   * @endpoint GET /api/patients/:id
   */
  getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const patientId = parseInt(req.params.id, 10);
      
      if (isNaN(patientId)) {
        res.status(400).json({ success: false, message: "El ID proporcionado no es válido." });
        return;
      }

      const patient = await this.getPatientById.execute(patientId);

      if (!patient) {
        res.status(404).json({ success: false, message: "Expediente de paciente no encontrado." });
        return;
      }

      res.status(200).json({ success: true, data: patient });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}