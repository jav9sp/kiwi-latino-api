import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

const ALLOWED_MIME_TYPES = ['image/jpg','image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

const multerInstance = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes jpg, png y webp'));
    }
  },
});

// Wrapper que convierte los errores de multer en respuestas JSON estructuradas
export const uploadSingle =
  (fieldName: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    multerInstance.single(fieldName)(req, res, (err) => {
      if (!err) return next();
      console.error('[Upload] Multer error:', err.message, '| Content-Type:', req.headers['content-type']);
      const message =
        err.message.includes('File too large') || err.message.includes('LIMIT_FILE_SIZE')
          ? `La imagen no puede superar ${MAX_SIZE_MB}MB`
          : err.message;
      sendError(res, message, 400);
    });
  };
