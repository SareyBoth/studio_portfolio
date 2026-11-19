import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/password';

describe('password hashing (scrypt)', () => {
  it('hashes and verifies a valid password with unique salts', async () => {
    const hash1 = await hashPassword('SuperSecretPass123!');
    const hash2 = await hashPassword('SuperSecretPass123!');

    expect(hash1).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(hash1).not.toBe(hash2);

    expect(await verifyPassword('SuperSecretPass123!', hash1)).toBe(true);
    expect(await verifyPassword('SuperSecretPass123!', hash2)).toBe(true);
    expect(await verifyPassword('WrongPassword123!', hash1)).toBe(false);
  });

  it('rejects passwords shorter than 8 characters', async () => {
    await expect(hashPassword('short')).rejects.toThrow(/at least 8/i);
  });

  it('returns false for malformed stored hashes', async () => {
    expect(await verifyPassword('SuperSecretPass123!', 'not-a-valid-hash')).toBe(false);
    expect(await verifyPassword('SuperSecretPass123!', 'bcrypt$abc$def')).toBe(false);
  });
});
