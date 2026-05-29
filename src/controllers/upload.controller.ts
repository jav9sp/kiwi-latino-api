import { Request, Response } from 'express';
import { uploadImageBuffer } from '../lib/cloudinary';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    console.error('[Upload] req.file undefined');
    console.error('[Upload] body keys:', Object.keys(req.body || {}));
    if (req.body?.image !== undefined) {
      console.error('[Upload] body.image (primeros 120 chars):', String(req.body.image).slice(0, 120));
    }
    sendError(res, 'No se recibió ninguna imagen.', 400);
    return;
  }

  const url = await uploadImageBuffer(req.file.buffer);
  sendSuccess(res, { url }, 201);
};
