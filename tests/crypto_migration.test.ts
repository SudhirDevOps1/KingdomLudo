import { describe, expect, it } from 'vitest';
import { decryptVaultData, encryptVaultData, hashSha256Hex } from '../src/persistence/cryptoVault';
import { CURRENT_SCHEMA_VERSION, runDataMigrations } from '../src/persistence/migrations';
import { generateDiceBearAvatarUri } from '../src/services/avatar/dicebearService';

describe('AES-GCM Vault, Data Migration & DiceBear Avatar Engine', () => {
  it('encrypts and decrypts payloads using AES-GCM', async () => {
    const sample = JSON.stringify({ displayName: 'King Arthur', wins: 12 });
    const encrypted = await encryptVaultData(sample);
    expect(encrypted.startsWith('aes:')).toBe(true);
    expect(encrypted).not.toContain('King Arthur');

    const decrypted = await decryptVaultData(encrypted);
    expect(decrypted).toBe(sample);
  });

  it('hashes backup payloads deterministically with SHA-256', async () => {
    const h1 = await hashSha256Hex('kingdomludo-data');
    const h2 = await hashSha256Hex('kingdomludo-data');
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it('migrates legacy XOR enc: records to AES-GCM and backfills avatar fields', async () => {
    localStorage.clear();
    const legacyProfile = {
      profileId: 'guest_local',
      isGuest: true,
      displayName: 'Legacy Hero',
      selectedCharacterId: 'ignis-drake',
    };
    const encoded = encodeURIComponent(JSON.stringify(legacyProfile));
    let xorOut = '';
    for (let i = 0; i < encoded.length; i += 1) {
      xorOut += String.fromCharCode(encoded.charCodeAt(i) ^ 0x5b);
    }
    localStorage.setItem('ck_profile', 'enc:' + btoa(xorOut));

    const res = await runDataMigrations();
    expect(res.toVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(res.migratedKeys).toBe(1);

    const migratedRaw = localStorage.getItem('ck_profile') || '';
    expect(migratedRaw.startsWith('aes:')).toBe(true);

    const parsed = JSON.parse(await decryptVaultData(migratedRaw)) as {
      displayName: string;
      avatarStyle: string;
      avatarSeed: string;
    };
    expect(parsed.displayName).toBe('Legacy Hero');
    expect(parsed.avatarStyle).toBe('adventurer');
    expect(parsed.avatarSeed.startsWith('cmd-')).toBe(true);
  });

  it('generates valid SVG data URIs with DiceBear Style API', () => {
    const uri1 = generateDiceBearAvatarUri('adventurer', 'Sudhir', 64);
    const uri2 = generateDiceBearAvatarUri('bottts', 'Mecha', 64);
    expect(uri1.startsWith('data:image/svg+xml')).toBe(true);
    expect(uri2.startsWith('data:image/svg+xml')).toBe(true);
    expect(uri1).not.toBe(uri2);
  });
});
