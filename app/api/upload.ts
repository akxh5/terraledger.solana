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
const TIMEOUT_MS = 25000; // 25 seconds

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Upload function called', { method: req.method, url: req.url });
  
  // Guard for headers already sent
  let isResponded = false;
  const sendResponse = (status: number, data: any) => {
    if (isResponded) return;
    isResponded = true;
    res.status(status).json(data);
  };

  const timeoutId = setTimeout(() => {
    if (!isResponded) {
      console.error('Request timed out after 25s');
      sendResponse(504, { success: false, error: 'Request timed out' });
    }
  }, TIMEOUT_MS);

  try {
    if (req.method !== 'POST') {
      clearTimeout(timeoutId);
      return sendResponse(405, { success: false, error: 'Method Not Allowed' });
    }

    // Wrap the entire streaming process in a Promise to ensure the Vercel handler awaits completion
    await new Promise<void>((resolve, reject) => {
      const busboy = Busboy({ 
        headers: req.headers,
        limits: { fileSize: MAX_FILE_SIZE, files: 1 }
      });

      let fileBuffer: Buffer | null = null;
      let fileName = '';
      let fileMimeType = '';
      let fileTooLarge = false;
      let fileReceived = false;

      busboy.on('file', (name, file, info) => {
        const { filename, mimeType } = info;
        fileReceived = true;
        
        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
          file.resume();
          return reject({ status: 400, message: `MIME type ${mimeType} not allowed` });
        }

        fileName = filename;
        fileMimeType = mimeType;
        const chunks: Buffer[] = [];

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
        if (fileTooLarge) {
          return reject({ status: 413, message: 'File size limit exceeded (10MB)' });
        }

        if (!fileReceived || !fileBuffer) {
          return reject({ status: 400, message: 'No file uploaded' });
        }

        try {
          const result = await uploadToPinata(fileBuffer, fileName, fileMimeType);
          sendResponse(200, { success: true, ...result });
          resolve();
        } catch (err) {
          reject({ status: 500, message: (err as Error).message || 'Pinata upload failed' });
        }
      });

      busboy.on('error', (err: any) => {
        reject({ status: 500, message: err.message || 'Busboy error' });
      });

      req.pipe(busboy);
    });

    clearTimeout(timeoutId);
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Upload handler error:', error);
    
    const status = error.status || 500;
    const message = error.message || (error as Error).message || 'Unknown error';
    
    if (!isResponded) {
      sendResponse(status, { success: false, error: message });
    }
  }
}
