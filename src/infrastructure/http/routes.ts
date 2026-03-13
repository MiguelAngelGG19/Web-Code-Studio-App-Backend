import { Router } from "express";
import { authMiddleware } from "./middlewares/auth.middleware";

export function buildRoutes(controllers: {
  patientController:    any;
  physioController:     any;
  exerciseController:   any;
  trackingController:   any;
  routineController:    any;
  authController:       any;
}) {
  const router = Router();

  // ============================================================
  // RUTAS PÚBLICAS (sin token)
  // ============================================================
  router.post("/auth/register", controllers.authController.register);
  router.post("/auth/login",    controllers.authController.login);
  router.post("/auth/google-patient", controllers.authController.loginWithGoogle);


  // ============================================================
  // RUTAS PROTEGIDAS (requieren JWT)
  // ============================================================

  // Fisioterapeutas
  router.post("/physiotherapists",     authMiddleware, controllers.physioController.create);
  router.get("/physiotherapists/:id",  authMiddleware, controllers.physioController.getById);
  router.get("/physiotherapists/pending",      authMiddleware, controllers.physioController.listPending);
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

  return router;
}
