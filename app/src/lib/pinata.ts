/**
 * Pinata IPFS upload utility for TerraLedger.
 *
 * Auth priority: VITE_PINATA_JWT > VITE_PINATA_API_KEY + VITE_PINATA_SECRET
 *
 * Add credentials to .env.local (gitignored):
 *   VITE_PINATA_JWT=<your_jwt>
 *
 * Usage:
 *   const cid = await uploadToPinata(file, "title-deed.pdf");
 *   // → "QmXyz..." or "bafkrei..."
 */

const PINATA_JWT = (import.meta.env.VITE_PINATA_JWT as string | undefined)?.trim();
const PINATA_API_KEY = (import.meta.env.VITE_PINATA_API_KEY as string | undefined)?.trim();
// Accept both VITE_PINATA_SECRET and VITE_PINATA_SECRET_API_KEY
const PINATA_SECRET = (
  (import.meta.env.VITE_PINATA_SECRET_API_KEY as string | undefined) ||
  (import.meta.env.VITE_PINATA_SECRET as string | undefined)
)?.trim();

export const IPFS_GATEWAY = "https://ipfs.io/ipfs";

/** Returns a full ipfs.io gateway URL for a CID */
export function ipfsUrl(cid: string): string {
  return `${IPFS_GATEWAY}/${cid}`;
}

/** Returns true if any Pinata credentials are configured */
export function hasPinataCredentials(): boolean {
  return !!(PINATA_JWT || (PINATA_API_KEY && PINATA_SECRET));
}

/**
 * Upload a File to Pinata and return the IPFS CID string.
 * Shows a descriptive error if credentials are missing or upload fails.
 */
export async function uploadToPinata(file: File, name?: string): Promise<string> {
  // ── Auth check ──────────────────────────────────────────────────────────────
  if (!hasPinataCredentials()) {
    throw new Error(
      "Pinata credentials not configured.\n" +
      "Add VITE_PINATA_JWT to .env.local and restart the dev server."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "pinataMetadata",
    JSON.stringify({ name: name ?? file.name ?? "terraledger-doc" })
  );
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 0 })); // CIDv0 = Qm... prefix

  // ── Build headers — JWT is preferred ────────────────────────────────────────
  const headers: Record<string, string> = {};
  if (PINATA_JWT) {
    headers["Authorization"] = `Bearer ${PINATA_JWT}`;
  } else {
    headers["pinata_api_key"] = PINATA_API_KEY!;
    headers["pinata_secret_api_key"] = PINATA_SECRET!;
  }

  // ── Upload ───────────────────────────────────────────────────────────────────
  let res: Response;
  try {
    res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (networkErr) {
    throw new Error(`Network error reaching Pinata: ${(networkErr as Error).message}`);
  }

  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch {}
    if (res.status === 401) {
      throw new Error("Pinata auth failed (401). Check VITE_PINATA_JWT in .env.local.");
    }
    if (res.status === 403) {
      throw new Error("Pinata forbidden (403). Your JWT may have expired or lacks pin permissions.");
    }
    throw new Error(`Pinata upload failed (HTTP ${res.status}): ${detail.slice(0, 200)}`);
  }

  const json = await res.json();
  if (!json.IpfsHash) {
    throw new Error(`Pinata returned unexpected response: ${JSON.stringify(json)}`);
  }

  return json.IpfsHash as string;
}

/**
 * Verify Pinata credentials are valid by hitting the test auth endpoint.
 * Returns true on success, throws with a descriptive message on failure.
 */
export async function testPinataAuth(): Promise<boolean> {
  if (!hasPinataCredentials()) {
    throw new Error("No Pinata credentials set in .env.local");
  }
  const headers: Record<string, string> = {};
  if (PINATA_JWT) {
    headers["Authorization"] = `Bearer ${PINATA_JWT}`;
  } else {
    headers["pinata_api_key"] = PINATA_API_KEY!;
    headers["pinata_secret_api_key"] = PINATA_SECRET!;
  }
  const res = await fetch("https://api.pinata.cloud/data/testAuthentication", { headers });
  if (!res.ok) throw new Error(`Pinata auth test failed: HTTP ${res.status}`);
  return true;
}
