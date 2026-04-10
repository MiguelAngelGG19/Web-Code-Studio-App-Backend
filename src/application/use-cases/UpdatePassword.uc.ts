import bcrypt from "bcrypt";
import { IAuthRepository } from "../ports/IAuthRepository";

export class UpdatePasswordUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(idUser: number, oldPass: string, newPass: string): Promise<{ message: string }> {
    const user = await this.authRepo.findById(idUser);
    if (!user) throw new Error("Usuario no encontrado.");

    // 1. Verificamos la contraseña actual (Agregué validación doble por si en BD está sin encriptar por tus pruebas)
    const passwordMatch = await bcrypt.compare(oldPass, user.password);
    if (!passwordMatch && oldPass !== user.password) {
      throw new Error("La contraseña actual es incorrecta.");
    }

    // 2. Encriptamos la nueva contraseña de forma segura
    const hashedNewPassword = await bcrypt.hash(newPass, 10);

    // 3. Guardamos en la Base de Datos
    await this.authRepo.updatePassword(idUser, hashedNewPassword);
    
    return { message: "Contraseña actualizada exitosamente." };
  }
}