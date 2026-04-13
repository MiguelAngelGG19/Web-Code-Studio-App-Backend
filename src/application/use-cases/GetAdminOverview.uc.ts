import {
  sequelize,
  PhysiotherapistModel,
  PatientModel,
  AppointmentModel,
  UserModel,
} from "../../infrastructure/persistence/sequelize/client";

export type AdminOverviewResult = {
  physiotherapists: {
    pending_profile: number;
    pending_approval: number;
    approved: number;
    rejected: number;
    total: number;
  };
  users: {
    patient_accounts: number;
    physio_accounts: number;
    admin_accounts: number;
  };
  patients_linked: number;
  appointments: {
    total: number;
    by_status: Record<string, number>;
  };
  ganancias: {
    moneda: "MXN";
    total: number;
    citas_completadas: number;
    tarifa_por_cita: number;
  };
  generated_at: string;
};

export class GetAdminOverviewUseCase {
  async execute(): Promise<AdminOverviewResult> {
    const [
      pending_profile,
      pending_approval,
      approved,
      rejected,
      patient_accounts,
      physio_accounts,
      admin_accounts,
      patients_linked,
      appointments_total,
      appointmentGroups,
    ] = await Promise.all([
      PhysiotherapistModel.count({ where: { status: "pending_profile" } }),
      PhysiotherapistModel.count({ where: { status: "pending_approval" } }),
      PhysiotherapistModel.count({ where: { status: "approved" } }),
      PhysiotherapistModel.count({ where: { status: "rejected" } }),
      UserModel.count({ where: { role: "patient" } }),
      UserModel.count({ where: { role: "physio" } }),
      UserModel.count({ where: { role: "admin" } }),
      PatientModel.count(),
      AppointmentModel.count(),
      AppointmentModel.findAll({
        attributes: [
          "status",
          [sequelize.fn("COUNT", sequelize.col("id_appointment")), "count"],
        ],
        group: ["status"],
        raw: true,
      }).then((rows) => rows as unknown as { status: string; count: string }[]),
    ]);

    const by_status: Record<string, number> = {};
    for (const row of appointmentGroups) {
      by_status[row.status] = Number(row.count);
    }

    const citasCompletadas = by_status.completed ?? 0;
    const tarifa = Number(process.env.APPOINTMENT_REVENUE_MXN || 0);
    const totalGanancias = Math.round(citasCompletadas * tarifa * 100) / 100;

    return {
      physiotherapists: {
        pending_profile,
        pending_approval,
        approved,
        rejected,
        total: pending_profile + pending_approval + approved + rejected,
      },
      users: {
        patient_accounts,
        physio_accounts,
        admin_accounts,
      },
      patients_linked,
      appointments: {
        total: appointments_total,
        by_status,
      },
      ganancias: {
        moneda: "MXN",
        total: totalGanancias,
        citas_completadas: citasCompletadas,
        tarifa_por_cita: tarifa,
      },
      generated_at: new Date().toISOString(),
    };
  }
}
