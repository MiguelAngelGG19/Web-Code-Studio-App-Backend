import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 1. Nos aseguramos de que la carpeta donde se guardarán los PDFs exista
const uploadDir = 'uploads/documents';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configuramos DÓNDE y con qué NOMBRE se guardan los archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Se guardarán en la carpeta 'uploads/documents'
  },
  filename: (req, file, cb) => {
    // Le ponemos la fecha actual al nombre para que nunca se sobrescriban
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 3. Exportamos nuestro "Portero" con las reglas estrictas
export const uploadDocuments = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5 MB por archivo
  fileFilter: (req, file, cb) => {
    // Solo dejamos pasar archivos PDF
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Formato inválido. Solo se permiten archivos PDF.'));
    }
  }
});