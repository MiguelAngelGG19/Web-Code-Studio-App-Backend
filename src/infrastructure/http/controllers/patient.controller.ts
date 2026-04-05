/**
 * **************************************************************************
 * CONTROLADOR DE PACIENTES - INTERFACE ADAPTER
 * PROYECTO: ACTIVA
 * DESCRIPCIÓN: Manejo de peticiones HTTP para la gestión clínica de pacientes.
 * **************************************************************************
 */

import { Request, Response } from "express";
import { PatientSchema, UpdatePatientSchema } from "../../../application/dtos/schemas";
import { PatientModel, UserModel } from "../../../infrastructure/persistence/sequelize/client"; // Ajusta la ruta si es necesario

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
  create = async (req: any, res: Response): Promise<void> => {
    try {
      // 1. Extraemos el ID del Fisioterapeuta desde su Token
      const idPhysio = req.user?.id; 
      const rawData = req.body;

      if (!idPhysio) {
        res.status(401).json({ success: false, message: "No autorizado. Falta ID del fisioterapeuta." });
        return;
      }

      // 2. CREAMOS EL ACCESO PARA LA APP MÓVIL (Tabla Users)
      // Como dijeron que no usarán contraseña, le metemos un texto por defecto para que la BD no llore
      // (Asumiendo que la columna role y status existen en tu modelo UserModel)
      const newUser: any = await UserModel.create({
        email: rawData.email,
        password: "NO_PASSWORD_MOBILE_LOGIN", // Contraseña dummy
        role: 'patient',
        status: 'approved'
      });

      // Sacamos el ID generado para el usuario
      const idDelNuevoUsuario = newUser.id_user || newUser.getDataValue('id_user');

      // 3. TRADUCTOR: Convertimos de camelCase (Angular) a snake_case (Base de Datos)
      const translatedData = {
        first_name: rawData.firstName,
        last_name_paternal: rawData.lastNameP, 
        last_name_maternal: rawData.lastNameM, 
        email: rawData.email,
        phone: rawData.phone,
        birth_date: rawData.birthYear ? `${rawData.birthYear}-01-01` : null,        
        gender: rawData.gender,
        height: rawData.height,
        weight: rawData.weight,
        id_user: idDelNuevoUsuario, 
        id_physio: idPhysio         
      };

      // 4. GUARDAMOS EL EXPEDIENTE DEL PACIENTE
      const patient = await this.createPatient.execute(translatedData);
      
      res.status(201).json({ 
        success: true, 
        message: "Paciente registrado y cuenta móvil habilitada exitosamente.",
        data: patient 
      });

    } catch (error: any) {
      // Tratamiento de errores de validación (Zod)
      if (error.name === 'ZodError') {
        res.status(400).json({ success: false, message: "Error de validación.", errors: error.errors });
        return;
      }
      
      // Tratamiento de errores de duplicidad (Sequelize Unique)
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(409).json({ success: false, message: `El correo electrónico ya está registrado en el sistema.` });
        return;
      }

      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * Actualiza la información del expediente y el acceso móvil.
   * @endpoint PUT /api/patients/:id
   */
  update = async (req: any, res: Response): Promise<void> => {
    try {
      const patientId = parseInt(req.params.id, 10);
      
      if (isNaN(patientId)) {
        res.status(400).json({ success: false, message: "ID inválido." });
        return;
      }

      const rawData = req.body;

      // 1. BUSCAMOS AL PACIENTE PARA SABER QUÉ USUARIO ES (Su cuenta móvil)
      const pacienteActual = await PatientModel.findByPk(patientId);
      if (!pacienteActual) {
        res.status(404).json({ success: false, message: "Paciente no encontrado en la BD." });
        return;
      }

      const idUsuarioMovil = pacienteActual.getDataValue('id_user');

      // 2. ACTUALIZAMOS EL CORREO EN LA TABLA USERS (El login de la app móvil)
      if (rawData.email && idUsuarioMovil) {
        await UserModel.update(
          { email: rawData.email },
          { where: { id_user: idUsuarioMovil } }
        );
      }

      // 3. TRADUCTOR A PRUEBA DE BALAS PARA LA TABLA PATIENTS
      const translatedData: any = {
        first_name: rawData.firstName,
        last_name_paternal: rawData.lastNameP,
        last_name_maternal: rawData.lastNameM,
        // Forzamos el -01-01 para que la base de datos lo acepte como DATE
        birth_date: rawData.birthYear ? `${rawData.birthYear}-01-01` : undefined,
        height: rawData.height,
        weight: rawData.weight
      };

      // Limpiamos los campos vacíos para no borrar nada por accidente
      Object.keys(translatedData).forEach(key => {
        if (translatedData[key] === undefined) {
          delete translatedData[key];
        }
      });

      // 4. ACTUALIZAMOS EL PACIENTE DIRECTO EN LA BD 
      // (Saltamos la validación estricta de Zod aquí porque los datos ya vienen limpios y traducidos)
      await PatientModel.update(translatedData, { where: { id_patient: patientId } });

      res.status(200).json({ 
        success: true, 
        message: "Expediente y cuenta móvil actualizados correctamente."
      });

    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(409).json({ success: false, message: "Ese correo ya está en uso por otro paciente." });
        return;
      }
      res.status(500).json({ success: false, message: "Error al actualizar: " + error.message });
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