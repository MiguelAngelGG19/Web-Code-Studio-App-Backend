/**
 * Crea el primer usuario administrador (users.role = admin + fila en admin).
 * Uso desde la raíz del backend:
 *   npm run seed:admin
 *   npm run seed:admin -- admin@tu-dominio.com TuContraseñaSegura
 * Si el admin ya existe y no recuerdas la contraseña (login-admin 401):
 *   npm run seed:admin -- --reset admin@tu-dominio.com TuNuevaContraseña
 */
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import { Op, col, fn, where as sqlWhere } from "sequelize";
import { sequelize, UserModel, AdminModel } from "../src/infrastructure/persistence/sequelize/client";

async function main() {
  const argv = process.argv.slice(2);
  const reset = argv.includes("--reset");
  const positional = argv.filter((a) => a !== "--reset");
  const email = (positional[0] || "admin@activa.local").trim().toLowerCase();
  const password = positional[1] || "admin123";

  await sequelize.authenticate();
  await UserModel.sync();
  await AdminModel.sync();

  const adminWhere = {
    role: "admin" as const,
    [Op.and]: sqlWhere(fn("LOWER", col("email")), email),
  };

  const exists = await UserModel.findOne({ where: adminWhere });
  if (exists) {
    if (reset) {
      const hash = await bcrypt.hash(password, 10);
      await UserModel.update({ password: hash, email }, { where: { id_user: exists.get("id_user") as number } });
      console.log("Contraseña de administrador actualizada:", email);
      await sequelize.close();
      return;
    }
    console.log("Ya existe un administrador con ese correo.");
    console.log("Si el panel devuelve 401, restablece la contraseña con:");
    console.log(`  npm run seed:admin -- --reset ${email} <nueva_contraseña>`);
    await sequelize.close();
    return;
  }

  if (reset) {
    console.error("No hay administrador con ese correo; omite --reset para crear uno.");
    await sequelize.close();
    process.exitCode = 1;
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const t = await sequelize.transaction();
  try {
    const user = await UserModel.create(
      { email, password: hash, role: "admin" },
      { transaction: t }
    );
    const idUser = (user.get({ plain: true }) as any).id_user;
    await AdminModel.create({ name: "Administrador", id_user: idUser }, { transaction: t });
    await t.commit();
    console.log("Administrador creado:", email);
  } catch (e) {
    await t.rollback();
    console.error(e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
