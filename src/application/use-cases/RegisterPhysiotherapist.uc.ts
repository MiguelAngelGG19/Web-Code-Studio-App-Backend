import bcrypt from "bcrypt";
import { IAuthRepository } from "../ports/IAuthRepository";
import { RegisterPhysiotherapistDto } from "../dtos/auth.dto";

export class RegisterPhysiotherapistUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(dto: RegisterPhysiotherapistDto): Promise<{ message: string }> {
    // 1. Verificar si el email ya existe
    const existing = await this.authRepo.findByEmail(dto.email);
    if (existing) {
      throw new Error("Ya existe un fisioterapeuta con ese correo.");
    }

    // 2. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Guardar en BD con status 'activo' (para el proyecto escolar)
    await this.authRepo.register({
      ...dto,
      password: hashedPassword,
    });

    return { message: "Fisioterapeuta registrado exitosamente." };
  }
}
