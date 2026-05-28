import { Request, Response } from 'express';
import { uploadImageBuffer } from '../lib/cloudinary';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    sendError(res, 'No se recibió ninguna imagen', 400);
    return;
  }

  const url = await uploadImageBuffer(req.file.buffer);
  sendSuccess(res, { url }, 201);
};
