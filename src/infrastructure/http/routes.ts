import { Router } from "express";

// Recibimos los controladores ya instanciados desde main.ts
export function buildRoutes(controllers: {
  patientController: any;
  physioController: any;
  exerciseController: any;
}) {
  const router = Router();

  // Rutas de Fisioterapeutas
  router.post("/physiotherapists", controllers.physioController.create);

  // Rutas de Pacientes
  router.post("/patients", controllers.patientController.create);
  router.get("/patients", controllers.patientController.list);

  // Rutas de Ejercicios
  router.post("/exercises", controllers.exerciseController.create);
  router.get("/exercises", controllers.exerciseController.list);

  return router;
}