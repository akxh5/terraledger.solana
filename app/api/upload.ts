import type { VercelRequest, VercelResponse } from '@vercel/node';
import Busboy from 'busboy';
import { uploadToPinata } from './_lib/pinata.ts';

export const config = {
  api: {
    bodyParser: false, // Disable built-in body parser for multipart handling
  },
};

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/json'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  return new Promise((resolve) => {
    const busboy = Busboy({ 
      headers: req.headers,
      limits: { fileSize: MAX_FILE_SIZE }
    });

    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let fileMimeType = '';
    let fileTooLarge = false;

    busboy.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        res.status(400).json({ success: false, error: `MIME type ${mimeType} not allowed` });
        return resolve(undefined);
      }

      fileName = filename;
      fileMimeType = mimeType;
      const chunks: any[] = [];

      file.on('data', (data) => {
        chunks.push(data);
      });

      file.on('limit', () => {
        fileTooLarge = true;
      });

      file.on('end', () => {
        if (!fileTooLarge) {
          fileBuffer = Buffer.concat(chunks);
        }
      });
    });

    busboy.on('finish', async () => {
      if (fileTooLarge) {
        res.status(413).json({ success: false, error: 'File size limit exceeded (10MB)' });
        return resolve(undefined);
      }

      if (!fileBuffer) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return resolve(undefined);
      }

      try {
        const result = await uploadToPinata(fileBuffer, fileName, fileMimeType);
        res.status(200).json({ success: true, ...result });
        resolve(undefined);
      } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
        resolve(undefined);
      }
    });

    busboy.on('error', (err) => {
      res.status(500).json({ success: false, error: err.message });
      resolve(undefined);
    });

    req.pipe(busboy);
  });
}
