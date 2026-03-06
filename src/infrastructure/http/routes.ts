import { Router } from "express";

// Recibimos los controladores ya instanciados desde main.ts
export function buildRoutes(controllers: {
  patientController: any;
  physioController: any;
  exerciseController: any;
  trackingController: any;
  routineController: any; // <-- NUEVO: Agregamos el controlador de rutinas a la interfaz
}) {
  const router = Router();

  // Rutas de Fisioterapeutas
  router.post("/physiotherapists", controllers.physioController.create);
  router.get("/physiotherapists/:id", controllers.physioController.getById);

  // Rutas de Pacientes
  router.post("/patients", controllers.patientController.create);
  router.get("/patients", controllers.patientController.list);
  router.put("/patients/:id", controllers.patientController.update);
  router.get("/patients/:id", controllers.patientController.getById);

  // Rutas de Ejercicios
  router.post("/exercises", controllers.exerciseController.create);
  router.get("/exercises", controllers.exerciseController.list);

  // Rutas de Seguimiento (Molestias)
  router.post("/tracking", controllers.trackingController.create);

  // <-- NUEVA RUTA DE RUTINAS -->
  router.post("/routines", controllers.routineController.create);

   // Rutas de Rutinas
  router.post("/routines", controllers.routineController.create);
  // NUEVA RUTA
  router.get("/routines/patient/:patientId", controllers.routineController.getByPatient);


  return router;
}