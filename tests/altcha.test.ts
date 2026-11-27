import { describe, expect, it } from 'vitest';
import { createAltchaChallenge, verifyAltchaPayload } from '../server/cloudflare/altcha';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

describe('ALTCHA Proof-of-Work Challenge & Verifier', () => {
  const TEST_SECRET = 'kingdomludo_test_hmac_secret_123456';

  it('generates a valid SHA-256 challenge and verifies the solved payload', async () => {
    const ch = await createAltchaChallenge(TEST_SECRET, 500, 300);
    expect(ch.algorithm).toBe('SHA-256');
    expect(ch.challenge).toMatch(/^[0-9a-f]{64}$/);
    expect(ch.signature).toMatch(/^[0-9a-f]{64}$/);

    let solvedNumber = -1;
    for (let n = 0; n < ch.maxnumber; n += 1) {
      const h = await sha256Hex(`${ch.salt}${n}`);
      if (h === ch.challenge) {
        solvedNumber = n;
        break;
      }
    }
    expect(solvedNumber).toBeGreaterThanOrEqual(0);

    const token = btoa(
      JSON.stringify({
        algorithm: ch.algorithm,
        challenge: ch.challenge,
        number: solvedNumber,
        salt: ch.salt,
        signature: ch.signature,
      }),
    );

    const result = await verifyAltchaPayload(token, TEST_SECRET);
    expect(result.valid).toBe(true);
  });

  it('rejects tampered signature or wrong number', async () => {
    const ch = await createAltchaChallenge(TEST_SECRET, 200, 300);
    const badSigToken = btoa(
      JSON.stringify({
        algorithm: ch.algorithm,
        challenge: ch.challenge,
        number: 0,
        salt: ch.salt,
        signature: '0'.repeat(64),
      }),
    );
    const res1 = await verifyAltchaPayload(badSigToken, TEST_SECRET);
    expect(res1.valid).toBe(false);

    const res2 = await verifyAltchaPayload('not-valid-base64!!!', TEST_SECRET);
    expect(res2.valid).toBe(false);
  });

  it('rejects expired ALTCHA challenges', async () => {
    const ch = await createAltchaChallenge(TEST_SECRET, 100, -10);
    const token = btoa(
      JSON.stringify({
        algorithm: ch.algorithm,
        challenge: ch.challenge,
        number: 1,
        salt: ch.salt,
        signature: ch.signature,
      }),
    );
    const res = await verifyAltchaPayload(token, TEST_SECRET);
    expect(res.valid).toBe(false);
    expect(res.reason).toMatch(/expired/i);
  });
});
