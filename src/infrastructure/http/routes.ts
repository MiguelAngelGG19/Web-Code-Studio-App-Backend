import { Router } from "express";
import { authMiddleware } from "./middlewares/auth.middleware";
import { uploadDocuments } from "./middlewares/upload.middleware"; // se añadio para los pdf
import { requireApproval } from "./middlewares/approved.middleware"; // <--- 1. IMPORTAMOS EL NUEVO CADENERO
import { PhysiotherapistModel } from "../persistence/sequelize/client";

export function buildRoutes(controllers: {
  patientController:    any;
  physioController:     any;
  exerciseController:   any;
  trackingController:   any;
  routineController:    any;
  authController:       any;
  appointmentController:   any;
  logbookController:       any;
  notificationController:  any;
}) {
  const router = Router();

  // ============================================================
  // RUTAS PÚBLICAS (sin token)
  // ============================================================
  router.post("/auth/register", controllers.authController.register);
  router.post("/auth/login",    controllers.authController.login);
  router.post("/auth/login-patient", controllers.authController.loginPatient);


  // ============================================================
  // RUTAS PROTEGIDAS (requieren JWT)
  // ============================================================

  // Fisioterapeutas
  router.get("/physiotherapists/pending",       authMiddleware, controllers.physioController.listPending);
  router.post("/physiotherapists",              authMiddleware, controllers.physioController.create);
  router.get("/physiotherapists/:id",           authMiddleware, controllers.physioController.getById);
  router.patch("/physiotherapists/:id/approve", authMiddleware, controllers.physioController.approve);

  // 🟢 RUTA: SUBIDA DE DOCUMENTOS (VERSIÓN FINAL CON COLUMNAS REALES)
  // 🔓 ESTA SOLO LLEVA 1 CADENERO (authMiddleware) PORQUE EL FISIO AÚN NO ESTÁ APROBADO
  router.post(
    "/physiotherapists/upload-documents", 
    authMiddleware, 
    uploadDocuments.fields([
      { name: 'ineFront', maxCount: 1 },
      { name: 'cedulaPdf', maxCount: 1 }
    ]),
    async (req: any, res: any) => {
      try {
        const idUsuario = req.user.id; 

        // 1. Buscamos al fisio usando su id_user
        const fisio: any = await PhysiotherapistModel.findOne({ where: { id_user: idUsuario } });

        if (!fisio) {
          return res.status(404).json({ message: "Fisioterapeuta no encontrado." });
        }

        // 2. Revisamos que su estatus sea el correcto
        if (fisio.getDataValue('status') !== 'pending_profile') {
          return res.status(400).json({ 
            message: "Acción denegada. Tus documentos ya fueron recibidos o tu cuenta ya está validada." 
          });
        }

        // 3. Extraemos los nombres de los archivos
        if (!req.files || !req.files['ineFront'] || !req.files['cedulaPdf']) {
           return res.status(400).json({ message: "Faltan documentos en la petición." });
        }

        const nombreIne = req.files['ineFront'][0].filename;
        const nombreCedula = req.files['cedulaPdf'][0].filename;

        // 4. ACTUALIZAMOS LA BD CON TUS COLUMNAS REALES
        await PhysiotherapistModel.update({
          ine_doc_url: nombreIne,            
          license_doc_url: nombreCedula,     
          status: 'pending_approval'
        }, { 
          where: { id_user: idUsuario } 
        });

        res.status(200).json({ success: true, message: 'Documentos guardados exitosamente.' });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // 🛡️ A PARTIR DE AQUÍ, TODAS LAS RUTAS OPERATIVAS LLEVAN LOS 2 CADENEROS:
  // authMiddleware (Verifica que haya iniciado sesión) + requireApproval (Verifica que el admin ya lo aprobó)

  // Pacientes
  router.post("/patients",     authMiddleware, requireApproval, controllers.patientController.create);
  router.get("/patients",      authMiddleware, requireApproval, controllers.patientController.list);
  router.put("/patients/:id",  authMiddleware, requireApproval, controllers.patientController.update);
  router.get("/patients/:id",  authMiddleware, requireApproval, controllers.patientController.getById);

  // Ejercicios
  router.post("/exercises",     authMiddleware, requireApproval, controllers.exerciseController.create);
  router.get("/exercises",      authMiddleware, requireApproval, controllers.exerciseController.list);
  router.get("/exercises/:id",  authMiddleware, requireApproval, controllers.exerciseController.getById);

  // Seguimiento
  router.post("/tracking", authMiddleware, requireApproval, controllers.trackingController.create);

  // Rutinas
  router.post("/routines",                              authMiddleware, requireApproval, controllers.routineController.create);
  router.get("/routines/patient/:patientId",            authMiddleware, requireApproval, controllers.routineController.getByPatient);
  router.get("/routines/history/patient/:patientId",    authMiddleware, requireApproval, controllers.routineController.getHistoryByPatient);
  router.get("/routines/:id",                           authMiddleware, requireApproval, controllers.routineController.getById);

  // Citas
  router.post("/appointments",                       authMiddleware, requireApproval, controllers.appointmentController.create);
  router.get("/appointments/patient/:patientId",     authMiddleware, requireApproval, controllers.appointmentController.getByPatient);
  router.put("/appointments/:id",                    authMiddleware, requireApproval, controllers.appointmentController.update);
  router.get("/appointments",                        authMiddleware, requireApproval, controllers.appointmentController.getMyPhysioAppointments);
  // Bitácora
  router.post("/logbook",                            authMiddleware, requireApproval, controllers.logbookController.create);
  router.get("/logbook/appointment/:appointmentId",  authMiddleware, requireApproval, controllers.logbookController.getByAppointment);

  // Notificaciones
  router.post("/notifications",                      authMiddleware, requireApproval, controllers.notificationController.create);
  router.get("/notifications/patient/:patientId",    authMiddleware, requireApproval, controllers.notificationController.getByPatient);
  router.patch("/notifications/:id/read",            authMiddleware, requireApproval, controllers.notificationController.markAsRead);


  return router;
}