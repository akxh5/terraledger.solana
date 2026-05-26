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
  console.log('JWT configured:', !!process.env.PINATA_JWT);

  let isResponded = false;
  const sendResponse = (status: number, data: any) => {
    if (isResponded) {
      console.log('Attempted to send response after headers sent:', { status, data });
      return;
    }
    isResponded = true;
    console.log('Sending response:', { status, success: data.success });
    res.status(status).json(data);
  };

  // Add a timeout to ensure we always respond
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

    const busboy = Busboy({ 
      headers: req.headers,
      limits: { fileSize: MAX_FILE_SIZE }
    });

    console.log('Busboy initialized');

    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let fileMimeType = '';
    let fileTooLarge = false;
    let fileReceived = false;

    busboy.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      fileReceived = true;
      console.log('File received:', { filename, mimeType });
      
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        console.warn('MIME type not allowed:', mimeType);
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
        console.warn('File size limit exceeded for file:', filename);
        fileTooLarge = true;
        file.resume();
      });

      file.on('end', () => {
        console.log('File stream end:', filename);
        if (!fileTooLarge) {
          fileBuffer = Buffer.concat(chunks);
        }
      });
    });

    busboy.on('finish', async () => {
      console.log('Busboy finish event fired');
      clearTimeout(timeoutId);

      if (isResponded) return;

      if (fileTooLarge) {
        return sendResponse(413, { success: false, error: 'File size limit exceeded (10MB)' });
      }

      if (!fileReceived || !fileBuffer) {
        console.warn('No file received or empty buffer');
        return sendResponse(400, { success: false, error: 'No file uploaded' });
      }

      try {
        console.log('Upload to Pinata starting:', fileName);
        const result = await uploadToPinata(fileBuffer, fileName, fileMimeType);
        console.log('Pinata response success:', result.cid);
        sendResponse(200, { success: true, ...result });
      } catch (err) {
        console.error('Pinata upload failed:', err);
        sendResponse(500, { success: false, error: (err as Error).message || 'Pinata upload failed' });
      }
    });

    busboy.on('error', (err: Error) => {
      console.error('Busboy error:', err);
      clearTimeout(timeoutId);
      sendResponse(500, { success: false, error: err.message || 'Busboy error' });
    });

    req.pipe(busboy);
  } catch (error) {
    console.error('Unexpected error in handler:', error);
    clearTimeout(timeoutId);
    if (!isResponded) {
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message || 'Unknown error' 
      });
    }
  }
}
