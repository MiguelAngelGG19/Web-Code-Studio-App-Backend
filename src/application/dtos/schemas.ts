import { z } from "zod";

// 1. Reglas para el Fisioterapeuta
export const PhysiotherapistSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 letras"),
  lastNameP: z.string().min(2, "El apellido paterno es obligatorio"),
  lastNameM: z.string().optional(),
  birthYear: z.number().int().min(1920).max(2005, "El fisioterapeuta debe ser mayor de edad"),
  professionalLicense: z.string().min(5, "La cédula profesional es obligatoria"),
  curp: z.string().length(18, "El CURP debe tener exactamente 18 caracteres")
});

// 2. Reglas para el Paciente
export const PatientSchema = z.object({
  firstName: z.string().min(2, "El nombre es obligatorio"),
  lastNameP: z.string().min(2, "El apellido paterno es obligatorio"),
  lastNameM: z.string().optional(),
  birthYear: z.number().int().min(1900, "Año de nacimiento inválido").max(new Date().getFullYear()),
  sex: z.string().length(1, "El sexo debe ser M o F"),
  height: z.number().positive("La estatura debe ser un número positivo"),
  weight: z.number().positive("El peso debe ser un número positivo"),
  email: z.string().email("Debe proporcionar un correo electrónico válido"),
  physiotherapistId: z.number().int().positive("El ID del fisioterapeuta es inválido")
});



// 3. Reglas para el Ejercicio
export const ExerciseSchema = z.object({
  name: z.string().min(3, "El nombre del ejercicio es obligatorio"),
  bodyZone: z.string().min(2, "La zona del cuerpo es obligatoria"),
  description: z.string().min(10, "La descripción debe ser más detallada"),
  videoUrl: z.string().url("Debe ser un enlace (URL) válido")
});

// 4. Reglas para el Seguimiento (Guardar Molestias)
export const TrackingSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  painLevel: z.number().int().min(1, "El dolor mínimo es 1").max(10, "El dolor máximo es 10"),
  postObservations: z.string().optional(),
  intraObservations: z.string().optional(),
  alert: z.number().int().min(0).max(1).optional(),
  routineId: z.number().int().positive("El ID de la rutina es obligatorio")
});

// NUEVO: Esquema para edición (todos los campos opcionales)
export const UpdatePatientSchema = PatientSchema.partial();