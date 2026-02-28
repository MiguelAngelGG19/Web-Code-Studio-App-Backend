import { Router } from "express";
import { validate } from "./middlewares/validate.middleware";
import { createPatientSchema } from "../../application/dtos/patient.dto";
import { createPhysioSchema } from "../../application/dtos/physiotherapist.dto";
import { createExerciseSchema } from "../../application/dtos/exercise.dto";

export const buildRoutes = (deps: any) => {
  const router = Router();

  router.post("/patients", validate(createPatientSchema), deps.patientController.create);
  router.get("/patients", deps.patientController.list);

  router.post("/physiotherapists", validate(createPhysioSchema), deps.physioController.create);

  router.get("/exercises", deps.exerciseController.list);
  router.post("/exercises", validate(createExerciseSchema), deps.exerciseController.create);

  return router;
};