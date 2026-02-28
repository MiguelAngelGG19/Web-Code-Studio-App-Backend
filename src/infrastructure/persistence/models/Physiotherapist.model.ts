import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize";

export class PhysiotherapistModel extends Model {}

PhysiotherapistModel.init(
  {
    idFisioterapeuta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    first_name: DataTypes.STRING,
    last_name_p: DataTypes.STRING,
    last_name_m: DataTypes.STRING,
    birth_year: DataTypes.INTEGER,
    professional_license: DataTypes.STRING,
    license_doc_url: DataTypes.STRING,
    curp: DataTypes.STRING,
    ine_doc_url: DataTypes.STRING,
    created_at: DataTypes.DATE,
  },
  { sequelize, tableName: "fisioterapeuta", timestamps: false }
);