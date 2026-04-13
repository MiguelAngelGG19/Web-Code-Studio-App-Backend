import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { QueryTypes } from "sequelize";
import { AdminModel, sequelize } from "../../infrastructure/persistence/sequelize/client";

type AdminUserRow = {
  id_user: number;
  email: string;
  password: string | null;
  role: string;
};

export class LoginAdminUseCase {
  async execute(
    email: string,
    password: string
  ): Promise<{ token: string; admin: { id: number; email: string; name: string } }> {
    const normalized = email.trim().toLowerCase();
    // Consulta directa: evita rarezas de Sequelize + LOWER() en algunos MySQL.
    const rows = await sequelize.query<AdminUserRow>(
      `
      SELECT id_user, email, password, role
      FROM users
      WHERE LOWER(TRIM(email)) = :normalized
      LIMIT 1
      `,
      { replacements: { normalized }, type: QueryTypes.SELECT }
    );
    const plain = rows[0];
    if (!plain) {
      throw new Error("Credenciales incorrectas.");
    }
    if (String(plain.role ?? "").toLowerCase() !== "admin") {
      throw new Error("Credenciales incorrectas.");
    }

    const hash =
      typeof plain.password === "string" ? plain.password : String(plain.password ?? "");
    if (!hash) {
      throw new Error("Credenciales incorrectas.");
    }

    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      throw new Error("Credenciales incorrectas.");
    }

    const adminRow = await AdminModel.findOne({ where: { id_user: plain.id_user } });
    const adminPlain = adminRow ? (adminRow.get({ plain: true }) as any) : null;
    const name = adminPlain?.name || "Administrador";

    const token = jwt.sign(
      { id: plain.id_user, role: "admin", email: plain.email },
      process.env.JWT_SECRET || "secret_dev",
      { expiresIn: "8h" }
    );

    return {
      token,
      admin: {
        id: plain.id_user,
        email: plain.email,
        name,
      },
    };
  }
}
