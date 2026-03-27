/**
 * **************************************************************************
 * PROYECTO: ACTIVA - API BACKEND
 * ARQUITECTO: Miguel Ángel Galicia García
 * DESCRIPCIÓN: Punto de entrada principal (Bootstrap)
 * **************************************************************************
 */

import express, { Application } from "express";
import cors from "cors";
import * as dotenv from "dotenv";

// Auth
import { SequelizeAuthRepository } from "./infrastructure/persistence/repositories/SequelizeAuthRepository";
import { RegisterPhysiotherapistUseCase } from "./application/use-cases/RegisterPhysiotherapist.uc";
import { LoginPhysiotherapistUseCase } from "./application/use-cases/LoginPhysiotherapist.uc";
import { AuthController } from "./infrastructure/http/controllers/auth.controller";
import { LoginPatientWithGoogleUseCase } from "./application/use-cases/LoginPatientWithGoogle.uc";
import { ApprovePhysiotherapistUseCase } from "./application/use-cases/ApprovePhysiotherapist.uc";
import { ListPendingPhysiotherapistsUseCase } from "./application/use-cases/ListPendingPhysiotherapists.uc";
import { LoginPatientByEmailUseCase } from "./application/use-cases/LoginPatientByEmail.uc";




// 1. INFRAESTRUCTURA CORE
import { sequelize } from "./infrastructure/persistence/sequelize/client";
import { buildRoutes } from "./infrastructure/http/routes";
import { errorHandler } from "./infrastructure/http/middlewares/error.middleware";

// 2. REPOSITORIOS (PERSISTENCIA)
import { SequelizePatientRepository } from "./infrastructure/persistence/repositories/SequelizePatientRepository";
import { SequelizePhysiotherapistRepository } from "./infrastructure/persistence/repositories/SequelizePhysiotherapistRepository";
import { SequelizeExerciseRepository } from "./infrastructure/persistence/repositories/SequelizeExerciseRepository";
import { SequelizeTrackingRepository } from "./infrastructure/persistence/repositories/SequelizeTrackingRepository";
import { SequelizeRoutineRepository } from "./infrastructure/persistence/repositories/SequelizeRoutineRepository";

// 3. CASOS DE USO (LÓGICA DE NEGOCIO)
// --- Pacientes ---
import { CreatePatientUseCase } from "./application/use-cases/CreatePatient.uc";
import { ListPatientsUseCase } from "./application/use-cases/ListPatients.uc";
import { UpdatePatientUseCase } from "./application/use-cases/UpdatePatient.uc";
import { GetPatientByIdUseCase } from "./application/use-cases/GetPatientById.uc";


// --- Fisioterapeutas ---
import { CreatePhysiotherapistUseCase } from "./application/use-cases/CreatePhysiotherapist.uc";
import { GetPhysiotherapistByIdUseCase } from "./application/use-cases/GetPhysiotherapistById.uc";

// --- Ejercicios ---
import { CreateExerciseUseCase } from "./application/use-cases/CreateExercise.uc";
import { ListExercisesUseCase } from "./application/use-cases/ListExercises.uc";
import { GetExerciseByIdUseCase } from "./application/use-cases/GetExerciseById.uc";

// --- Seguimiento (Tracking) ---
import { RegisterPainLevelUseCase } from "./application/use-cases/RegisterPainLevel.uc";

// --- Rutinas ---
import { CreateRoutineUseCase } from "./application/use-cases/CreateRoutine.uc";
import { GetPatientRoutineUseCase } from "./application/use-cases/GetPatientRoutine.uc";
import { GetRoutineByIdUseCase } from "./application/use-cases/GetRoutineById.uc";
import { GetPatientRoutineHistoryUseCase } from "./application/use-cases/GetPatientRoutineHistory.uc";

// 4. CONTROLADORES (HTTP INTERFACE)
import { PatientController } from "./infrastructure/http/controllers/patient.controller";
import { PhysiotherapistController } from "./infrastructure/http/controllers/physiotherapist.controller";
import { ExerciseController } from "./infrastructure/http/controllers/exercise.controller";
import { TrackingController } from "./infrastructure/http/controllers/tracking.controller";
import { RoutineController } from "./infrastructure/http/controllers/routine.controller";

// Cargar variables de entorno (.env)
dotenv.config();

/**
 * Función de arranque del servidor
 */
async function bootstrap() {
  try {
    console.log("🚀 Iniciando servidor Activa...");

    // ============================================================
    // FASE 1: CONEXIÓN A BASE DE DATOS
    // ============================================================
    await sequelize.authenticate();
    console.log("✅ Conexión a MySQL (Sequelize) establecida con éxito.");

    // ============================================================
    // FASE 2: INSTANCIACIÓN DE REPOSITORIOS (INFRAESTRUCTURA)
    // ============================================================
    const patientRepo = new SequelizePatientRepository();
    const physioRepo = new SequelizePhysiotherapistRepository();
    const exerciseRepo = new SequelizeExerciseRepository();
    const trackingRepo = new SequelizeTrackingRepository();
    const routineRepo = new SequelizeRoutineRepository();
    const authRepo = new SequelizeAuthRepository();


    // ============================================================
    // FASE 3: INSTANCIACIÓN DE CASOS DE USO (APLICACIÓN)
    // Se inyectan los repositorios necesarios a cada caso de uso.
    // ============================================================
    
    // Casos de Uso: Pacientes
    const createPatient = new CreatePatientUseCase(patientRepo);
    const listPatients = new ListPatientsUseCase(patientRepo);
    const updatePatient = new UpdatePatientUseCase(patientRepo);
    const getPatientById = new GetPatientByIdUseCase(patientRepo);
    const loginPatientGoogle = new LoginPatientWithGoogleUseCase(patientRepo);


    // Casos de Uso: Fisioterapeutas
    const createPhysio = new CreatePhysiotherapistUseCase(physioRepo);
    const getPhysioById = new GetPhysiotherapistByIdUseCase(physioRepo);
    const approvePhysio     = new ApprovePhysiotherapistUseCase(physioRepo);
const listPendingPhysio = new ListPendingPhysiotherapistsUseCase(physioRepo);

    // Casos de Uso: Ejercicios
    const createExercise = new CreateExerciseUseCase(exerciseRepo);
    const listExercises = new ListExercisesUseCase(exerciseRepo);
    const getExerciseById = new GetExerciseByIdUseCase(exerciseRepo);

    // Casos de Uso: Seguimiento
    const registerPain = new RegisterPainLevelUseCase(trackingRepo);

    // Casos de Uso: Rutinas
    const createRoutine = new CreateRoutineUseCase(routineRepo);
    const getPatientRoutine = new GetPatientRoutineUseCase(routineRepo);
    const getRoutineById = new GetRoutineByIdUseCase(routineRepo);
    const getPatientRoutineHistory = new GetPatientRoutineHistoryUseCase(routineRepo);

    // Casos de Uso: Auth
     const registerPhysio = new RegisterPhysiotherapistUseCase(authRepo);
     const loginPhysio    = new LoginPhysiotherapistUseCase(authRepo);
     const loginPatientEmail = new LoginPatientByEmailUseCase(patientRepo);


    // ============================================================
    // FASE 4: INSTANCIACIÓN DE CONTROLADORES (INTERFACE ADAPTERS)
    // Se agrupan los casos de uso por dominio en sus controladores.
    // ============================================================
    const patientController = new PatientController(
      createPatient, 
      listPatients, 
      updatePatient, 
      getPatientById
    );

    const physioController = new PhysiotherapistController(
  createPhysio,
  getPhysioById,
  approvePhysio,      // ← nuevo
  listPendingPhysio,  // ← nuevo
);

    const exerciseController = new ExerciseController(
      createExercise, 
      listExercises, 
      getExerciseById
    );

    const trackingController = new TrackingController(
      registerPain
    );

    const routineController = new RoutineController(
      createRoutine, 
      getPatientRoutine, 
      getRoutineById, 
      getPatientRoutineHistory
    );

    const authController = new AuthController(
  registerPhysio,
  loginPhysio,
  loginPatientEmail  // ← antes era loginPatientGoogle
);



    // ============================================================
    // FASE 5: CONFIGURACIÓN DEL SERVIDOR EXPRESS
    // ============================================================
    const app: Application = express();
    
    app.use(cors()); // Habilitar peticiones desde Angular y App Móvil
    app.use(express.json()); // Habilitar lectura de JSON en el Body

    // ============================================================
    // FASE 6: REGISTRO DE RUTAS
    // ============================================================
    app.use("/api", buildRoutes({
  patientController,
  physioController,
  exerciseController,
  trackingController,
  routineController,
  authController,   // ← agregar esta línea
}));


    // ============================================================
    // FASE 7: LANZAMIENTO
    // ============================================================
    const port = Number(process.env.PORT) || 3000;
    app.use(errorHandler);
    app.listen(port, () => {
      console.log("--------------------------------------------------");
      console.log(`📡 API DE ACTIVA ESCUCHANDO`);
      console.log(`🔗 URL LOCAL: http://localhost:${port}`);
      console.log(`📝 ESTADO: Operativo`);
      console.log("--------------------------------------------------");
    });

  } catch (error) {
    console.error("❌ Error crítico durante el arranque:", error);
    process.exit(1);
  }
}

// Iniciar el proceso
bootstrap();