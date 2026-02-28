import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { sequelize } from "./infrastructure/persistence/sequelize";
import "./infrastructure/persistence/models/Patient.model";
import "./infrastructure/persistence/models/Physiotherapist.model";
import "./infrastructure/persistence/models/Exercise.model";

import { SequelizePatientRepository } from "./infrastructure/persistence/repositories/SequelizePatientRepository";
import { SequelizePhysiotherapistRepository } from "./infrastructure/persistence/repositories/SequelizePhysiotherapistRepository";
import { SequelizeExerciseRepository } from "./infrastructure/persistence/repositories/SequelizeExerciseRepository";

import { buildRoutes } from "./infrastructure/http/routes";

// Controllers (si no los tienes aún, dime y te los paso)
import { PatientController } from "./infrastructure/http/controllers/patient.controller";
import { PhysiotherapistController } from "./infrastructure/http/controllers/physiotherapist.controller";
import { ExerciseController } from "./infrastructure/http/controllers/exercise.controller";

async function bootstrap() {
  await sequelize.authenticate();

  const patientRepo = new SequelizePatientRepository();
  const physioRepo = new SequelizePhysiotherapistRepository();
  const exerciseRepo = new SequelizeExerciseRepository();

  const patientController = new PatientController(patientRepo);
  const physioController = new PhysiotherapistController(physioRepo);
  const exerciseController = new ExerciseController(exerciseRepo);

  const app = express();
  app.use(express.json());

  app.use("/api", buildRoutes({ patientController, physioController, exerciseController }));

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`API running on http://localhost:${3000}`));
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});