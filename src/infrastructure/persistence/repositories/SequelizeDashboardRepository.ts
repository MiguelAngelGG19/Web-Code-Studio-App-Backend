import { Op, fn, col } from "sequelize";
import { PatientModel, AppointmentModel, TrackingModel } from "../sequelize/client";

// 🪄 BLINDAJE DE SEGURIDAD: Obliga a usar la hora de México ignorando el reloj del servidor
const getMexicoDate = (fechaBase?: Date) => {
  const target = fechaBase || new Date();
  const mxTimeStr = target.toLocaleString("en-US", { timeZone: "America/Mexico_City" });
  return new Date(mxTimeStr);
};

// Convierte a formato YYYY-MM-DD
const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export class SequelizeDashboardRepository {
  
  async getDashboardData(idPhysio: number): Promise<any> {
    
    // 🪄 Obtenemos el "HOY" oficial de México
    const hoy = getMexicoDate();
    const hoyString = toLocalDateString(hoy);

    // Límite del MES exacto (Hora México)
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0); 
    const inicioMesString = toLocalDateString(inicioMes);
    const finMesString = toLocalDateString(finMes);

    // Límite de la SEMANA exacta (Hora México)
    const day = hoy.getDay();
    const diffLunes = hoy.getDate() - day + (day === 0 ? -6 : 1); 
    
    const inicioSemana = getMexicoDate();
    inicioSemana.setDate(diffLunes);
    
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);

    const inicioSemanaStr = toLocalDateString(inicioSemana);
    const finSemanaStr = toLocalDateString(finSemana);

    // ==========================================
    // 🧮 KPIs
    // ==========================================
    const pacientesActivos = await PatientModel.count({ where: { id_physio: idPhysio } });
    const citasMesActual = await AppointmentModel.count({
      where: { id_physio: idPhysio, date: { [Op.between]: [inicioMesString, finMesString] } }
    });

    const pacientes = await PatientModel.findAll({ where: { id_physio: idPhysio }, attributes: ['id_patient'] });
    const idsPacientes = pacientes.map(p => p.getDataValue('id_patient'));
    
    let nivelDolorPromedio = 0;
    if (idsPacientes.length > 0) {
      const resultPain: any = await TrackingModel.findOne({
        where: { id_patient: { [Op.in]: idsPacientes }, pain_level: { [Op.not]: null } },
        attributes: [[fn('AVG', col('pain_level')), 'promedio']],
        raw: true
      });
      nivelDolorPromedio = resultPain?.promedio ? Math.round(resultPain.promedio * 10) / 10 : 0;
    }

    // ==========================================
    // 📊 GRÁFICAS REALES
    // ==========================================
    const citasAgrupadas: any[] = await AppointmentModel.findAll({
      where: { id_physio: idPhysio },
      attributes: ['status', [fn('COUNT', col('status')), 'total']],
      group: ['status'],
      raw: true
    });

    const citasPorEstado = { pendientes: 0, confirmadas: 0, canceladas: 0, completadas: 0 };
    citasAgrupadas.forEach(c => {
      if (c.status === 'pending') citasPorEstado.pendientes = Number(c.total);
      if (c.status === 'confirmed') citasPorEstado.confirmadas = Number(c.total);
      if (c.status === 'cancelled') citasPorEstado.canceladas = Number(c.total);
      if (c.status === 'completed') citasPorEstado.completadas = Number(c.total);
    });

    const citasSemanaDB = await AppointmentModel.findAll({
      where: { id_physio: idPhysio, date: { [Op.between]: [inicioSemanaStr, finSemanaStr] } },
      attributes: ['date'],
      raw: true
    });

    const citasPorDia = [0, 0, 0, 0, 0, 0, 0];
    citasSemanaDB.forEach((c: any) => {
      const d = new Date(c.date + 'T12:00:00'); 
      let dayIdx = d.getDay() - 1; 
      if (dayIdx === -1) dayIdx = 6;
      citasPorDia[dayIdx]++;
    });

    const trackingHistory: any = await TrackingModel.findAll({
      include: [{ model: PatientModel, where: { id_physio: idPhysio }, attributes: [] }],
      where: { 
        date: { [Op.between]: [inicioSemanaStr, finSemanaStr] },
        pain_level: { [Op.not]: null } 
      },
      attributes: ['date', [fn('AVG', col('pain_level')), 'promedio']],
      group: ['date'],
      order: [['date', 'ASC']],
      raw: true
    });

    const dolorSemanalData: (number | null)[] = [null, null, null, null, null, null, null];
    
    trackingHistory.forEach((t: any) => {
      const d = new Date(t.date + 'T12:00:00');
      let dayIdx = d.getDay() - 1;
      if (dayIdx === -1) dayIdx = 6;
      dolorSemanalData[dayIdx] = Math.round(t.promedio * 10) / 10;
    });

    // ==========================================
    // 📅 TABLA HOY
    // ==========================================
    const citasHoyData = await AppointmentModel.findAll({
      where: { id_physio: idPhysio, date: hoyString },
      include: [{ model: PatientModel, attributes: ['first_name', 'last_name_paternal'] }],
      order: [['start_time', 'ASC']]
    });

    const citasHoy = citasHoyData.map((c: any) => ({
      hora: c.start_time.substring(0, 5),
      paciente: `${c.Patient.first_name} ${c.Patient.last_name_paternal || ''}`.trim(),
      motivo: c.notes || 'Revisión general',
      estado: c.status
    }));

    return {
      kpis: { pacientesActivos, citasMesActual, nivelDolorPromedio },
      graficas: { citasPorEstado, citasPorDia, dolorSemanal: dolorSemanalData },
      citasHoy
    };
  }
}