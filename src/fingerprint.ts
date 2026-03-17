// ============================================================
// Agent Imprint SDK — Fingerprint Helper
// Matches server-side algorithm:
//   sha256(model_family + sha256(core_purpose) + creator_identifier)
// ============================================================

import type { FingerprintComponents } from './types.js';

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error('Web Crypto API not available in this environment');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await getCrypto().subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compute a deterministic agent fingerprint that matches the server-side algorithm.
 *
 * Algorithm: sha256(model_family + sha256(core_purpose) + creator_identifier)
 */
export async function computeFingerprint(params: FingerprintComponents): Promise<string> {
  const { model_family, core_purpose, creator_identifier } = params;
  const purposeHash = await sha256Hex(core_purpose);
  const combined = `${model_family}${purposeHash}${creator_identifier}`;
  return sha256Hex(combined);
}
