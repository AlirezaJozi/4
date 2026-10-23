import { generateOtp, hashValue, safeEqual } from '../src/utils/crypto.js';
import { slugPattern } from '../src/utils/slug.js';
import { z } from 'zod';

describe('security and validation units', () => {
  test('OTP is numeric with configured length and hashes compare safely', () => {
    const otp = generateOtp(6);
    expect(otp).toMatch(/^\d{6}$/);
    expect(safeEqual(hashValue(otp), hashValue(otp))).toBe(true);
    expect(safeEqual(hashValue(otp), hashValue('000000'))).toBe(false);
  });
  test('slug accepts safe slugs and rejects unsafe values', () => {
    expect(slugPattern.test('laser-treatment-1')).toBe(true);
    expect(slugPattern.test('Laser Treatment')).toBe(false);
    expect(slugPattern.test('../admin')).toBe(false);
  });
  test('consultation service ids must be unique', () => {
    const schema = z.array(z.number().int().positive()).min(1).refine((ids) => new Set(ids).size === ids.length);
    expect(schema.safeParse([1, 2]).success).toBe(true);
    expect(schema.safeParse([1, 1]).success).toBe(false);
  });
});
