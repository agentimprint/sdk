import { describe, expect, it } from 'vitest';
import { decrypt, deriveEntryKey, deriveVaultKey, encrypt, generateKey } from '../src/crypto.js';

describe('generateKey', () => {
  it('returns a 64-character hex string (256-bit)', () => {
    const key = generateKey();
    expect(key).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(key)).toBe(true);
  });

  it('generates unique keys each call', () => {
    const k1 = generateKey();
    const k2 = generateKey();
    expect(k1).not.toBe(k2);
  });

  it('returns only lowercase hex', () => {
    const key = generateKey();
    expect(key).toBe(key.toLowerCase());
  });
});

describe('deriveVaultKey', () => {
  it('returns a 64-character hex string', async () => {
    const master = generateKey();
    const derived = await deriveVaultKey(master, 'vault-uuid-123');
    expect(derived).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(derived)).toBe(true);
  });

  it('is deterministic (same master + uuid = same key)', async () => {
    const master = generateKey();
    const k1 = await deriveVaultKey(master, 'vault-abc');
    const k2 = await deriveVaultKey(master, 'vault-abc');
    expect(k1).toBe(k2);
  });

  it('differs for different vault uuids', async () => {
    const master = generateKey();
    const k1 = await deriveVaultKey(master, 'vault-1');
    const k2 = await deriveVaultKey(master, 'vault-2');
    expect(k1).not.toBe(k2);
  });

  it('differs for different master keys', async () => {
    const k1 = await deriveVaultKey(generateKey(), 'vault-x');
    const k2 = await deriveVaultKey(generateKey(), 'vault-x');
    expect(k1).not.toBe(k2);
  });
});

describe('deriveEntryKey', () => {
  it('returns a 64-character hex string', async () => {
    const vaultKey = generateKey();
    const derived = await deriveEntryKey(vaultKey, 'entry-uuid-abc');
    expect(derived).toHaveLength(64);
  });

  it('is deterministic', async () => {
    const vaultKey = generateKey();
    const k1 = await deriveEntryKey(vaultKey, 'entry-1');
    const k2 = await deriveEntryKey(vaultKey, 'entry-1');
    expect(k1).toBe(k2);
  });

  it('differs for different entry uuids', async () => {
    const vaultKey = generateKey();
    const k1 = await deriveEntryKey(vaultKey, 'entry-1');
    const k2 = await deriveEntryKey(vaultKey, 'entry-2');
    expect(k1).not.toBe(k2);
  });
});

describe('encrypt / decrypt round-trip', () => {
  it('decrypts back to original object', async () => {
    const key = generateKey();
    const data = { hello: 'world', count: 42, nested: { ok: true } };
    const payload = await encrypt(key, data);
    const decrypted = await decrypt(key, payload);
    expect(decrypted).toEqual(data);
  });

  it('produces different ciphertext for same plaintext (random IV)', async () => {
    const key = generateKey();
    const data = { msg: 'same data' };
    const p1 = await encrypt(key, data);
    const p2 = await encrypt(key, data);
    expect(p1.ciphertext).not.toBe(p2.ciphertext);
    expect(p1.iv).not.toBe(p2.iv);
  });

  it('payload has required fields', async () => {
    const key = generateKey();
    const payload = await encrypt(key, { x: 1 });
    expect(payload).toHaveProperty('ciphertext');
    expect(payload).toHaveProperty('iv');
    expect(payload).toHaveProperty('tag');
    expect(payload).toHaveProperty('algorithm');
  });

  it('algorithm field is AES-256-GCM', async () => {
    const key = generateKey();
    const payload = await encrypt(key, {});
    expect(payload.algorithm).toBe('AES-256-GCM');
  });

  it('IV is 24 hex chars (12 bytes)', async () => {
    const key = generateKey();
    const payload = await encrypt(key, {});
    expect(payload.iv).toHaveLength(24);
  });

  it('tag is 32 hex chars (16 bytes)', async () => {
    const key = generateKey();
    const payload = await encrypt(key, {});
    expect(payload.tag).toHaveLength(32);
  });

  it('throws on wrong key during decryption', async () => {
    const key = generateKey();
    const wrongKey = generateKey();
    const payload = await encrypt(key, { secret: 'data' });
    await expect(decrypt(wrongKey, payload)).rejects.toThrow();
  });

  it('encrypts complex nested objects', async () => {
    const key = generateKey();
    const data = {
      agent: { name: 'ClawdBot', version: '1.0' },
      memories: [{ id: 1, text: 'Hello' }, { id: 2, text: 'World' }],
      active: true,
      score: 99.5,
    };
    const payload = await encrypt(key, data);
    const result = await decrypt(key, payload);
    expect(result).toEqual(data);
  });

  it('encrypts objects with unicode values', async () => {
    const key = generateKey();
    const data = { greeting: '🦞 こんにちは مرحبا' };
    const payload = await encrypt(key, data);
    const result = await decrypt(key, payload);
    expect(result).toEqual(data);
  });

  it('vault key can be used for encrypt/decrypt', async () => {
    const master = generateKey();
    const vaultKey = await deriveVaultKey(master, 'vault-uuid-1');
    const data = { vault: 'data' };
    const payload = await encrypt(vaultKey, data);
    const result = await decrypt(vaultKey, payload);
    expect(result).toEqual(data);
  });
});
