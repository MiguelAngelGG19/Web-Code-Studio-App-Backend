import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { IAuthRepository } from "../ports/IAuthRepository";
import { LoginPhysiotherapistDto } from "../dtos/auth.dto";
import { PhysiotherapistModel } from "../../infrastructure/persistence/sequelize/client";

export class LoginPhysiotherapistUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(dto: LoginPhysiotherapistDto): Promise<{ token: string; fisio: object }> {
    
    console.log("\n--- INICIANDO DEBUG DE LOGIN ---");
    console.log("1. Datos crudos que llegaron del frontend:", dto);

    // 1. Buscar fisio por email
    const fisio = await this.authRepo.findByEmail(dto.email);
    console.log("2. Lo que Sequelize nos trajo de la Base de Datos:", fisio);

    if (!fisio) {
      console.log("❌ ERROR: El correo no existe en la BD.");
      throw new Error("Credenciales incorrectas (Correo no encontrado).");
    }

    // 2. Verificar que la cuenta esté activa
    if (fisio.role !== "physio") {
      console.log("❌ ERROR: El rol no es physio. Es:", fisio.role);
      throw new Error("Tu cuenta aún no está activa. Contacta al administrador.");
    }

    // 3. Comparar contraseña
    console.log("3. Password plano del usuario:", dto.password);
    console.log("4. Password encriptado en la BD:", fisio.password);
    
    const passwordMatch = await bcrypt.compare(dto.password, fisio.password);
    console.log("5. ¿La validación de bcrypt fue exitosa?:", passwordMatch);

    if (!passwordMatch) {
      console.log("❌ ERROR: Las contraseñas no coinciden matemáticamente.");
      throw new Error("Credenciales incorrectas (Contraseña inválida).");
    }

    console.log("✅ ÉXITO: Generando Token JWT...");
    // 4. Generar JWT
    // 🔥 1. VAMOS A BUSCAR EL ESTATUS REAL A LA OTRA TABLA
    // (Asegúrate de importar PhysiotherapistModel en la parte de arriba del archivo usando Ctrl + .)
    const datosFisio: any = await PhysiotherapistModel.findOne({ where: { id_user: fisio.id_user } });
    const estatusReal = datosFisio ? datosFisio.status : 'pending_profile';

    // 2. Generar JWT
    const token = jwt.sign(
      {
        id: fisio.id_user, 
        email: fisio.email,
        role: fisio.role,
        status: estatusReal // <--- Ahora sí, metemos el estatus real que encontramos
      },
      process.env.JWT_SECRET || "secret_dev",
      { expiresIn: "8h" }
    );

    return {
      token,
      fisio: {
        id: fisio.id_user, 
        email: fisio.email,
        role: fisio.role,
        status: estatusReal 
      },
    };
  }
}