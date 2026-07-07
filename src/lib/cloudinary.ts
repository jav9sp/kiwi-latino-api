import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IS_PROD = process.env.NODE_ENV === 'production';

export const uploadImageBuffer = (
  buffer: Buffer,
  folder = 'kiwi-latino',
): Promise<string> => {
  if (!IS_PROD) {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
    const port = process.env.PORT ?? 3000;
    return Promise.resolve(`http://localhost:${port}/uploads/${filename}`);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) reject(error ?? new Error('Cloudinary upload failed'));
        else resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
};
