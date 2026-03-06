import express from "express";
// Usamos el estándar preferido por TypeScript moderno
import cors from "cors"; 
import * as dotenv from "dotenv";
import { sequelize } from "./infrastructure/persistence/sequelize/client";
import { buildRoutes } from "./infrastructure/http/routes";
import { GetPatientByIdUseCase } from "./application/use-cases/GetPatientById.uc";
import { GetPhysiotherapistByIdUseCase } from "./application/use-cases/GetPhysiotherapistById.uc";
import { SequelizeTrackingRepository } from "./infrastructure/persistence/repositories/SequelizeTrackingRepository";
import { RegisterPainLevelUseCase } from "./application/use-cases/RegisterPainLevel.uc";
import { TrackingController } from "./infrastructure/http/controllers/tracking.controller";
import { SequelizeRoutineRepository } from "./infrastructure/persistence/repositories/SequelizeRoutineRepository";
import { CreateRoutineUseCase } from "./application/use-cases/CreateRoutine.uc";
import { RoutineController } from "./infrastructure/http/controllers/routine.controller";
import { GetPatientRoutineUseCase } from "./application/use-cases/GetPatientRoutine.uc";


// Repositorios
import { SequelizePatientRepository } from "./infrastructure/persistence/repositories/SequelizePatientRepository";
import { SequelizePhysiotherapistRepository } from "./infrastructure/persistence/repositories/SequelizePhysiotherapistRepository";
import { SequelizeExerciseRepository } from "./infrastructure/persistence/repositories/SequelizeExerciseRepository";

// Casos de Uso
import { CreatePatientUseCase } from "./application/use-cases/CreatePatient.uc";
import { ListPatientsUseCase } from "./application/use-cases/ListPatients.uc";
import { UpdatePatientUseCase } from "./application/use-cases/UpdatePatient.uc"; // <- 1. IMPORTAR
import { CreatePhysiotherapistUseCase } from "./application/use-cases/CreatePhysiotherapist.uc";
import { CreateExerciseUseCase } from "./application/use-cases/CreateExercise.uc";
import { ListExercisesUseCase } from "./application/use-cases/ListExercises.uc";
import { GetExerciseByIdUseCase } from "./application/use-cases/GetExerciseById.uc";

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
    const trackingRepo = new SequelizeTrackingRepository();
    const routineRepo = new SequelizeRoutineRepository();
    // 3. Instanciar Casos de Uso
    const createPatient = new CreatePatientUseCase(patientRepo);
    const listPatients = new ListPatientsUseCase(patientRepo);
    const updatePatient = new UpdatePatientUseCase(patientRepo); // <- 2. INSTANCIAR
    const registerPain = new RegisterPainLevelUseCase(trackingRepo);

    const createPhysio = new CreatePhysiotherapistUseCase(physioRepo);
    const createExercise = new CreateExerciseUseCase(exerciseRepo);
    const listExercises = new ListExercisesUseCase(exerciseRepo);

    const getPatientById = new GetPatientByIdUseCase(patientRepo);
const getPhysioById = new GetPhysiotherapistByIdUseCase(physioRepo);

const createRoutine = new CreateRoutineUseCase(routineRepo);
const getPatientRoutine = new GetPatientRoutineUseCase(routineRepo);
const getExerciseById = new GetExerciseByIdUseCase(exerciseRepo);


    // 4. Instanciar Controladores
    const patientController = new PatientController(createPatient, listPatients, updatePatient, getPatientById);
const physioController = new PhysiotherapistController(createPhysio, getPhysioById);
    const exerciseController = new ExerciseController(createExercise, listExercises, getExerciseById);
    const trackingController = new TrackingController(registerPain);
    const routineController = new RoutineController(createRoutine, getPatientRoutine);


    // 5. Configurar Servidor Express
    const app = express();
    
    // Configuración de CORS con la función importada
    app.use(cors()); 
    
    app.use(express.json());

    // 6. Conectar Rutas
    app.use("/api", buildRoutes({ patientController, physioController, exerciseController, trackingController, routineController }));


    // 7. Encender Servidor
    const port = Number(process.env.PORT) || 3000;
    app.listen(port, () => {
      console.log("--------------------------------------------------");
      console.log(`🚀 API DE ACTIVA CORRIENDO`);
      console.log(`🔗 URL: http://localhost:${port}`);
      console.log("--------------------------------------------------");
    });

  } catch (error) {
    console.error("❌ Error fatal al iniciar el servidor:", error);
    process.exit(1);
  }
}

bootstrap();