/**
 * **************************************************************************
 * MÓDULO DE PERSISTENCIA - SEQUELIZE CLIENT
 * PROYECTO: ACTIVA
 * DESCRIPCIÓN: Configuración de conexión y definición del Modelo Entidad-Relación.
 * **************************************************************************
 */

import { Sequelize, DataTypes, Model } from "sequelize";
import * as dotenv from "dotenv";

dotenv.config();

// ============================================================
// 1. CONFIGURACIÓN DE CONEXIÓN (POOL DE CONEXIONES)
// ============================================================
export const sequelize = new Sequelize(
  process.env.DB_NAME || "activa",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    port: Number(process.env.DB_PORT) || 3306,
    logging: false, // Desactivado para mantener la consola limpia
    define: {
      timestamps: false, // Las tablas no usan createdAt/updatedAt por defecto
      freezeTableName: true // Evita que Sequelize pluralice los nombres de las tablas
    }
  }
);

// ============================================================
// 2. DEFINICIÓN DE MODELOS (TABLAS)
// ============================================================

/**
 * Modelo: Fisioterapeuta
 * Representa al especialista médico que gestiona pacientes y rutinas.
 */
export const PhysiotherapistModel = sequelize.define(
  "Physiotherapist",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "idFisioterapeuta" },
    firstName: { type: DataTypes.STRING, field: "first_name" },
    lastNameP: { type: DataTypes.STRING, field: "last_name_p" },
    lastNameM: { type: DataTypes.STRING, field: "last_name_m" },
    birthYear: { type: DataTypes.INTEGER, field: "birth_year" },
    email: { type: DataTypes.STRING, field: "email", unique: true },
    password: { type: DataTypes.STRING, field: "password" },
    professionalLicense: { type: DataTypes.STRING, field: "professional_license", unique: true },
    curp: { type: DataTypes.STRING, field: "curp", unique: true },
  },
  { tableName: "fisioterapeuta" }
);

/**
 * Modelo: Paciente
 * Información clínica y física del usuario final.
 */
export const PatientModel = sequelize.define(
  "Patient",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "idPaciente" },
    firstName: { type: DataTypes.STRING, field: "first_name" },
    lastNameP: { type: DataTypes.STRING, field: "last_name_p" },
    lastNameM: { type: DataTypes.STRING, field: "last_name_m" },
    birthYear: { type: DataTypes.INTEGER, field: "birth_year" },
    sex: { type: DataTypes.STRING, field: "sex" },
    height: { type: DataTypes.FLOAT, field: "height" },
    weight: { type: DataTypes.FLOAT, field: "weight" },
    email: { type: DataTypes.STRING, field: "email", unique: true },
    physiotherapistId: { type: DataTypes.INTEGER, field: "physiotherapist_id" },
  },
  { tableName: "paciente" }
);

/**
 * Modelo: Ejercicio
 * Catálogo multimedia de movimientos de rehabilitación.
 */
export const ExerciseModel = sequelize.define(
  "Exercise",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "idEjercicio" },
    name: { type: DataTypes.STRING, field: "name", unique: true },
    bodyZone: { type: DataTypes.STRING, field: "body_zone" },
    description: { type: DataTypes.TEXT, field: "description" },
    videoUrl: { type: DataTypes.STRING, field: "video_url" },
  },
  { tableName: "ejercicio" }
);

/**
 * Modelo: Rutina
 * La "Receta" que une a un paciente con un set de ejercicios y fechas.
 */
export const RoutineModel = sequelize.define(
  "Routine",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "idRutina" },
    name: { type: DataTypes.STRING, field: "name" },
    startDate: { type: DataTypes.DATEONLY, field: "start_date" },
    endDate: { type: DataTypes.DATEONLY, field: "end_date" },
    physiotherapistId: { type: DataTypes.INTEGER, field: "physiotherapist_id" },
    patientId: { type: DataTypes.INTEGER, field: "patient_id" },
  },
  { tableName: "rutina" }
);

/**
 * Modelo: Seguimiento (Tracking)
 * Registro diario del nivel de dolor y observaciones del paciente.
 */
export const TrackingModel = sequelize.define(
  "Tracking",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id" },
    startTime: { type: DataTypes.TIME, field: "start_time" },
    endTime: { type: DataTypes.TIME, field: "end_time" },
    painLevel: { type: DataTypes.INTEGER, field: "pain_level" },
    postObservations: { type: DataTypes.TEXT, field: "post_observations" },
    intraObservations: { type: DataTypes.TEXT, field: "intra_observations" },
    alert: { type: DataTypes.TINYINT, field: "alert" },
    routineId: { type: DataTypes.INTEGER, field: "routine_id" },
  },
  { tableName: "seguimiento_rutina" }
);

/**
 * Modelo Intermedio: Ejercicio_has_Rutina
 * Tabla técnica para la relación de Muchos a Muchos.
 */
export const ExerciseRoutineModel = sequelize.define(
  "ExerciseRoutine",
  {
    exerciseId: { type: DataTypes.INTEGER, primaryKey: true, field: "exercise_id" },
    routineId: { type: DataTypes.INTEGER, primaryKey: true, field: "routine_id" },
  },
  { tableName: "ejercicio_has_rutina" }
);

// ============================================================
// 3. DEFINICIÓN DE ASOCIACIONES (RELACIONES)
// ============================================================

/**
 * Relación: RUTINA <-> EJERCICIO (Muchos a Muchos)
 * Una rutina contiene varios ejercicios, y un ejercicio puede estar en muchas rutinas.
 */
RoutineModel.belongsToMany(ExerciseModel, {
  through: ExerciseRoutineModel,
  foreignKey: "routine_id",
  otherKey: "exercise_id",
  as: "exercises", // Alias para el JSON: data.exercises
});

ExerciseModel.belongsToMany(RoutineModel, {
  through: ExerciseRoutineModel,
  foreignKey: "exercise_id",
  otherKey: "routine_id",
  as: "routines",
});

/**
 * Relación: FISIOTERAPEUTA -> PACIENTE (Uno a Muchos)
 */
PhysiotherapistModel.hasMany(PatientModel, { foreignKey: "physiotherapist_id", as: "patients" });
PatientModel.belongsTo(PhysiotherapistModel, { foreignKey: "physiotherapist_id" });

/**
 * Relación: RUTINA -> TRACKING (Uno a Muchos)
 */
RoutineModel.hasMany(TrackingModel, { foreignKey: "routine_id", as: "logs" });
TrackingModel.belongsTo(RoutineModel, { foreignKey: "routine_id" });