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

// 3. Definición del Modelo Paciente
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

