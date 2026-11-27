/**
 * AES-GCM 256-bit Web Crypto vault for local persistence at rest.
 * Supports decrypting legacy XOR (`enc:`) records for seamless data migration.
 */

const VAULT_SALT_KEY = 'kingdomludo_vault_salt_v2';

function getOrCreateVaultSecret(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 'kingdomludo_server_test_vault_key_v2';
  }
  try {
    const existing = localStorage.getItem(VAULT_SALT_KEY);
    if (existing && existing.length >= 16) return existing;
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const fresh = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(VAULT_SALT_KEY, fresh);
    return fresh;
  } catch {
    return 'kingdomludo_fallback_vault_key_v2';
  }
}

let cachedAesKey: CryptoKey | null = null;

async function getAesKey(): Promise<CryptoKey | null> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return null;
  if (cachedAesKey) return cachedAesKey;

  const secret = getOrCreateVaultSecret();
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  cachedAesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('kingdomludo-aes-gcm-v2'),
      iterations: 10000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  return cachedAesKey;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function decodeLegacyXor(raw: string): string {
  if (!raw.startsWith('enc:')) return raw;
  const decoded = atob(raw.slice(4));
  let out = '';
  for (let i = 0; i < decoded.length; i += 1) {
    out += String.fromCharCode(decoded.charCodeAt(i) ^ 0x5b);
  }
  return decodeURIComponent(out);
}

export async function encryptVaultData(plaintext: string): Promise<string> {
  try {
    const key = await getAesKey();
    if (!key) return plaintext;

    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    const encoded = new TextEncoder().encode(plaintext);
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

    return `aes:${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(cipherBuf))}`;
  } catch {
    return plaintext;
  }
}

export async function decryptVaultData(stored: string): Promise<string> {
  if (!stored) return stored;
  if (stored.startsWith('enc:')) {
    return decodeLegacyXor(stored);
  }
  if (!stored.startsWith('aes:')) {
    return stored;
  }

  try {
    const parts = stored.split(':');
    if (parts.length !== 3) return stored;
    const key = await getAesKey();
    if (!key) return stored;

    const iv = base64ToBytes(parts[1]);
    const cipher = base64ToBytes(parts[2]);
    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      cipher as BufferSource,
    );
    return new TextDecoder().decode(plainBuf);
  } catch {
    return stored;
  }
}

export async function hashSha256Hex(input: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return `fallback_${input.length}`;
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
