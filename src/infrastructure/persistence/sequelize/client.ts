import { Sequelize, DataTypes } from "sequelize";
import * as dotenv from "dotenv";

dotenv.config();

// 1. Instancia de conexión a MySQL
export const sequelize = new Sequelize(
  process.env.DB_NAME || "activa",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    port: Number(process.env.DB_PORT) || 3306,
    logging: false, 
  }
);

// 2. Definición del Modelo Fisioterapeuta
export const PhysiotherapistModel = sequelize.define(
  "Physiotherapist",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "idFisioterapeuta" },
    firstName: { type: DataTypes.STRING, field: "first_name" },
    lastNameP: { type: DataTypes.STRING, field: "last_name_p" },
    lastNameM: { type: DataTypes.STRING, field: "last_name_m" },
    birthYear: { type: DataTypes.INTEGER, field: "birth_year" },
    professionalLicense: { type: DataTypes.STRING, field: "professional_license", unique: true },
    curp: { type: DataTypes.STRING, field: "curp", unique: true },
  },
  { tableName: "fisioterapeuta", timestamps: false }
);

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
    email: { type: DataTypes.STRING, field: "email", unique: true }, // <-- ESTA LÍNEA ES CRÍTICA
    physiotherapistId: { type: DataTypes.INTEGER, field: "physiotherapist_id" },
  },
  { tableName: "paciente", timestamps: false }
);

// 4. Definición del Modelo Ejercicio
export const ExerciseModel = sequelize.define(
  "Exercise",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "idEjercicio" },
     name: { type: DataTypes.STRING, field: "name", unique: true },
    bodyZone: { type: DataTypes.STRING, field: "body_zone" },
    description: { type: DataTypes.TEXT, field: "description" },
    videoUrl: { type: DataTypes.STRING, field: "video_url" },
  },
  { tableName: "ejercicio", timestamps: false }
);

// 5. Definición del Modelo Seguimiento (Molestias/Dolor)
export const TrackingModel = sequelize.define(
  "Tracking",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "id" },
    startTime: { type: DataTypes.TIME, field: "start_time" },
    endTime: { type: DataTypes.TIME, field: "end_time" },
    painLevel: { type: DataTypes.INTEGER, field: "pain_level" }, // Nivel de dolor 1-10
    postObservations: { type: DataTypes.TEXT, field: "post_observations" },
    intraObservations: { type: DataTypes.TEXT, field: "intra_observations" },
    alert: { type: DataTypes.TINYINT, field: "alert" },
    routineId: { type: DataTypes.INTEGER, field: "routine_id" },
  },
  { tableName: "seguimiento_rutina", timestamps: false }
);
// 5. Definición del Modelo Rutina
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
  { tableName: "rutina", timestamps: false }
);

// 6. Definición de la Tabla Intermedia (Ejercicio <-> Rutina)
export const ExerciseRoutineModel = sequelize.define(
  "ExerciseRoutine",
  {
    exerciseId: { type: DataTypes.INTEGER, primaryKey: true, field: "exercise_id" },
    routineId: { type: DataTypes.INTEGER, primaryKey: true, field: "routine_id" },
  },
  { tableName: "ejercicio_has_rutina", timestamps: false }
);

// ==========================================
// 7. DEFINICIÓN DE RELACIONES (ASOCIACIONES)
// ==========================================

// Relación: Rutina <-> Ejercicio (Muchos a Muchos)
RoutineModel.belongsToMany(ExerciseModel, {
  through: ExerciseRoutineModel,
  foreignKey: "routine_id", // Cómo se llama la rutina en la tabla intermedia
  otherKey: "exercise_id",  // Cómo se llama el ejercicio en la tabla intermedia
  as: "exercises",          // El nombre del arreglo en el JSON final
});

ExerciseModel.belongsToMany(RoutineModel, {
  through: ExerciseRoutineModel,
  foreignKey: "exercise_id",
  otherKey: "routine_id",
  as: "routines",
});
