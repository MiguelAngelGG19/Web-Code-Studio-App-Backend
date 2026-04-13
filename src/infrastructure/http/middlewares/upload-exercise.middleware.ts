import multer from "multer";
import path from "path";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";

const uploadDir = path.join(process.cwd(), "uploads", "exercises");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `ex-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const allowedMime = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/heic",
  "image/heif",
]);

/** Extensiones permitidas (fallback si el navegador manda MIME vacío u octet-stream, típico en Windows). */
const allowedExt = new Set([
  ".mp4",
  ".webm",
  ".mov",
  ".avi",
  ".gif",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".heic",
  ".heif",
]);

function extensionAllowed(originalname: string): boolean {
  const ext = path.extname(originalname).toLowerCase();
  return allowedExt.has(ext);
}

export const exerciseMediaUpload = multer({
  storage,
  defParamCharset: "utf8",
  limits: { fileSize: Number(process.env.EXERCISE_MEDIA_MAX_MB || 50) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMime.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    if (extensionAllowed(file.originalname)) {
      cb(null, true);
      return;
    }
    const ext = path.extname(file.originalname).toLowerCase();
    cb(
      new Error(
        `Tipo no permitido. Usa video (mp4, webm, mov, avi), GIF o imagen (jpg, png, webp, heic). Recibido: mimetype="${file.mimetype || "(vacío)"}", ext="${ext || "(sin extensión)"}".`
      )
    );
  },
}).single("media");

/**
 * Solo aplica multer si el cuerpo es multipart; si no, deja pasar (JSON).
 */
export function optionalExerciseMediaUpload(req: Request, res: Response, next: NextFunction): void {
  const ct = req.headers["content-type"] || "";
  if (ct.includes("multipart/form-data")) {
    exerciseMediaUpload(req, res, (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : "Error al subir archivo";
        res.status(400).json({ success: false, message: msg });
        return;
      }
      next();
    });
    return;
  }
  next();
}
