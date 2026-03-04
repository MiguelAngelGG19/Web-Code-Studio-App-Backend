import express from "express";
// Cambiamos la forma de importar cors para evitar el error TS2349
const cors = require("cors");
import * as dotenv from "dotenv";
import { sequelize } from "./infrastructure/persistence/sequelize/client";
import { buildRoutes } from "./infrastructure/http/routes";

// Repositorios
import { SequelizePatientRepository } from "./infrastructure/persistence/repositories/SequelizePatientRepository";
import { SequelizePhysiotherapistRepository } from "./infrastructure/persistence/repositories/SequelizePhysiotherapistRepository";
import { SequelizeExerciseRepository } from "./infrastructure/persistence/repositories/SequelizeExerciseRepository";

// Casos de Uso
import { CreatePatientUseCase } from "./application/use-cases/CreatePatient.uc";
import { ListPatientsUseCase } from "./application/use-cases/ListPatients.uc";
import { CreatePhysiotherapistUseCase } from "./application/use-cases/CreatePhysiotherapist.uc";
import { CreateExerciseUseCase } from "./application/use-cases/CreateExercise.uc";
import { ListExercisesUseCase } from "./application/use-cases/ListExercises.uc";

// Controladores
import { PatientController } from "./infrastructure/http/controllers/patient.controller";
import { PhysiotherapistController } from "./infrastructure/http/controllers/physiotherapist.controller";
import { ExerciseController } from "./infrastructure/http/controllers/exercise.controller";

dotenv.config();

async function bootstrap() {
  try {
    // 1. Conectar a la Base de Datos
    await sequelize.authenticate();
    console.log("✅ Conexión a MySQL (Sequelize) establecida con éxito.");

    // 2. Instanciar Repositorios
    const patientRepo = new SequelizePatientRepository();
    const physioRepo = new SequelizePhysiotherapistRepository();
    const exerciseRepo = new SequelizeExerciseRepository();

    // 3. Instanciar Casos de Uso
    const createPatient = new CreatePatientUseCase(patientRepo);
    const listPatients = new ListPatientsUseCase(patientRepo);
    const createPhysio = new CreatePhysiotherapistUseCase(physioRepo);
    const createExercise = new CreateExerciseUseCase(exerciseRepo);
    const listExercises = new ListExercisesUseCase(exerciseRepo);

    // 4. Instanciar Controladores
    const patientController = new PatientController(createPatient, listPatients);
    const physioController = new PhysiotherapistController(createPhysio);
    const exerciseController = new ExerciseController(createExercise, listExercises);

    // 5. Configurar Servidor Express
    const app = express();
    
    // Aquí es donde daba el error. Ahora funcionará:
    app.use(cors()); 
    
    app.use(express.json());

    // 6. Conectar Rutas
    app.use("/api", buildRoutes({ patientController, physioController, exerciseController }));

    // 7. Encender Servidor
    const port = Number(process.env.PORT) || 3000;
    app.listen(port, () => {
      console.log("--------------------------------------------------");
      console.log(`API DE ACTIVA CORRIENDO`);
      console.log(`URL: http://localhost:${port}`);
      console.log("--------------------------------------------------");
    });

  } catch (error) {
    console.error("Error fatal al iniciar el servidor:", error);
    process.exit(1);
  }
}

bootstrap();