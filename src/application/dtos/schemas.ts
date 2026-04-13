import { z } from "zod";

// 1. Reglas para el Fisioterapeuta
export const PhysiotherapistSchema = z.object({
  firstName:           z.string().min(2, "El nombre debe tener al menos 2 letras"),
  lastNameP:           z.string().min(2, "El apellido paterno es obligatorio"),
  lastNameM:           z.string().optional(),
  birthDate:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  email:               z.string().email("Correo inválido"),
  password:            z.string().min(8, "Mínimo 8 caracteres"),
  professionalLicense: z.string().min(5, "Cédula obligatoria"),
  curp:                z.string().length(18, "CURP debe tener 18 caracteres"),
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



// 3. Ejercicio: multimedia solo como archivo subido (/uploads/exercises/...); sin URLs http(s)
// Nota: en Zod 4, encadenar .object().transform().superRefine() puede fallar de forma opaca
// ("expected object, received undefined" en path []). Validamos videoUrl solo con superRefine.
export const ExerciseSchema = z
  .object({
    name: z.string().min(3, "El nombre del ejercicio es obligatorio"),
    bodyZone: z.string().min(2, "La zona del cuerpo es obligatoria"),
    description: z.string().min(10, "La descripción debe ser más detallada"),
    videoUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const t = data.videoUrl?.trim();
    if (!t) return;
    if (!/^\/uploads\/exercises\/.+/.test(t)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "No se permiten enlaces externos. La multimedia debe ser un archivo subido (ruta /uploads/exercises/...).",
        path: ["videoUrl"],
      });
    }
  });

// 4. Reglas para el Seguimiento (Guardar Molestias)
export const TrackingSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  painLevel: z.number().int().min(1, "El dolor mínimo es 1").max(10, "El dolor máximo es 10"),
  postObservations: z.string().optional(),
  intraObservations: z.string().optional(),
  alert: z.number().int().min(0).max(1).optional(),
  routineId: z.number().int().positive("El ID de la rutina es obligatorio"),
  patientId: z.number().int().positive("El ID del paciente es obligatorio"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
});

// 5. Reglas para la Rutina
export const RoutineSchema = z.object({
  name: z.string().min(3, "El nombre de la rutina es obligatorio"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "El formato debe ser YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "El formato debe ser YYYY-MM-DD"),
  physiotherapistId: z.number().int().positive(),
  patientId: z.number().int().positive(),
  exerciseIds: z.array(z.number().int().positive()).optional(),
  exerciseItems: z.array(z.object({
    exerciseId: z.number().int().positive("ID de ejercicio inválido"),
    repetitions: z.number().int().positive().optional(),
    sets: z.number().int().positive().optional(),
    exerciseOrder: z.number().int().positive().optional(),
    notes: z.string().optional(),
  })).optional(),
}).superRefine((data, ctx) => {
  const hasIds = Array.isArray(data.exerciseIds) && data.exerciseIds.length > 0;
  const hasItems = Array.isArray(data.exerciseItems) && data.exerciseItems.length > 0;

  if (!hasIds && !hasItems) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe seleccionar al menos un ejercicio",
      path: ["exerciseIds"],
    });
  }
});

// NUEVO: Esquema para edición (todos los campos opcionales)
export const UpdatePatientSchema = PatientSchema.partial();