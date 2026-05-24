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

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const busboy = Busboy({ 
    headers: req.headers,
    limits: { fileSize: MAX_FILE_SIZE }
  });

  let fileBuffer: Buffer | null = null;
  let fileName = '';
  let fileMimeType = '';
  let fileTooLarge = false;
  let isResponded = false;

  const sendResponse = (status: number, data: any) => {
    if (isResponded) return;
    isResponded = true;
    res.status(status).json(data);
  };

  busboy.on('file', (name, file, info) => {
    const { filename, mimeType } = info;
    
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      file.resume(); // Drain the stream
      return sendResponse(400, { success: false, error: `MIME type ${mimeType} not allowed` });
    }

    fileName = filename;
    fileMimeType = mimeType;
    const chunks: any[] = [];

    file.on('data', (data) => {
      chunks.push(data);
    });

    file.on('limit', () => {
      fileTooLarge = true;
      file.resume();
    });

    file.on('end', () => {
      if (!fileTooLarge) {
        fileBuffer = Buffer.concat(chunks);
      }
    });
  });

  busboy.on('finish', async () => {
    if (isResponded) return;

    if (fileTooLarge) {
      return sendResponse(413, { success: false, error: 'File size limit exceeded (10MB)' });
    }

    if (!fileBuffer) {
      return sendResponse(400, { success: false, error: 'No file uploaded' });
    }

    try {
      const result = await uploadToPinata(fileBuffer, fileName, fileMimeType);
      sendResponse(200, { success: true, ...result });
    } catch (err) {
      sendResponse(500, { success: false, error: (err as Error).message });
    }
  });

  busboy.on('error', (err: Error) => {
    sendResponse(500, { success: false, error: err.message });
  });

  req.pipe(busboy);
}
