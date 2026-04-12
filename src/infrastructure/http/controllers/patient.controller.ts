/**
 * **************************************************************************
 * CONTROLADOR DE PACIENTES - INTERFACE ADAPTER
 * PROYECTO: ACTIVA
 * DESCRIPCIÓN: Manejo de peticiones HTTP para la gestión clínica de pacientes.
 * **************************************************************************
 */

import { Request, Response } from "express";
import { PatientModel, UserModel, PhysiotherapistModel } from "../../../infrastructure/persistence/sequelize/client"; 

export class PatientController {
  
  constructor(
    private readonly createPatient: any,
    private readonly listPatients: any,
    private readonly updatePatient: any,
    private readonly getPatientById: any
  ) {}

  // ============================================================
  // 1. OPERACIONES DE ESCRITURA (COMMANDS)
  // ============================================================

  create = async (req: any, res: Response): Promise<void> => {
    try {
      // 1. Extraemos el ID de usuario del Token
      const userIdFromToken = req.user?.id || req.user?.id_user; 
      const rawData = req.body;

      if (!userIdFromToken) {
        res.status(401).json({ success: false, message: "No autorizado. Falta token válido." });
        return;
      }

      // 🪄 2. TRADUCTOR DE IDs: Buscamos el ID real de Fisioterapeuta
      const physioRecord = await PhysiotherapistModel.findOne({ where: { id_user: userIdFromToken } });
      
      if (!physioRecord) {
        res.status(403).json({ success: false, message: "El usuario logueado no tiene un perfil de fisioterapeuta válido." });
        return;
      }

      const idPhysioReal = (physioRecord as any).id_physio; // ¡Este es el ID correcto para la BD!

      // 3. EMPAQUETAMOS LOS DATOS PARA LA TRANSACCIÓN
      const payloadTransaccion = {
        userData: {
          email: rawData.email,
          password: "NO_PASSWORD_MOBILE_LOGIN", // Contraseña dummy
          role: 'patient',
          status: 'approved'
        },
        patientData: {
          first_name: rawData.firstName,
          last_name_paternal: rawData.lastNameP, 
          last_name_maternal: rawData.lastNameM, 
          email: rawData.email,
          phone: rawData.phone,
          birth_date: rawData.birthYear ? `${rawData.birthYear}-01-01` : null,        
          gender: rawData.gender,
          height: rawData.height,
          weight: rawData.weight,
          id_physio: idPhysioReal // 🪄 USAMOS EL ID TRADUCIDO
        }
      };

      // 4. ENVIAMOS EL PAQUETE AL CASO DE USO
      const patient = await this.createPatient.execute(payloadTransaccion);
      
      res.status(201).json({ 
        success: true, 
        message: "Paciente registrado y cuenta móvil habilitada exitosamente.",
        data: patient 
      });

    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ success: false, message: "Error de validación.", errors: error.errors });
        return;
      }
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(409).json({ success: false, message: `El correo electrónico ya está registrado en el sistema.` });
        return;
      }

      res.status(400).json({ success: false, message: error.message });
    }
  };

  update = async (req: any, res: Response): Promise<void> => {
    try {
      const patientId = parseInt(req.params.id, 10);
      
      if (isNaN(patientId)) {
        res.status(400).json({ success: false, message: "ID inválido." });
        return;
      }

      const rawData = req.body;

      const pacienteActual = await PatientModel.findByPk(patientId);
      if (!pacienteActual) {
        res.status(404).json({ success: false, message: "Paciente no encontrado en la BD." });
        return;
      }

      const idUsuarioMovil = pacienteActual.getDataValue('id_user');

      if (rawData.email && idUsuarioMovil) {
        await UserModel.update(
          { email: rawData.email },
          { where: { id_user: idUsuarioMovil } }
        );
      }

      const translatedData: any = {
        first_name: rawData.firstName,
        last_name_paternal: rawData.lastNameP,
        last_name_maternal: rawData.lastNameM,
        birth_date: rawData.birthYear ? `${rawData.birthYear}-01-01` : undefined,
        height: rawData.height,
        weight: rawData.weight
      };

      Object.keys(translatedData).forEach(key => {
        if (translatedData[key] === undefined) {
          delete translatedData[key];
        }
      });

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

  list = async (req: any, res: Response): Promise<void> => {
    try {
      const userIdFromToken = req.user?.id || req.user?.id_user; 
      
      if (!userIdFromToken) {
        res.status(401).json({ success: false, message: "No autorizado." });
        return;
      }

      // 🪄 TRADUCTOR DE IDs PARA LISTAR LOS PACIENTES
      const physioRecord = await PhysiotherapistModel.findOne({ where: { id_user: userIdFromToken } });
      if (!physioRecord) {
        res.status(403).json({ success: false, message: "Perfil de fisioterapeuta no encontrado." });
        return;
      }

      const idPhysioReal = (physioRecord as any).id_physio;

      const limit = Math.min(Number(req.query.limit ?? 20), 100);
      const page = Math.max(Number(req.query.page ?? 1), 1);
      const offset = (page - 1) * limit;

      const result = await this.listPatients.execute({ limit, offset, id_physio: idPhysioReal });
      
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

  getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const patientId = parseInt(req.params.id, 10);
      
      if (isNaN(patientId)) {
        res.status(400).json({ success: false, message: "El ID proporcionado no es válido." });
        return;
      }

      const u = (req as any).user as { id?: number; role?: string; id_physio?: number } | undefined;

      if (u?.role === "patient" && Number(u.id) !== patientId) {
        res.status(403).json({ success: false, message: "No puedes consultar expedientes de otros pacientes." });
        return;
      }

      if (u?.role === "physio") {
        const row = await PatientModel.findByPk(patientId);
        if (!row) {
          res.status(404).json({ success: false, message: "Expediente de paciente no encontrado." });
          return;
        }
        const idPhysio = u.id_physio;
        if (idPhysio == null || row.getDataValue("id_physio") !== idPhysio) {
          res.status(403).json({ success: false, message: "No tienes permiso para ver este expediente." });
          return;
        }
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