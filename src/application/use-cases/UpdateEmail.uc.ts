import { IAuthRepository } from "../ports/IAuthRepository";

export class UpdateEmailUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(idUser: number, newEmail: string): Promise<{ message: string }> {
    // 1. Verificamos si alguien más ya usa ese correo
    const existingUser = await this.authRepo.findByEmail(newEmail);
    
    if (existingUser && existingUser.id_user !== idUser) {
      throw new Error("Este correo electrónico ya está registrado en otra cuenta.");
    }

    // 2. Si está libre, lo actualizamos
    await this.authRepo.updateEmail(idUser, newEmail);
    return { message: "Correo actualizado exitosamente." };
  }
}