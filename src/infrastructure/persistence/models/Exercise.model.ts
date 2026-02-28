import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize";

export class ExerciseModel extends Model {}

ExerciseModel.init(
  {
    idEjercicio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING,
    body_zone: DataTypes.STRING,
    description: DataTypes.STRING,
    video_url: DataTypes.STRING,
  },
  { sequelize, tableName: "ejercicio", timestamps: false }
);