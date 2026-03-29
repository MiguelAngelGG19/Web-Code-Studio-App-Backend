import { Router } from "express";
import { authMiddleware } from "./middlewares/auth.middleware";

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
  // Fisioterapeutas ← ORDEN CORRECTO
router.get("/physiotherapists/pending",       authMiddleware, controllers.physioController.listPending);
router.post("/physiotherapists",              authMiddleware, controllers.physioController.create);
router.get("/physiotherapists/:id",           authMiddleware, controllers.physioController.getById);
router.patch("/physiotherapists/:id/approve", authMiddleware, controllers.physioController.approve);


  // Pacientes
  router.post("/patients",     authMiddleware, controllers.patientController.create);
  router.get("/patients",      authMiddleware, controllers.patientController.list);
  router.put("/patients/:id",  authMiddleware, controllers.patientController.update);
  router.get("/patients/:id",  authMiddleware, controllers.patientController.getById);

  // Ejercicios
  router.post("/exercises",     authMiddleware, controllers.exerciseController.create);
  router.get("/exercises",      authMiddleware, controllers.exerciseController.list);
  router.get("/exercises/:id",  authMiddleware, controllers.exerciseController.getById);

  // Seguimiento
  router.post("/tracking", authMiddleware, controllers.trackingController.create);

  // Rutinas
  router.post("/routines",                              authMiddleware, controllers.routineController.create);
  router.get("/routines/patient/:patientId",            authMiddleware, controllers.routineController.getByPatient);
  router.get("/routines/history/patient/:patientId",    authMiddleware, controllers.routineController.getHistoryByPatient);
  router.get("/routines/:id",                           authMiddleware, controllers.routineController.getById);

  // Citas
  router.post("/appointments",                       authMiddleware, controllers.appointmentController.create);
  router.get("/appointments/patient/:patientId",     authMiddleware, controllers.appointmentController.getByPatient);
  router.put("/appointments/:id",                    authMiddleware, controllers.appointmentController.update);

  // Bitácora
  router.post("/logbook",                            authMiddleware, controllers.logbookController.create);
  router.get("/logbook/appointment/:appointmentId",  authMiddleware, controllers.logbookController.getByAppointment);

  // Notificaciones
  router.post("/notifications",                      authMiddleware, controllers.notificationController.create);
  router.get("/notifications/patient/:patientId",    authMiddleware, controllers.notificationController.getByPatient);
  router.patch("/notifications/:id/read",            authMiddleware, controllers.notificationController.markAsRead);


  return router;
}
