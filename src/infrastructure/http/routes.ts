import { Router } from "express";
import express from "express";
import { authMiddleware } from "./middlewares/auth.middleware";
import { uploadDocuments } from "./middlewares/upload.middleware";
import { requireApproval } from "./middlewares/approved.middleware";
import { requireActivePlan } from "./middlewares/active-plan.middleware"; 
import { PhysiotherapistModel } from "../persistence/sequelize/client";
import { uploadPatientMedicalPdf } from "./middlewares/upload-patient-medical.middleware";
import { checkLimit } from "./middlewares/limit.middleware"; // 🛡️ NUESTRO CADENERO

export function buildRoutes(controllers: {
  patientController:       any;
  physioController:        any;
  exerciseController:      any;
  trackingController:      any;
  routineController:       any;
  authController:          any;
  appointmentController:   any;
  logbookController:       any;
  notificationController:  any;
  dashboardController:     any;
  documentController:      any;
  subscriptionController:  any;
}) {
  const router = Router();

  // ============================================================
  // RUTAS PÚBLICAS (sin token)
  // ============================================================
  router.post("/auth/register",      controllers.authController.register);
  router.post("/auth/login",         controllers.authController.login);
  router.post("/auth/login-patient", controllers.authController.loginPatient);
  router.get("/publico/planes",      controllers.subscriptionController.listaPlanes);

  // ============================================================
  // RUTAS PROTEGIDAS — Solo JWT (aprobación / perfil / plan)
  // ============================================================

  // Fisioterapeutas
  router.get("/physiotherapists/pending",       authMiddleware, controllers.physioController.listPending);
  router.post("/physiotherapists",              authMiddleware, controllers.physioController.create);
  router.get("/physiotherapists/:id",           authMiddleware, controllers.physioController.getById);
  router.patch("/physiotherapists/:id/approve", authMiddleware, controllers.physioController.approve);
  router.patch("/auth/update-email",            authMiddleware, controllers.authController.updateEmail);
  router.patch("/auth/update-password",         authMiddleware, controllers.authController.updatePassword);

  // Subida de documentos (fisio aún no aprobado, no necesita plan)
  router.post(
    "/physiotherapists/upload-documents",
    authMiddleware,
    uploadDocuments.fields([
      { name: 'ineFront',   maxCount: 1 },
      { name: 'cedulaPdf', maxCount: 1 }
    ]),
    async (req: any, res: any) => {
      try {
        const idUsuario = req.user.id;
        const fisio: any = await PhysiotherapistModel.findOne({ where: { id_user: idUsuario } });

        if (!fisio) return res.status(404).json({ message: "Fisioterapeuta no encontrado." });

        if (fisio.getDataValue('status') !== 'pending_profile') {
          return res.status(400).json({
            message: "Acción denegada. Tus documentos ya fueron recibidos o tu cuenta ya está validada."
          });
        }

        if (!req.files || !req.files['ineFront'] || !req.files['cedulaPdf']) {
          return res.status(400).json({ message: "Faltan documentos en la petición." });
        }

        await PhysiotherapistModel.update({
          ine_doc_url:      req.files['ineFront'][0].filename,
          license_doc_url:  req.files['cedulaPdf'][0].filename,
          status:           'pending_approval'
        }, { where: { id_user: idUsuario } });

        res.status(200).json({ success: true, message: 'Documentos guardados exitosamente.' });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // ============================================================
  // 💳 SUSCRIPCIONES (Stripe)
  // ============================================================
  router.post(
    "/suscripciones/webhook",
    express.raw({ type: 'application/json' }),
    controllers.subscriptionController.webhook
  );

  router.get("/suscripciones/mi-plan", authMiddleware, controllers.subscriptionController.miPlan);
  router.get("/suscripciones/planes", authMiddleware, controllers.subscriptionController.listaPlanes);
  router.post("/suscripciones/checkout", authMiddleware, controllers.subscriptionController.checkout);
  router.get("/suscripciones/confirmar-checkout", authMiddleware, controllers.subscriptionController.confirmarCheckout);
  router.post("/suscripciones/portal", authMiddleware, controllers.subscriptionController.portal);
  router.post("/suscripciones/cambiar-plan", authMiddleware, controllers.subscriptionController.cambiarPlan);
  router.delete("/suscripciones/cambio-pendiente", authMiddleware, controllers.subscriptionController.cancelarCambio);

  // ============================================================
  // RUTAS OPERATIVAS
  // Cadena: authMiddleware → requireApproval → requireActivePlan → checkLimit (Si aplica) → controller
  // ============================================================

  // Dashboard
  router.get("/dashboard/stats",
    authMiddleware, requireApproval, requireActivePlan,
    controllers.dashboardController.getStats
  );

  // 🛡️ Pacientes (Se aplica checkLimit de 'patient')
  router.post("/patients",    authMiddleware, requireApproval, requireActivePlan, checkLimit('patient'), controllers.patientController.create);
  router.get("/patients",     authMiddleware, requireApproval, requireActivePlan, controllers.patientController.list);
  router.put("/patients/:id", authMiddleware, requireApproval, requireActivePlan, controllers.patientController.update);
  router.get("/patients/:id", authMiddleware, requireApproval, requireActivePlan, controllers.patientController.getById);

  // Ejercicios (Sin límite explícito)
  router.post("/exercises",     authMiddleware, requireApproval, requireActivePlan, controllers.exerciseController.create);
  router.get("/exercises",      authMiddleware, requireApproval, requireActivePlan, controllers.exerciseController.list);
  router.get("/exercises/:id",  authMiddleware, requireApproval, requireActivePlan, controllers.exerciseController.getById);

  // 🛡️ Seguimiento (Se aplica checkLimit de 'tracking')
  router.post("/tracking", authMiddleware, requireApproval, requireActivePlan, checkLimit('tracking'), controllers.trackingController.create);

  // 🛡️ Rutinas (Se aplica checkLimit de 'routine')
  router.post("/routines",                           authMiddleware, requireActivePlan, checkLimit('routine'), controllers.routineController.create);
  router.post("/routines/templates",                 authMiddleware, requireActivePlan, controllers.routineController.createTemplate);
  router.put("/routines/templates/:id",              authMiddleware, requireActivePlan, controllers.routineController.updateTemplate);
  router.get("/routines/templates",                  authMiddleware, requireActivePlan, controllers.routineController.listTemplates);
  router.get("/routines/templates/:id",              authMiddleware, requireActivePlan, controllers.routineController.getTemplateById);
  router.post("/routines/:id/template",              authMiddleware, requireActivePlan, controllers.routineController.saveAsTemplate);
  router.get("/routines/patient/:patientId",         authMiddleware, requireActivePlan, controllers.routineController.getByPatient);
  router.get("/routines/history/patient/:patientId", authMiddleware, requireActivePlan, controllers.routineController.getHistoryByPatient);
  router.get("/routines/:id",                        authMiddleware, requireActivePlan, controllers.routineController.getById);
  router.put("/routines/:id",                        authMiddleware, requireActivePlan, controllers.routineController.update);

  // 🛡️ Citas (Se aplica checkLimit de 'appointment')
  router.post("/appointments",                 authMiddleware, requireApproval, requireActivePlan, checkLimit('appointment'), controllers.appointmentController.create);
  router.get("/appointments/patient/:patientId", authMiddleware, requireApproval, requireActivePlan, controllers.appointmentController.getByPatient);
  router.put("/appointments/:id",                authMiddleware, requireApproval, requireActivePlan, controllers.appointmentController.update);
  router.get("/appointments",                    authMiddleware, requireApproval, requireActivePlan, controllers.appointmentController.getMyPhysioAppointments);

  // 🛡️ Bitácora (Se aplica checkLimit de 'logbook')
  router.post("/logbook",                          authMiddleware, requireApproval, requireActivePlan, checkLimit('logbook'), controllers.logbookController.create);
  router.get("/logbook/appointment/:appointmentId", authMiddleware, requireApproval, requireActivePlan, controllers.logbookController.getByAppointment);

  // Notificaciones
  router.post("/notifications",                  authMiddleware, requireApproval, requireActivePlan, controllers.notificationController.create);
  router.get("/notifications/patient/:patientId",authMiddleware, requireApproval, requireActivePlan, controllers.notificationController.getByPatient);
  router.patch("/notifications/:id/read",        authMiddleware, requireApproval, requireActivePlan, controllers.notificationController.markAsRead);

  // Documentos médicos
  router.get("/documents", authMiddleware, requireApproval, requireActivePlan, controllers.documentController.list);
  router.post(
    "/documents",
    authMiddleware, requireApproval, requireActivePlan,
    uploadPatientMedicalPdf.single("file"),
    controllers.documentController.create
  );
  router.delete("/documents/:id", authMiddleware, requireApproval, requireActivePlan, controllers.documentController.remove);

  return router;
}