import { Patient } from "../../../domain/entities/Patient";
import { CreatePatientDTO } from "../../dtos/patient.dto";

export type UpdatePatientDTO = Partial<CreatePatientDTO>;

export interface PatientRepository {
  
  // 🪄 1. Cambiamos a 'any' para permitir que reciba el paquete combinado (UserData + PatientData) 
  // necesario para hacer la transacción de guardado seguro.
  create(data: any): Promise<Patient>;
  
  // 🪄 2. Cambiamos los parámetros sueltos por un objeto 'params' que ahora exige 
  // obligatoriamente el id_physio para garantizar el aislamiento de datos.
  findAll(params: { limit: number; offset: number; id_physio: number }): Promise<{ rows: Patient[]; count: number }>;
  
  update(id: number, data: UpdatePatientDTO): Promise<Patient | null>;
  
  findById(id: number): Promise<Patient | null>;
  
  findByEmail(email: string): Promise<any | null>;

}