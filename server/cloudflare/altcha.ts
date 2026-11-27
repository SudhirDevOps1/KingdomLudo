/**
 * Self-hosted ALTCHA Proof-of-Work (SHA-256) challenge generator & verifier.
 * Uses standard Web Crypto API (compatible with Cloudflare Workers & Node 22+).
 */

export interface AltchaChallenge {
  algorithm: 'SHA-256';
  challenge: string;
  maxnumber: number;
  salt: string;
  signature: string;
}

export interface AltchaPayload {
  algorithm: 'SHA-256';
  challenge: string;
  number: number;
  salt: string;
  signature: string;
}

// Ephemeral fallback key when ALTCHA_HMAC_KEY env var is not configured
let runtimeFallbackKey: string | null = null;

function getHmacSecret(envSecret?: string): string {
  if (envSecret && envSecret.length >= 16) return envSecret;
  if (!runtimeFallbackKey) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    runtimeFallbackKey = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return runtimeFallbackKey;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return toHex(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createAltchaChallenge(
  envSecret?: string,
  maxnumber = 50000,
  ttlSeconds = 300,
): Promise<AltchaChallenge> {
  const secret = getHmacSecret(envSecret);
  const randBytes = new Uint8Array(12);
  crypto.getRandomValues(randBytes);
  const nonce = toHex(randBytes.buffer);
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const salt = `${nonce}?expires=${expiresAt}`;

  const randomValBytes = new Uint32Array(1);
  crypto.getRandomValues(randomValBytes);
  const secretNumber = randomValBytes[0] % maxnumber;

  const challenge = await sha256Hex(`${salt}${secretNumber}`);
  const signature = await hmacSha256Hex(secret, challenge);

  return {
    algorithm: 'SHA-256',
    challenge,
    maxnumber,
    salt,
    signature,
  };
}

export async function verifyAltchaPayload(
  encodedPayload: string,
  envSecret?: string,
): Promise<{ valid: boolean; reason?: string }> {
  if (!encodedPayload || typeof encodedPayload !== 'string' || encodedPayload.length > 2048) {
    return { valid: false, reason: 'Missing or malformed ALTCHA token' };
  }

  let parsed: AltchaPayload;
  try {
    const jsonStr = atob(encodedPayload);
    parsed = JSON.parse(jsonStr) as AltchaPayload;
  } catch {
    return { valid: false, reason: 'Invalid ALTCHA encoding' };
  }

  if (
    parsed.algorithm !== 'SHA-256' ||
    typeof parsed.challenge !== 'string' ||
    typeof parsed.salt !== 'string' ||
    typeof parsed.signature !== 'string' ||
    typeof parsed.number !== 'number' ||
    !Number.isFinite(parsed.number) ||
    parsed.number < 0
  ) {
    return { valid: false, reason: 'Incomplete ALTCHA payload' };
  }

  // Check expiry embedded in salt
  const expMatch = /[?&]expires=(\d+)/.exec(parsed.salt);
  if (expMatch) {
    const expiresAt = Number(expMatch[1]);
    if (Math.floor(Date.now() / 1000) > expiresAt) {
      return { valid: false, reason: 'ALTCHA challenge expired. Please verify again.' };
    }
  }

  const secret = getHmacSecret(envSecret);
  const expectedSig = await hmacSha256Hex(secret, parsed.challenge);
  if (!timingSafeEqual(expectedSig, parsed.signature)) {
    return { valid: false, reason: 'Invalid ALTCHA signature' };
  }

  const computedHash = await sha256Hex(`${parsed.salt}${parsed.number}`);
  if (!timingSafeEqual(computedHash, parsed.challenge)) {
    return { valid: false, reason: 'ALTCHA proof-of-work verification failed' };
  }

  return { valid: true };
}
