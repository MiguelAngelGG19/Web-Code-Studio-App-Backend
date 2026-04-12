import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { IAuthRepository } from "../ports/IAuthRepository";
import { AdminModel } from "../../infrastructure/persistence/sequelize/client";

export class LoginAdminUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(dto: { email: string; password: string }): Promise<{ token: string; admin: object }> {

    // 1. Buscar usuario por email
    const user = await this.authRepo.findByEmail(dto.email);

    if (!user) {
      throw new Error("Credenciales incorrectas.");
    }

    // 2. Verificar que el rol sea admin
    if (user.role !== "admin") {
      throw new Error("Acceso denegado. No tienes permisos de administrador.");
    }

    // 3. Comparar contraseña
    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new Error("Credenciales incorrectas.");
    }

    // 4. Buscar datos del admin en la tabla admin
    const adminData: any = await AdminModel.findOne({ where: { id_user: user.id_user } });

    const adminName = adminData ? adminData.name : "Administrador";
    const idAdmin = adminData ? adminData.id_admin : null;

    // 5. Generar JWT
    const token = jwt.sign(
      {
        id: user.id_user,
        id_admin: idAdmin,
        email: user.email,
        role: user.role,
        name: adminName,
      },
      process.env.JWT_SECRET || "secret_dev",
      { expiresIn: "8h" }
    );

    return {
      token,
      admin: {
        id: user.id_user,
        id_admin: idAdmin,
        email: user.email,
        role: user.role,
        name: adminName,
      },
    };
  }
}
