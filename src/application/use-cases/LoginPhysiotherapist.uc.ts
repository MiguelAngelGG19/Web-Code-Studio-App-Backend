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
    
    // 1. VAMOS A BUSCAR EL ESTATUS Y LOS NOMBRES A LA OTRA TABLA
    const datosFisio: any = await PhysiotherapistModel.findOne({ where: { id_user: fisio.id_user } });
    
    const estatusReal = datosFisio ? datosFisio.status : 'pending_profile';
    
    // 🪄 EXTRAEMOS LOS NOMBRES DE LA BASE DE DATOS
    const firstName = datosFisio ? datosFisio.first_name : '';
    const lastNameP = datosFisio ? datosFisio.last_name_paternal : '';

    // 2. Generar JWT
    const token = jwt.sign(
      {
        id: fisio.id_user, 
        email: fisio.email,
        role: fisio.role,
        status: estatusReal,
        // 🪄 ¡LOS AGREGAMOS AL TOKEN AQUÍ!
        first_name: firstName,
        last_name_paternal: lastNameP
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
        status: estatusReal,
        first_name: firstName,     // También los devolvemos en el body por si acaso
        last_name_paternal: lastNameP
      },
    };
  }
}