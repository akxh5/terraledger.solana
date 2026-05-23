import http from 'http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import healthHandler from './health.ts';
import uploadHandler from './upload.ts';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from the app directory
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // Mock Vercel response helper
  const vercelRes = res as unknown as VercelResponse;
  vercelRes.status = (code: number) => {
    res.statusCode = code;
    return vercelRes;
  };
  vercelRes.json = (data: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return vercelRes;
  };
  
  // Mock Vercel request
  const vercelReq = req as unknown as VercelRequest;

  // Simple routing
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  
  if (url.pathname === '/api/health') {
    return healthHandler(vercelReq, vercelRes);
  }
  
  if (url.pathname === '/api/upload') {
    return uploadHandler(vercelReq, vercelRes);
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`API Local Dev Server running at http://localhost:${PORT}`);
});
