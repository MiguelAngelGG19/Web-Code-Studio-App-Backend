import { Router } from "express";
import { authMiddleware } from "./middlewares/auth.middleware";
import { uploadDocuments } from "./middlewares/upload.middleware"; // se añadio para los pdf
import { requireApproval } from "./middlewares/approved.middleware";
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
  dashboardController:     any;
}) {
  const router = Router();

  // ============================================================
  // RUTAS PÚBLICAS (sin token)
  // ============================================================
  router.post("/auth/register",       controllers.authController.register);
  router.post("/auth/login",          controllers.authController.login);
  router.post("/auth/login-patient",  controllers.authController.loginPatient);
  router.post("/auth/login-admin",    controllers.authController.loginAdmin);


  // ============================================================
  // RUTAS PROTEGIDAS (requieren JWT)
  // ============================================================

  // Fisioterapeutas
  router.get("/physiotherapists/pending",       authMiddleware, controllers.physioController.listPending);
  router.post("/physiotherapists",              authMiddleware, controllers.physioController.create);
  router.get("/physiotherapists/:id",           authMiddleware, controllers.physioController.getById);
  router.patch("/physiotherapists/:id/approve", authMiddleware, controllers.physioController.approve);
  router.patch("/auth/update-email",    authMiddleware, controllers.authController.updateEmail);
  router.patch("/auth/update-password", authMiddleware, controllers.authController.updatePassword);
  
  // 🟢 RUTA: SUBIDA DE DOCUMENTOS
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

        const fisio: any = await PhysiotherapistModel.findOne({ where: { id_user: idUsuario } });

        if (!fisio) {
          return res.status(404).json({ message: "Fisioterapeuta no encontrado." });
        }

        if (fisio.getDataValue('status') !== 'pending_profile') {
          return res.status(400).json({ 
            message: "Acción denegada. Tus documentos ya fueron recibidos o tu cuenta ya está validada." 
          });
        }

        if (!req.files || !req.files['ineFront'] || !req.files['cedulaPdf']) {
           return res.status(400).json({ message: "Faltan documentos en la petición." });
        }

        const nombreIne = req.files['ineFront'][0].filename;
        const nombreCedula = req.files['cedulaPdf'][0].filename;

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

  // ============================================================
  // RUTAS OPERATIVAS (authMiddleware + requireApproval)
  // ============================================================

  // Dashboard
  router.get("/dashboard/stats", authMiddleware, requireApproval, controllers.dashboardController.getStats);

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
  router.post("/routines",                              authMiddleware, controllers.routineController.create);
  router.post("/routines/templates",                    authMiddleware, controllers.routineController.createTemplate);
  router.put("/routines/templates/:id",                 authMiddleware, controllers.routineController.updateTemplate);
  router.get("/routines/templates",                     authMiddleware, controllers.routineController.listTemplates);
  router.get("/routines/templates/:id",                 authMiddleware, controllers.routineController.getTemplateById);
  router.post("/routines/:id/template",                 authMiddleware, controllers.routineController.saveAsTemplate);
  router.get("/routines/patient/:patientId",            authMiddleware, controllers.routineController.getByPatient);
  router.get("/routines/history/patient/:patientId",    authMiddleware, controllers.routineController.getHistoryByPatient);
  router.get("/routines/:id",                           authMiddleware, controllers.routineController.getById);
  router.put("/routines/:id",                           authMiddleware, controllers.routineController.update);

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
