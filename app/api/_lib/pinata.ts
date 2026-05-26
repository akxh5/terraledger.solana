/**
 * Server-side Pinata IPFS upload utility.
 * Reads PINATA_JWT from process.env.
 */

import FormData from 'form-data';

export async function uploadToPinata(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ cid: string; url: string }> {
  const PINATA_JWT = process.env.PINATA_JWT?.trim();

  if (!PINATA_JWT) {
    throw new Error('Server-side PINATA_JWT is not configured in environment variables.');
  }

  // Use form-data package for reliable multipart in Node.js
  const formData = new FormData();
  
  formData.append('file', fileBuffer, {
    filename,
    contentType: mimeType,
  });

  formData.append(
    'pinataMetadata',
    JSON.stringify({ name: filename })
  );
  formData.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));

  try {
    // Node.js 18+ has native fetch
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        ...formData.getHeaders(),
      },
      body: formData.getBuffer(),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Pinata API error (${response.status}): ${detail}`);
    }

    const json = (await response.json()) as any;
    if (!json.IpfsHash) {
      throw new Error(`Unexpected Pinata response: ${JSON.stringify(json)}`);
    }

    return {
      cid: json.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`,
    };
  } catch (err) {
    console.error('uploadToPinata error:', err);
    throw err;
  }
}
