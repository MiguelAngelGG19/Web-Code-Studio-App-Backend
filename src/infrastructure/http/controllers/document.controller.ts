import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { PatientMedicalDocumentModel, PatientModel } from "../../persistence/sequelize/client";

function publicFileUrl(req: AuthRequest, storedPath: string): string {
  const base =
    process.env.PUBLIC_API_URL?.replace(/\/$/, "") ||
    `${req.protocol}://${req.get("host")}`;
  return `${base}/${storedPath.replace(/^\//, "")}`;
}

async function assertPatientAccess(req: AuthRequest, patientId: number): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const u = req.user;
  if (!u) {
    return { ok: false, status: 401, message: "No autorizado." };
  }

  if (u.role === "patient") {
    if (Number(u.id) !== patientId) {
      return { ok: false, status: 403, message: "No puedes acceder a expedientes de otros pacientes." };
    }
    return { ok: true };
  }

  if (u.role === "physio") {
    const row = await PatientModel.findByPk(patientId);
    if (!row) {
      return { ok: false, status: 404, message: "Paciente no encontrado." };
    }
    const idPhysio = (u as any).id_physio as number | undefined;
    if (idPhysio == null || row.getDataValue("id_physio") !== idPhysio) {
      return { ok: false, status: 403, message: "No tienes permiso para este paciente." };
    }
    return { ok: true };
  }

  return { ok: false, status: 403, message: "Rol no autorizado." };
}

export class DocumentController {
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const patientId = Number(req.query.patientId);
      const limit = Math.min(Number(req.query.limit ?? 100), 200);
      if (!patientId || Number.isNaN(patientId)) {
        res.status(400).json({ success: false, message: "patientId es requerido." });
        return;
      }

      const gate = await assertPatientAccess(req, patientId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, message: gate.message });
        return;
      }

      const rows = await PatientMedicalDocumentModel.findAll({
        where: { id_patient: patientId },
        order: [["created_at", "DESC"]],
        limit
      });

      const mapped = rows.map((r) => {
        const j = r.get({ plain: true }) as any;
        const rel = j.file_url as string;
        return {
          id: j.id_document,
          patientId: j.id_patient,
          name: j.name,
          type: j.doc_type ?? "otro",
          fileUrl: publicFileUrl(req, rel),
          createdAt: j.created_at
        };
      });

      res.status(200).json({ success: true, rows: mapped });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message ?? "Error al listar documentos." });
    }
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const file = (req as any).file as { filename: string } | undefined;
      const patientId = Number(req.body?.patientId);
      const name = (req.body?.name as string)?.trim();
      const docType = (req.body?.type as string)?.trim() || "otro";

      if (!file || !patientId || Number.isNaN(patientId) || !name) {
        res.status(400).json({ success: false, message: "Faltan archivo PDF, nombre o patientId." });
        return;
      }

      const gate = await assertPatientAccess(req, patientId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, message: gate.message });
        return;
      }

      const storedRelative = `uploads/patient-medical/${file.filename}`;

      const created = await PatientMedicalDocumentModel.create({
        id_patient: patientId,
        name,
        doc_type: docType,
        file_url: storedRelative
      } as any);

      const j = created.get({ plain: true }) as any;
      const data = {
        id: j.id_document,
        patientId: j.id_patient,
        name: j.name,
        type: j.doc_type ?? "otro",
        fileUrl: publicFileUrl(req, j.file_url),
        createdAt: j.created_at
      };

      res.status(201).json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message ?? "Error al guardar documento." });
    }
  };

  remove = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const patientId = Number(req.query.patientId);
      if (!id || Number.isNaN(id) || !patientId || Number.isNaN(patientId)) {
        res.status(400).json({ success: false, message: "ID o patientId inválido." });
        return;
      }

      const gate = await assertPatientAccess(req, patientId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, message: gate.message });
        return;
      }

      const row = await PatientMedicalDocumentModel.findOne({
        where: { id_document: id, id_patient: patientId }
      });

      if (!row) {
        res.status(404).json({ success: false, message: "Documento no encontrado." });
        return;
      }

      await row.destroy();
      res.status(200).json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message ?? "Error al eliminar." });
    }
  };
}
