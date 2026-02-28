import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize";

export class PatientModel extends Model {}

PatientModel.init(
  {
    idPaciente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    first_name: DataTypes.STRING,
    last_name_p: DataTypes.STRING,
    last_name_m: DataTypes.STRING,
    birth_year: DataTypes.INTEGER,
    sex: DataTypes.STRING,
    height: DataTypes.DECIMAL,
    weight: DataTypes.DECIMAL,
    created_at: DataTypes.DATE,
    physiotherapist_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: "paciente", timestamps: false }
);