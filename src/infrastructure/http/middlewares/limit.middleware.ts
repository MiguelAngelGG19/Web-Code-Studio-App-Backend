import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { 
  PhysiotherapistModel, 
  PatientModel, 
  AppointmentModel, 
  RoutineModel, 
  TrackingModel, 
  LogbookModel 
} from '../../persistence/sequelize/client';

// Tus reglas de negocio exactas
const PLAN_LIMITS: any = {
  free: { patient: 5, appointment: 10, routine: 10, tracking: 10, logbook: 10 },
  basico: { patient: 20, appointment: 50, routine: 30, tracking: 100, logbook: 50 },
  ilimitado: { patient: Infinity, appointment: Infinity, routine: Infinity, tracking: Infinity, logbook: Infinity }
};

const getInicioDeMesMexico = (): Date => {
  const mxString = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" });
  const mxDate = new Date(mxString);
  return new Date(mxDate.getFullYear(), mxDate.getMonth(), 1, 0, 0, 0);
};

export const checkLimit = (entity: 'patient' | 'appointment' | 'routine' | 'tracking' | 'logbook') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const physioId = (req as any).user?.id || (req as any).user?.id_user;

      // 🪄 MAGIA ANTI-SEQUELIZE: Consulta SQL pura para que el Cadenero no esté ciego
      const [results]: any = await PhysiotherapistModel.sequelize!.query(
        'SELECT id_physio, plan_type FROM physiotherapist WHERE id_user = ? LIMIT 1',
        { replacements: [physioId] }
      );

      if (!results || results.length === 0) {
        return res.status(404).json({ message: 'Fisioterapeuta no encontrado' });
      }

      const fisio = results[0];
      
      // Traducimos lo que hay en la BD (si está vacío, asume 'free')
      let planActual = fisio.plan_type || 'free';
      // Por si en MySQL dice "gratis" o "premium", lo empatamos con nuestro diccionario
      if (planActual === 'gratis') planActual = 'free';
      if (planActual === 'premium') planActual = 'ilimitado';

      const limite = PLAN_LIMITS[planActual][entity];

      // ¡Si es ilimitado, pásale VIP sin contar nada!
      if (limite === Infinity) {
        return next();
      }

      const idFisioReal = fisio.id_physio;
      let totalActual = 0;

      // Contar dependiendo de la entidad
      if (entity === 'patient') {
        totalActual = await PatientModel.count({ where: { id_physio: idFisioReal } });
      } else {
        const inicioDeMesMx = getInicioDeMesMexico();
        const queryConfig = { 
          where: { 
            id_physio: idFisioReal, 
            createdAt: { [Op.gte]: inicioDeMesMx } 
          } 
        };

        if (entity === 'appointment') totalActual = await AppointmentModel.count(queryConfig);
        if (entity === 'routine') totalActual = await RoutineModel.count(queryConfig);
        if (entity === 'tracking') totalActual = await TrackingModel.count(queryConfig);
        if (entity === 'logbook') totalActual = await LogbookModel.count(queryConfig);
      }

      // Bloqueo si se pasó
      if (totalActual >= limite) {
        return res.status(403).json({
          code: 'LIMIT_REACHED',
          message: `Límite alcanzado: Tu plan ${planActual.toUpperCase()} solo permite ${limite} ${entity === 'patient' ? 'en total' : 'al mes'}.`
        });
      }

      next();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
};