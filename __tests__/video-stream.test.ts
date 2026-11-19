import { describe, expect, it } from 'vitest';
import {
  buildInternalStreamPath,
  extractR2KeyFromUrl,
  isValidR2StreamKey,
  normalizeHttpRangeHeader,
} from '@/lib/video-stream';

describe('Cloudflare R2 video streaming & HTTP Range helpers', () => {
  it('validates allowed R2 object keys and rejects path traversal', () => {
    expect(isValidR2StreamKey('videos/2026/reel-123456.mp4')).toBe(true);
    expect(isValidR2StreamKey('frames/2026/poster-abc.webp')).toBe(true);

    expect(isValidR2StreamKey('../secrets.txt')).toBe(false);
    expect(isValidR2StreamKey('videos/../etc/passwd')).toBe(false);
    expect(isValidR2StreamKey('/videos/2026/reel.mp4')).toBe(false);
    expect(isValidR2StreamKey('unknown/2026/file.mp4')).toBe(false);
  });

  it('normalizes valid HTTP Range headers and rejects malformed or inverted ranges', () => {
    expect(normalizeHttpRangeHeader('bytes=0-1048575')).toBe('bytes=0-1048575');
    expect(normalizeHttpRangeHeader('bytes=2048-')).toBe('bytes=2048-');
    expect(normalizeHttpRangeHeader('bytes=-500')).toBe('bytes=-500');

    expect(normalizeHttpRangeHeader(null)).toBeNull();
    expect(normalizeHttpRangeHeader('items=0-5')).toBeNull();
    expect(normalizeHttpRangeHeader('bytes=-')).toBeNull();
    expect(normalizeHttpRangeHeader('bytes=5000-100')).toBeNull();
  });

  it('extracts R2 object keys from public CDN URLs, internal stream paths, or raw keys', () => {
    const key = 'videos/2026/commercial-cut-a1b2c3d4e5f6.mp4';
    expect(extractR2KeyFromUrl(`https://media.sareyboth.xyz/${key}`)).toBe(key);
    expect(extractR2KeyFromUrl(buildInternalStreamPath(key))).toBe(key);
    expect(extractR2KeyFromUrl(key)).toBe(key);
    expect(extractR2KeyFromUrl('https://youtube.com/watch?v=123')).toBeNull();
  });
});
