/**
 * Datos de demostración para el panel admin y pruebas.
 * Uso (desde la raíz del backend):
 *   npm run seed:demo
 * Borra solo filas marcadas como seed y vuelve a crear:
 *   npm run seed:demo -- --clean
 *
 * Marca: correos que terminan en @seed.activa.demo; ejercicios con nombre "DEMO — ...".
 */
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import { Op } from "sequelize";
import {
  sequelize,
  UserModel,
  PhysiotherapistModel,
  PatientModel,
  ExerciseModel,
  AppointmentModel,
  LogbookModel,
  RoutineModel,
  RoutineExerciseModel,
  TrackingModel,
} from "../src/infrastructure/persistence/sequelize/client";

const SEED_EMAIL_SUFFIX = "@seed.activa.demo";
const SEED_PASSWORD = "DemoSeed123!";

async function wipeSeedData(): Promise<void> {
  const seedUsers = await UserModel.findAll({
    where: { email: { [Op.like]: `%${SEED_EMAIL_SUFFIX}` } },
    attributes: ["id_user"],
  });
  const userIds = seedUsers.map((u) => u.get("id_user") as number);
  if (userIds.length === 0) {
    console.log("No había usuarios demo previos.");
  }

  const physios =
    userIds.length > 0
      ? await PhysiotherapistModel.findAll({
          where: { id_user: userIds },
          attributes: ["id_physio"],
        })
      : [];
  const physioIds = physios.map((p) => p.get("id_physio") as number);

  const patients =
    userIds.length > 0
      ? await PatientModel.findAll({
          where: { id_user: userIds },
          attributes: ["id_patient"],
        })
      : [];
  const patientIds = patients.map((p) => p.get("id_patient") as number);

  const routineOr: any[] = [];
  if (physioIds.length) routineOr.push({ id_physio: physioIds });
  if (patientIds.length) routineOr.push({ id_patient: patientIds });

  if (routineOr.length) {
    const routines = await RoutineModel.findAll({
      where: { [Op.or]: routineOr },
      attributes: ["id_routine"],
    });
    const routineIds = routines.map((r) => r.get("id_routine") as number);
    if (routineIds.length) {
      await RoutineExerciseModel.destroy({ where: { id_routine: routineIds } });
      await TrackingModel.destroy({ where: { id_routine: routineIds } });
      await RoutineModel.destroy({ where: { id_routine: routineIds } });
    }
  }

  const apptOr: any[] = [];
  if (physioIds.length) apptOr.push({ id_physio: physioIds });
  if (patientIds.length) apptOr.push({ id_patient: patientIds });

  if (apptOr.length) {
    const appts = await AppointmentModel.findAll({
      where: { [Op.or]: apptOr },
      attributes: ["id_appointment"],
    });
    const apptIds = appts.map((a) => a.get("id_appointment") as number);
    if (apptIds.length) {
      await LogbookModel.destroy({ where: { id_appointment: apptIds } });
      await AppointmentModel.destroy({ where: { id_appointment: apptIds } });
    }
  }

  if (userIds.length) {
    await PatientModel.destroy({ where: { id_user: userIds } });
    await PhysiotherapistModel.destroy({ where: { id_user: userIds } });
    await UserModel.destroy({ where: { id_user: userIds } });
  }

  await ExerciseModel.destroy({ where: { name: { [Op.like]: "DEMO —%" } } });
  console.log("Limpieza de datos demo terminada.");
}

type PhysioSeed = {
  email: string;
  first: string;
  lastP: string;
  lastM: string;
  license: string;
  curp: string;
  status: "pending_profile" | "pending_approval" | "approved" | "rejected";
  licenseDoc?: string | null;
  ineDoc?: string | null;
};

async function createPhysio(hash: string, row: PhysioSeed): Promise<number> {
  const existing = await UserModel.findOne({
    where: { email: row.email },
  });
  if (existing) {
    const idUser = existing.get("id_user") as number;
    const ph = await PhysiotherapistModel.findOne({ where: { id_user: idUser } });
    return ph ? (ph.get("id_physio") as number) : 0;
  }

  const t = await sequelize.transaction();
  try {
    const user = await UserModel.create(
      { email: row.email, password: hash, role: "physio" },
      { transaction: t }
    );
    const idUser = (user.get({ plain: true }) as any).id_user as number;
    const physio = await PhysiotherapistModel.create(
      {
        first_name: row.first,
        last_name_paternal: row.lastP,
        last_name_maternal: row.lastM,
        birth_date: "1990-05-15",
        professional_license: row.license,
        curp: row.curp,
        status: row.status,
        id_user: idUser,
        license_doc_url: row.licenseDoc ?? null,
        ine_doc_url: row.ineDoc ?? null,
      },
      { transaction: t }
    );
    await t.commit();
    return physio.get("id_physio") as number;
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

async function seedSubscriptionPlans(): Promise<void> {
  try {
    const plans: Array<[string, number, number, string]> = [
      ["Básico (seed)", 9.99, 30, "Mensual"],
      ["Premium (seed)", 29.99, 30, "Mensual"],
      ["Anual Premium (seed)", 299.99, 365, "Anual"],
    ];
    for (const [name, price, days, cycle] of plans) {
      await sequelize.query(
        `INSERT INTO subscription_plan (name, price, duration_days, billing_cycle, is_active, created_at, updated_at)
         SELECT :name, :price, :days, :cycle, 1, NOW(), NOW()
         FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM subscription_plan sp WHERE sp.name = :name LIMIT 1)`,
        { replacements: { name, price, days, cycle } }
      );
    }
    console.log("Planes subscription_plan comprobados/creados (si la tabla existe).");
  } catch (e: any) {
    console.log("subscription_plan: omitido (" + (e?.message || e) + ")");
  }
}

async function main() {
  const clean = process.argv.includes("--clean");
  await sequelize.authenticate();
  console.log("MySQL OK.");

  if (clean) {
    await wipeSeedData();
  }

  const hash = await bcrypt.hash(SEED_PASSWORD, 10);

  const physioRows: PhysioSeed[] = [
    {
      email: `fisio.pendiente1${SEED_EMAIL_SUFFIX}`,
      first: "Laura",
      lastP: "Mendoza",
      lastM: "Ruiz",
      license: "99000001",
      curp: "MERL900515HDFRNR01",
      status: "pending_approval",
      licenseDoc: "/uploads/seed/cedula-1.pdf",
      ineDoc: "/uploads/seed/ine-1.pdf",
    },
    {
      email: `fisio.pendiente2${SEED_EMAIL_SUFFIX}`,
      first: "Diego",
      lastP: "Soto",
      lastM: "León",
      license: "99000002",
      curp: "SOLD900515HDFRTL02",
      status: "pending_approval",
      licenseDoc: "/uploads/seed/cedula-2.pdf",
      ineDoc: "/uploads/seed/ine-2.pdf",
    },
    {
      email: `fisio.aprobado${SEED_EMAIL_SUFFIX}`,
      first: "Elena",
      lastP: "Vega",
      lastM: "Núñez",
      license: "99000003",
      curp: "VEEN900515MDFRNL03",
      status: "approved",
      licenseDoc: "/uploads/seed/cedula-3.pdf",
      ineDoc: "/uploads/seed/ine-3.pdf",
    },
    {
      email: `fisio.rechazado${SEED_EMAIL_SUFFIX}`,
      first: "Pablo",
      lastP: "Cruz",
      lastM: "Mora",
      license: "99000004",
      curp: "CUMP900515HDFRRL04",
      status: "rejected",
      licenseDoc: null,
      ineDoc: null,
    },
  ];

  let idPhysioAprobado = 0;
  for (const row of physioRows) {
    const id = await createPhysio(hash, row);
    if (row.status === "approved") idPhysioAprobado = id;
    console.log("Fisio:", row.email, "→ id_physio", id, "status", row.status);
  }

  const demoExercises = [
    {
      name: "DEMO — Estiramiento cervical",
      body_zone: "Cuello",
      description: "Movilización suave del cuello en demostración para el catálogo Activa.",
      video_url: null,
    },
    {
      name: "DEMO — Fortalecimiento de cuádriceps",
      body_zone: "Rodilla",
      description: "Extensión de rodilla controlada; datos de prueba generados por seed-demo.",
      video_url: null,
    },
    {
      name: "DEMO — Puente de glúteos",
      body_zone: "Cadera, Glúteos",
      description: "Activación de glúteos y cadena posterior; ejercicio de demostración seed.",
      video_url: null,
    },
  ];

  for (const ex of demoExercises) {
    const exists = await ExerciseModel.findOne({ where: { name: ex.name } });
    if (!exists) {
      await ExerciseModel.create(ex as any);
      console.log("Ejercicio creado:", ex.name);
    } else {
      console.log("Ejercicio ya existe:", ex.name);
    }
  }

  if (idPhysioAprobado) {
    const pEmail = `paciente.demo${SEED_EMAIL_SUFFIX}`;
    let pUser = await UserModel.findOne({ where: { email: pEmail } });
    let idPatient = 0;
    if (!pUser) {
      const t = await sequelize.transaction();
      try {
        pUser = await UserModel.create(
          { email: pEmail, password: hash, role: "patient" },
          { transaction: t }
        );
        const idU = (pUser.get({ plain: true }) as any).id_user as number;
        const pat = await PatientModel.create(
          {
            first_name: "Ana",
            last_name_paternal: "García",
            last_name_maternal: "López",
            birth_date: "1992-08-20",
            gender: "F",
            height: 165,
            weight: 62,
            id_user: idU,
            id_physio: idPhysioAprobado,
          },
          { transaction: t }
        );
        idPatient = pat.get("id_patient") as number;
        await t.commit();
        console.log("Paciente demo:", pEmail, "id_patient", idPatient);
      } catch (e) {
        await t.rollback();
        throw e;
      }
    } else {
      const pat = await PatientModel.findOne({ where: { id_user: pUser.get("id_user") } });
      idPatient = pat ? (pat.get("id_patient") as number) : 0;
      console.log("Paciente demo ya existía:", pEmail);
    }

    if (idPatient) {
      const count = await AppointmentModel.count({
        where: { id_patient: idPatient, id_physio: idPhysioAprobado, status: "completed" },
      });
      if (count === 0) {
        await AppointmentModel.bulkCreate([
          {
            date: "2026-04-01",
            start_time: "10:00:00",
            end_time: "10:45:00",
            status: "completed",
            id_patient: idPatient,
            id_physio: idPhysioAprobado,
            notes: "Cita demo seed",
          },
          {
            date: "2026-04-05",
            start_time: "11:00:00",
            end_time: "11:30:00",
            status: "completed",
            id_patient: idPatient,
            id_physio: idPhysioAprobado,
            notes: "Cita demo seed",
          },
        ] as any);
        console.log("Citas completadas demo creadas (ingresos en overview si APPOINTMENT_REVENUE_MXN > 0).");
      } else {
        console.log("Citas completadas demo ya existían.");
      }
    }
  }

  await seedSubscriptionPlans();

  console.log("\n--- Listo ---");
  console.log("Contraseña común demo (fisios + paciente):", SEED_PASSWORD);
  console.log("Correos fisio:", physioRows.map((r) => r.email).join(", "));
  console.log("Correo paciente: paciente.demo" + SEED_EMAIL_SUFFIX);
  console.log("Admin: usa tu cuenta admin del panel (no se modifica aquí).");
  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
  sequelize.close().catch(() => {});
});
