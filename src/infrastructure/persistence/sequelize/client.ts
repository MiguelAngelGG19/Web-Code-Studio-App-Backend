/**
 * **************************************************************************
 * MÓDULO DE PERSISTENCIA - SEQUELIZE CLIENT
 * PROYECTO: ACTIVA
 * BD: Nueva estructura en inglés - Versión final
 * **************************************************************************
 */

import { Sequelize, DataTypes, Model } from "sequelize";
import * as dotenv from "dotenv";
dotenv.config();

// ============================================================
// 1. CONEXIÓN
// ============================================================
export const sequelize = new Sequelize(
  process.env.DB_NAME || "activa",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    port: Number(process.env.DB_PORT) || 3306,
    logging: false,
    define: { timestamps: false, freezeTableName: true }
  }
);

// ============================================================
// 2. MODELOS
// ============================================================

// --- USERS ---
export const UserModel = sequelize.define("User", {
  id_user: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: true },
  google_id: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.ENUM("admin", "physio", "patient"), allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: "users" });

// --- ADMIN ---
export const AdminModel = sequelize.define("Admin", {
  id_admin: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  id_user: { type: DataTypes.INTEGER, allowNull: false, unique: true }
}, { tableName: "admin" });

// --- PHYSIOTHERAPIST ---
export const PhysiotherapistModel = sequelize.define("Physiotherapist", {
  id_physio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  first_name: { type: DataTypes.STRING, allowNull: false },
  last_name_paternal: { type: DataTypes.STRING },
  last_name_maternal: { type: DataTypes.STRING },
  birth_date: { type: DataTypes.DATEONLY },
  professional_license: { type: DataTypes.STRING },
  license_doc_url: { type: DataTypes.TEXT, allowNull: true },
  curp: { type: DataTypes.STRING },
  ine_doc_url: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM("pending_profile", "pending_approval", "approved", "rejected"), defaultValue: "pending_profile" },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  id_user: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  id_admin: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: "physiotherapist" });

// --- PATIENT ---
export const PatientModel = sequelize.define("Patient", {
  id_patient: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  first_name: { type: DataTypes.STRING, allowNull: false },
  last_name_paternal: { type: DataTypes.STRING },
  last_name_maternal: { type: DataTypes.STRING },
  birth_date: { type: DataTypes.DATEONLY },
  gender: { type: DataTypes.ENUM("M", "F", "Other") },
  height: { type: DataTypes.DECIMAL(5, 2) },
  weight: { type: DataTypes.DECIMAL(5, 2) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  id_user: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  id_physio: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: "patient" });

// --- SCHEDULE ---
export const ScheduleModel = sequelize.define("Schedule", {
  id_schedule: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  day_of_week: { type: DataTypes.ENUM("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"), allowNull: false },
  start_time: { type: DataTypes.TIME, allowNull: false },
  end_time: { type: DataTypes.TIME, allowNull: false },
  id_physio: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: "schedule" });

// --- APPOINTMENT ---
export const AppointmentModel = sequelize.define("Appointment", {
  id_appointment: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  start_time: { type: DataTypes.TIME, allowNull: false },
  end_time: { type: DataTypes.TIME, allowNull: false },
  status: { type: DataTypes.ENUM("pending", "confirmed", "cancelled", "completed"), defaultValue: "pending" },
  notes: { type: DataTypes.TEXT, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  id_patient: { type: DataTypes.INTEGER, allowNull: false },
  id_physio: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: "appointment" });

// --- LOGBOOK ---
export const LogbookModel = sequelize.define("Logbook", {
  id_logbook: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  observations: { type: DataTypes.TEXT, allowNull: true },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  id_appointment: { type: DataTypes.INTEGER, allowNull: false, unique: true }
}, { tableName: "logbook" });

// --- EXERCISE ---
// video_url: ruta servida bajo /uploads/exercises/... (TEXT; null si aún no hay archivo)
export const ExerciseModel = sequelize.define("Exercise", {
  id_exercise: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  body_zone: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  video_url: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "exercise" });

// --- ROUTINE ---
export const RoutineModel = sequelize.define("Routine", {
  id_routine: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  start_date: { type: DataTypes.DATEONLY },
  end_date: { type: DataTypes.DATEONLY },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  id_patient: { type: DataTypes.INTEGER, allowNull: false },
  id_physio: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: "routine" });

// --- ROUTINE_EXERCISE ---
export const RoutineExerciseModel = sequelize.define("RoutineExercise", {
  id_routine: { type: DataTypes.INTEGER, primaryKey: true },
  id_exercise: { type: DataTypes.INTEGER, primaryKey: true },
  repetitions: { type: DataTypes.INTEGER },
  sets: { type: DataTypes.INTEGER },
  exercise_order: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT }
}, { tableName: "routine_exercise" });

// --- ROUTINE_TEMPLATE ---
export const RoutineTemplateModel = sequelize.define("RoutineTemplate", {
  id_template: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  tag: { type: DataTypes.STRING, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  id_physio: { type: DataTypes.INTEGER, allowNull: false },
  source_routine_id: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: "routine_template" });

// --- ROUTINE_TEMPLATE_EXERCISE ---
export const RoutineTemplateExerciseModel = sequelize.define("RoutineTemplateExercise", {
  id_template: { type: DataTypes.INTEGER, primaryKey: true },
  id_exercise: { type: DataTypes.INTEGER, primaryKey: true },
  repetitions: { type: DataTypes.INTEGER },
  sets: { type: DataTypes.INTEGER },
  exercise_order: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT }
}, { tableName: "routine_template_exercise" });

// --- TRACKING ---
export const TrackingModel = sequelize.define("Tracking", {
  id_tracking: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  completed: { type: DataTypes.TINYINT, defaultValue: 0 },
  pain_level: { type: DataTypes.INTEGER },
  feedback: { type: DataTypes.TEXT },
  interrupted: { type: DataTypes.TINYINT, defaultValue: 0 },
  notes: { type: DataTypes.TEXT },
  id_routine: { type: DataTypes.INTEGER, allowNull: false },
  id_exercise: { type: DataTypes.INTEGER, allowNull: true },
  id_patient: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: "tracking" });

// --- NOTIFICATION ---
export const NotificationModel = sequelize.define("Notification", {
  id_notification: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.STRING },
  message: { type: DataTypes.TEXT },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  is_read: { type: DataTypes.TINYINT, defaultValue: 0 },
  origin: { type: DataTypes.ENUM("system", "physio"), defaultValue: "system" },
  id_patient: { type: DataTypes.INTEGER, allowNull: true },
  id_physio: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: "notification" });

// ============================================================
// 3. ASOCIACIONES
// ============================================================

// User → Physio / Patient / Admin
UserModel.hasOne(PhysiotherapistModel, { foreignKey: "id_user" });
PhysiotherapistModel.belongsTo(UserModel, { foreignKey: "id_user" });

UserModel.hasOne(PatientModel, { foreignKey: "id_user" });
PatientModel.belongsTo(UserModel, { foreignKey: "id_user" });

UserModel.hasOne(AdminModel, { foreignKey: "id_user" });
AdminModel.belongsTo(UserModel, { foreignKey: "id_user" });

// Physio → Patients
PhysiotherapistModel.hasMany(PatientModel, { foreignKey: "id_physio", as: "patients" });
PatientModel.belongsTo(PhysiotherapistModel, { foreignKey: "id_physio" });

// Physio → Schedules
PhysiotherapistModel.hasMany(ScheduleModel, { foreignKey: "id_physio", as: "schedules" });
ScheduleModel.belongsTo(PhysiotherapistModel, { foreignKey: "id_physio" });

// Appointments
PhysiotherapistModel.hasMany(AppointmentModel, { foreignKey: "id_physio", as: "appointments" });
PatientModel.hasMany(AppointmentModel, { foreignKey: "id_patient", as: "appointments" });
AppointmentModel.belongsTo(PatientModel, { foreignKey: "id_patient" });
AppointmentModel.belongsTo(PhysiotherapistModel, { foreignKey: "id_physio" });

// Logbook → Appointment
AppointmentModel.hasOne(LogbookModel, { foreignKey: "id_appointment", as: "logbook" });
LogbookModel.belongsTo(AppointmentModel, { foreignKey: "id_appointment" });

// Routine
PhysiotherapistModel.hasMany(RoutineModel, { foreignKey: "id_physio", as: "routines" });
PatientModel.hasMany(RoutineModel, { foreignKey: "id_patient", as: "routines" });
RoutineModel.belongsTo(PatientModel, { foreignKey: "id_patient" });
RoutineModel.belongsTo(PhysiotherapistModel, { foreignKey: "id_physio" });

// Routine ↔ Exercise (Muchos a Muchos)
RoutineModel.belongsToMany(ExerciseModel, {
  through: RoutineExerciseModel,
  foreignKey: "id_routine",
  otherKey: "id_exercise",
  as: "exercises"
});
ExerciseModel.belongsToMany(RoutineModel, {
  through: RoutineExerciseModel,
  foreignKey: "id_exercise",
  otherKey: "id_routine",
  as: "routines"
});

// Plantillas de rutina
PhysiotherapistModel.hasMany(RoutineTemplateModel, { foreignKey: "id_physio", as: "routineTemplates" });
RoutineTemplateModel.belongsTo(PhysiotherapistModel, { foreignKey: "id_physio" });

RoutineTemplateModel.belongsToMany(ExerciseModel, {
  through: RoutineTemplateExerciseModel,
  foreignKey: "id_template",
  otherKey: "id_exercise",
  as: "exercises"
});
ExerciseModel.belongsToMany(RoutineTemplateModel, {
  through: RoutineTemplateExerciseModel,
  foreignKey: "id_exercise",
  otherKey: "id_template",
  as: "routineTemplates"
});

// Tracking
RoutineModel.hasMany(TrackingModel, { foreignKey: "id_routine", as: "tracking" });
ExerciseModel.hasMany(TrackingModel, { foreignKey: "id_exercise", as: "tracking", constraints: false });
PatientModel.hasMany(TrackingModel, { foreignKey: "id_patient", as: "tracking" });
TrackingModel.belongsTo(RoutineModel, { foreignKey: "id_routine" });
TrackingModel.belongsTo(ExerciseModel, { foreignKey: "id_exercise", constraints: false });
TrackingModel.belongsTo(PatientModel, { foreignKey: "id_patient" });

// Notifications
PatientModel.hasMany(NotificationModel, { foreignKey: "id_patient", as: "notifications" });
PhysiotherapistModel.hasMany(NotificationModel, { foreignKey: "id_physio", as: "notifications" });
NotificationModel.belongsTo(PatientModel, { foreignKey: "id_patient" });
NotificationModel.belongsTo(PhysiotherapistModel, { foreignKey: "id_physio" });
