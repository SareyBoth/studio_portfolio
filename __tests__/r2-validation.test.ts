import { describe, expect, it } from 'vitest';
import {
  generateR2ObjectKey,
  sanitizeFilenameBase,
  validateMediaUpload,
} from '@/lib/r2-validation';

describe('Cloudflare R2 upload validation & key sanitization', () => {
  it('allows valid image, video, and CV PDF uploads within limits', () => {
    expect(
      validateMediaUpload({
        filename: 'frame-01.webp',
        mimeType: 'image/webp',
        sizeBytes: 2_500_000,
        kind: 'image',
        folder: 'frames',
      }).valid
    ).toBe(true);

    expect(
      validateMediaUpload({
        filename: 'reel-4k.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 120 * 1024 * 1024,
        kind: 'video',
        folder: 'videos',
      }).valid
    ).toBe(true);

    expect(
      validateMediaUpload({
        filename: 'Heng_Ratanak_CV.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1_200_000,
        kind: 'cv',
        folder: 'cv',
      }).valid
    ).toBe(true);
  });

  it('rejects disallowed MIME types, oversized files, and mismatched folders', () => {
    expect(
      validateMediaUpload({
        filename: 'payload.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: 1024,
        kind: 'image',
        folder: 'frames',
      }).valid
    ).toBe(false);

    expect(
      validateMediaUpload({
        filename: 'huge.png',
        mimeType: 'image/png',
        sizeBytes: 20 * 1024 * 1024, // > 15 MB
        kind: 'image',
        folder: 'projects',
      }).valid
    ).toBe(false);

    expect(
      validateMediaUpload({
        filename: 'cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 500_000,
        kind: 'cv',
        folder: 'frames', // mismatched folder
      }).valid
    ).toBe(false);
  });

  it('sanitizes filenames against path traversal and generates clean R2 keys', () => {
    expect(sanitizeFilenameBase('../../etc/passwd.png')).toBe('passwd');
    expect(sanitizeFilenameBase('My Cool Poster (Final)!.jpg')).toBe('my-cool-poster-final');

    const key = generateR2ObjectKey('frames', 'image', 'image/webp', '../../My Frame!.webp');
    expect(key).toMatch(/^frames\/\d{4}\/my-frame-[0-9a-f-]{12}\.webp$/);
    expect(key).not.toContain('..');
  });
});
