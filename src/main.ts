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
import path from "path";

// Auth
import { SequelizeAuthRepository } from "./infrastructure/persistence/repositories/SequelizeAuthRepository";
import { RegisterPhysiotherapistUseCase } from "./application/use-cases/RegisterPhysiotherapist.uc";
import { LoginPhysiotherapistUseCase } from "./application/use-cases/LoginPhysiotherapist.uc";
import { AuthController } from "./infrastructure/http/controllers/auth.controller";
import { LoginPatientWithGoogleUseCase } from "./application/use-cases/LoginPatientWithGoogle.uc";
import { ApprovePhysiotherapistUseCase } from "./application/use-cases/ApprovePhysiotherapist.uc";
import { ListPendingPhysiotherapistsUseCase } from "./application/use-cases/ListPendingPhysiotherapists.uc";
import { LoginPatientByEmailUseCase } from "./application/use-cases/LoginPatientByEmail.uc";
import { LoginAdminUseCase } from "./application/use-cases/LoginAdmin.uc";

// Repositorios nuevos
import { SequelizeAppointmentRepository } from "./infrastructure/persistence/repositories/SequelizeAppointmentRepository";
import { SequelizeLogbookRepository } from "./infrastructure/persistence/repositories/SequelizeLogbookRepository";
import { SequelizeNotificationRepository } from "./infrastructure/persistence/repositories/SequelizeNotificationRepository";

// 1. INFRAESTRUCTURA CORE
import {
  sequelize,
  RoutineTemplateModel,
  RoutineTemplateExerciseModel,
  PatientMedicalDocumentModel,
} from "./infrastructure/persistence/sequelize/client";
import { buildRoutes } from "./infrastructure/http/routes";
import { errorHandler } from "./infrastructure/http/middlewares/error.middleware";

// 2. REPOSITORIOS (PERSISTENCIA)
import { SequelizePatientRepository } from "./infrastructure/persistence/repositories/SequelizePatientRepository";
import { SequelizePhysiotherapistRepository } from "./infrastructure/persistence/repositories/SequelizePhysiotherapistRepository";
import { SequelizeExerciseRepository } from "./infrastructure/persistence/repositories/SequelizeExerciseRepository";
import { SequelizeTrackingRepository } from "./infrastructure/persistence/repositories/SequelizeTrackingRepository";
import { SequelizeRoutineRepository } from "./infrastructure/persistence/repositories/SequelizeRoutineRepository";

// 🪄 NUEVO: Repositorio del Dashboard
import { SequelizeDashboardRepository } from "./infrastructure/persistence/repositories/SequelizeDashboardRepository";

// 3. CASOS DE USO (LÓGICA DE NEGOCIO)
// --- Pacientes ---
import { CreatePatientUseCase } from "./application/use-cases/CreatePatient.uc";
import { ListPatientsUseCase } from "./application/use-cases/ListPatients.uc";
import { UpdatePatientUseCase } from "./application/use-cases/UpdatePatient.uc";
import { GetPatientByIdUseCase } from "./application/use-cases/GetPatientById.uc";

// Use Cases — Citas
import { CreateAppointmentUseCase } from "./application/use-cases/CreateAppointment.uc";
import { GetAppointmentsByPatientUseCase } from "./application/use-cases/GetAppointmentsByPatient.uc";
import { UpdateAppointmentUseCase } from "./application/use-cases/UpdateAppointment.uc";
import { GetAppointmentsByPhysioUseCase } from './application/use-cases/GetAppointmentsByPhysio.uc';

// Use Cases — Bitácora
import { CreateLogbookUseCase } from "./application/use-cases/CreateLogbook.uc";
import { GetLogbookByAppointmentUseCase } from "./application/use-cases/GetLogbookByAppointment.uc";

// Use Cases — Notificaciones
import { CreateNotificationUseCase } from "./application/use-cases/CreateNotification.uc";
import { GetNotificationsByPatientUseCase } from "./application/use-cases/GetNotificationsByPatient.uc";
import { MarkNotificationAsReadUseCase } from "./application/use-cases/MarkNotificationAsRead.uc";

// --- Fisioterapeutas ---
import { CreatePhysiotherapistUseCase } from "./application/use-cases/CreatePhysiotherapist.uc";
import { GetPhysiotherapistByIdUseCase } from "./application/use-cases/GetPhysiotherapistById.uc";
import { UpdateEmailUseCase } from "./application/use-cases/UpdateEmail.uc";
import { UpdatePasswordUseCase } from "./application/use-cases/UpdatePassword.uc";

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
import { AddExercisesToRoutineUseCase } from "./application/use-cases/AddExercisesToRoutine.uc";
import { AddExercisesToTemplateUseCase } from "./application/use-cases/AddExercisesToTemplate.uc";
import { CreateRoutineTemplateUseCase } from "./application/use-cases/CreateRoutineTemplate.uc";
import { CreateRoutineTemplateDirectUseCase } from "./application/use-cases/CreateRoutineTemplateDirect.uc";
import { ListRoutineTemplatesUseCase } from "./application/use-cases/ListRoutineTemplates.uc";
import { GetRoutineTemplateByIdUseCase } from "./application/use-cases/GetRoutineTemplateById.uc";

// 🪄 NUEVO: Caso de uso del Dashboard
import { GetDashboardStatsUseCase } from "./application/use-cases/GetDashboardStats.uc";

// Admin
import { GetAdminOverviewUseCase } from "./application/use-cases/GetAdminOverview.uc";

// 💳 NUEVO: Caso de uso y controlador de Suscripciones (Stripe)
import { CreateCheckoutSessionUseCase } from "./application/use-cases/CreateCheckoutSession.uc";
import { SubscriptionController } from "./infrastructure/http/controllers/subscription.controller";

// 4. CONTROLADORES (HTTP INTERFACE)
import { PatientController } from "./infrastructure/http/controllers/patient.controller";
import { PhysiotherapistController } from "./infrastructure/http/controllers/physiotherapist.controller";
import { ExerciseController } from "./infrastructure/http/controllers/exercise.controller";
import { TrackingController } from "./infrastructure/http/controllers/tracking.controller";
import { RoutineController } from "./infrastructure/http/controllers/routine.controller";

// Controladores nuevos
import { AppointmentController } from "./infrastructure/http/controllers/appointment.controller";
import { LogbookController } from "./infrastructure/http/controllers/logbook.controller";
import { NotificationController } from "./infrastructure/http/controllers/notification.controller";

// 🪄 NUEVO: Controlador del Dashboard
import { DashboardController } from "./infrastructure/http/controllers/dashboard.controller";
import { DocumentController } from "./infrastructure/http/controllers/document.controller";
import { AdminController } from "./infrastructure/http/controllers/admin.controller";

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
    await RoutineTemplateModel.sync();
    await RoutineTemplateExerciseModel.sync();
    await PatientMedicalDocumentModel.sync();

    // ============================================================
    // FASE 2: INSTANCIACIÓN DE REPOSITORIOS (INFRAESTRUCTURA)
    // ============================================================
    const patientRepo = new SequelizePatientRepository();
    const physioRepo = new SequelizePhysiotherapistRepository();
    const exerciseRepo = new SequelizeExerciseRepository();
    const trackingRepo = new SequelizeTrackingRepository();
    const routineRepo = new SequelizeRoutineRepository();
    const authRepo = new SequelizeAuthRepository();
    const appointmentRepo = new SequelizeAppointmentRepository();
    const logbookRepo = new SequelizeLogbookRepository();
    const notificationRepo = new SequelizeNotificationRepository();

    // 🪄 NUEVO: Instanciamos el repo del dashboard
    const dashboardRepo = new SequelizeDashboardRepository();

    // ============================================================
    // FASE 3: INSTANCIACIÓN DE CASOS DE USO (APLICACIÓN)
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
    const approvePhysio = new ApprovePhysiotherapistUseCase(physioRepo);
    const listPendingPhysio = new ListPendingPhysiotherapistsUseCase(physioRepo);

    // Casos de Uso: Ejercicios
    const createExercise = new CreateExerciseUseCase(exerciseRepo);
    const listExercises = new ListExercisesUseCase(exerciseRepo);
    const getExerciseById = new GetExerciseByIdUseCase(exerciseRepo);

    // Casos de Uso: Rutinas
    const createRoutine = new CreateRoutineUseCase(routineRepo);
    const getPatientRoutine = new GetPatientRoutineUseCase(routineRepo);
    const getRoutineById = new GetRoutineByIdUseCase(routineRepo);
    const getPatientRoutineHistory = new GetPatientRoutineHistoryUseCase(routineRepo);
    const createRoutineTemplate = new CreateRoutineTemplateUseCase(routineRepo);
    const createRoutineTemplateDirect = new CreateRoutineTemplateDirectUseCase(routineRepo);
    const listRoutineTemplates = new ListRoutineTemplatesUseCase(routineRepo);
    const getRoutineTemplateById = new GetRoutineTemplateByIdUseCase(routineRepo);
    const addExercisesToTemplate = new AddExercisesToTemplateUseCase(routineRepo);

    // Casos de Uso: Auth
    const registerPhysio = new RegisterPhysiotherapistUseCase(authRepo);
    const loginPhysio = new LoginPhysiotherapistUseCase(authRepo);
    const loginPatientEmail = new LoginPatientByEmailUseCase(patientRepo);
    const updateEmail = new UpdateEmailUseCase(authRepo);
    const updatePassword = new UpdatePasswordUseCase(authRepo);
    const loginAdmin = new LoginAdminUseCase();

    // Citas
    const createAppointment = new CreateAppointmentUseCase(appointmentRepo);
    const getAppointmentsByPatient = new GetAppointmentsByPatientUseCase(appointmentRepo);
    const updateAppointment = new UpdateAppointmentUseCase(appointmentRepo);

    // Bitácora
    const createLogbook = new CreateLogbookUseCase(logbookRepo);
    const getLogbookByAppointment = new GetLogbookByAppointmentUseCase(logbookRepo);

    // Notificaciones
    const createNotification = new CreateNotificationUseCase(notificationRepo);
    const getNotificationsByPatient = new GetNotificationsByPatientUseCase(notificationRepo);
    const markNotificationAsRead = new MarkNotificationAsReadUseCase(notificationRepo);

    // Seguimiento
    const registerPain = new RegisterPainLevelUseCase(trackingRepo, routineRepo, createNotification);

    // 🪄 NUEVO: Instanciamos el caso de uso del dashboard
    const getDashboardStats = new GetDashboardStatsUseCase(dashboardRepo);

    // Admin
    const getAdminOverview = new GetAdminOverviewUseCase();

    // 💳 NUEVO: Instanciamos el caso de uso de Suscripciones (Stripe)
    const createCheckoutSession = new CreateCheckoutSessionUseCase();

    // ============================================================
    // FASE 4: INSTANCIACIÓN DE CONTROLADORES (INTERFACE ADAPTERS)
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
      approvePhysio,
      listPendingPhysio,
    );

    const exerciseController = new ExerciseController(
      createExercise,
      listExercises,
      getExerciseById
    );

    const trackingController = new TrackingController(
      registerPain
    );

    const addExercisesToRoutine = new AddExercisesToRoutineUseCase(routineRepo);

    const routineController = new RoutineController(
      createRoutine,
      getPatientRoutine,
      getRoutineById,
      getPatientRoutineHistory,
      addExercisesToRoutine,
      addExercisesToTemplate,
      createRoutineTemplate,
      createRoutineTemplateDirect,
      listRoutineTemplates,
      getRoutineTemplateById,
    );

    const authController = new AuthController(
      registerPhysio,
      loginPhysio,
      loginPatientEmail,
      updateEmail,
      updatePassword,
      loginAdmin
    );

    const getAppointmentsByPhysioUseCase = new GetAppointmentsByPhysioUseCase(appointmentRepo);
    const appointmentController = new AppointmentController(
      createAppointment,
      getAppointmentsByPatient,
      updateAppointment,
      getAppointmentsByPhysioUseCase
    );

    const logbookController = new LogbookController(
      createLogbook,
      getLogbookByAppointment
    );

    const notificationController = new NotificationController(
      createNotification,
      getNotificationsByPatient,
      markNotificationAsRead
    );

    // 🪄 NUEVO: Instanciamos el controlador del dashboard
    const dashboardController = new DashboardController(getDashboardStats);
    const documentController = new DocumentController();
    const adminController = new AdminController(getAdminOverview);

    // 💳 NUEVO: Instanciamos el controlador de Suscripciones
    const subscriptionController = new SubscriptionController(createCheckoutSession);

    // ============================================================
    // FASE 5: CONFIGURACIÓN DEL SERVIDOR EXPRESS
    // ============================================================
    const app: Application = express();

    app.use(cors());
    app.use(express.json());
    app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

    // ============================================================
    // FASE 6: REGISTRO DE RUTAS
    // ============================================================
    app.use("/api", buildRoutes({
      patientController,
      physioController,
      exerciseController,
      trackingController,
      routineController,
      authController,
      appointmentController,
      logbookController,
      notificationController,
      dashboardController,
      documentController,
      subscriptionController,
      adminController,
    }));

    // ============================================================
    // FASE 7: LANZAMIENTO
    // ============================================================
    const port = Number(process.env.PORT) || 3000;
    app.use(errorHandler);
    app.listen(port, '0.0.0.0', () => {
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
