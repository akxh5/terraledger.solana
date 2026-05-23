/**
 * Secure Pinata IPFS upload utility for TerraLedger.
 * Calls serverless API endpoint /api/upload to avoid exposing JWT on client.
 */

export const IPFS_GATEWAY = "https://ipfs.io/ipfs";

/** Returns a full ipfs.io gateway URL for a CID */
export function ipfsUrl(cid: string): string {
  return `${IPFS_GATEWAY}/${cid}`;
}

/** 
 * Returns true if the app is configured to use the proxy API.
 * In production/Vercel this is always true.
 */
export function hasPinataCredentials(): boolean {
  return true; 
}

/**
 * Upload a File to IPFS via our serverless API and return the CID string.
 */
export async function uploadToPinata(file: File, name?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  if (name) {
    formData.append("name", name);
  }

  let res: Response;
  try {
    res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
  } catch (networkErr) {
    throw new Error(`Network error reaching upload API: ${(networkErr as Error).message}`);
  }

  const json = await res.json();
  
  if (!res.ok) {
    throw new Error(json.error || `Upload failed with status ${res.status}`);
  }

  if (!json.cid) {
    throw new Error(`API returned unexpected response: ${JSON.stringify(json)}`);
  }

  return json.cid as string;
}

/**
 * Verify API is healthy.
 */
export async function testPinataAuth(): Promise<boolean> {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error(`API health check failed: HTTP ${res.status}`);
  return true;
}
