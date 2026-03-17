// ============================================================
// Agent Imprint SDK — Encryption Helpers (Web Crypto API)
// Works in Node.js 18+ (globalThis.crypto) and browsers
// ============================================================

import type { EncryptedPayload } from './types.js';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV for AES-GCM

// ─── Utility ───────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error('Web Crypto API not available in this environment');
}

async function importAesKey(keyHex: string, usages: KeyUsage[]): Promise<CryptoKey> {
  const keyBytes = hexToBytes(keyHex);
  return getCrypto().subtle.importKey('raw', toArrayBuffer(keyBytes), { name: ALGORITHM }, false, usages);
}

// ─── HKDF Key Derivation ───────────────────────────────────

async function hkdfDerive(masterKeyHex: string, info: string): Promise<string> {
  const crypto = getCrypto();
  const masterKeyBytes = hexToBytes(masterKeyHex);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(masterKeyBytes),
    { name: 'HKDF' },
    false,
    ['deriveKey'],
  );

  const infoBytes = new TextEncoder().encode(info);
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32),
      info: infoBytes,
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt'],
  );

  const exported = await crypto.subtle.exportKey('raw', derivedKey);
  return bytesToHex(new Uint8Array(exported));
}

// ─── Public API ────────────────────────────────────────────

/**
 * Generate a cryptographically secure random 256-bit key (64 hex chars).
 */
export function generateKey(): string {
  const bytes = new Uint8Array(32);
  getCrypto().getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Derive a vault-specific key from a master key and vault UUID.
 */
export async function deriveVaultKey(masterKey: string, vaultUuid: string): Promise<string> {
  return hkdfDerive(masterKey, `vault:${vaultUuid}`);
}

/**
 * Derive an entry-specific key from a vault key and entry UUID.
 */
export async function deriveEntryKey(vaultKey: string, entryUuid: string): Promise<string> {
  return hkdfDerive(vaultKey, `entry:${entryUuid}`);
}

/**
 * Encrypt a JSON-serializable object with AES-256-GCM.
 * Returns an EncryptedPayload with ciphertext, iv, and tag (all hex-encoded).
 */
export async function encrypt(keyHex: string, data: object): Promise<EncryptedPayload> {
  const crypto = getCrypto();
  const cryptoKey = await importAesKey(keyHex, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));

  const ciphertextWithTag = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: toArrayBuffer(iv) },
    cryptoKey,
    toArrayBuffer(plaintext),
  );

  // AES-GCM appends the 16-byte auth tag at the end
  const ciphertextWithTagBytes = new Uint8Array(ciphertextWithTag);
  const ciphertext = ciphertextWithTagBytes.slice(0, -16);
  const tag = ciphertextWithTagBytes.slice(-16);

  return {
    ciphertext: bytesToHex(ciphertext),
    iv: bytesToHex(iv),
    tag: bytesToHex(tag),
    algorithm: 'AES-256-GCM',
  };
}

/**
 * Decrypt an EncryptedPayload back to the original object.
 */
export async function decrypt(keyHex: string, payload: EncryptedPayload): Promise<object> {
  const cryptoKey = await importAesKey(keyHex, ['decrypt']);
  const iv = hexToBytes(payload.iv);
  const ciphertext = hexToBytes(payload.ciphertext);
  const tag = hexToBytes(payload.tag);

  // Reassemble ciphertext + tag for AES-GCM
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);

  const plaintext = await getCrypto().subtle.decrypt(
    { name: ALGORITHM, iv: toArrayBuffer(iv) },
    cryptoKey,
    toArrayBuffer(combined),
  );

  return JSON.parse(new TextDecoder().decode(plaintext)) as object;
}
