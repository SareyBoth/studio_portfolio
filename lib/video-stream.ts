import type { MediaFolder } from '@/types/portfolio';

const ALLOWED_STREAM_FOLDERS: readonly MediaFolder[] = [
  'frames',
  'projects',
  'videos',
  'profile',
  'cv',
];

/**
 * Validates that an R2 object key belongs to one of the allowed folders
 * and contains no path-traversal sequences.
 */
export function isValidR2StreamKey(key: string): boolean {
  if (!key || key.includes('..') || key.startsWith('/') || key.includes('\\')) {
    return false;
  }
  const parts = key.split('/');
  if (parts.length < 2) return false;
  const folder = parts[0] as MediaFolder;
  return ALLOWED_STREAM_FOLDERS.includes(folder);
}

/**
 * Validates and normalizes an incoming HTTP `Range` header (e.g. `bytes=0-1048575` or `bytes=1024-`).
 * Returns null if no Range header or if malformed.
 */
export function normalizeHttpRangeHeader(rangeHeader: string | null | undefined): string | null {
  if (!rangeHeader) return null;
  const trimmed = rangeHeader.trim();
  const match = /^bytes=(\d*)-(\d*)$/i.exec(trimmed);
  if (!match) return null;

  const [, startStr, endStr] = match;
  if (!startStr && !endStr) return null;

  if (startStr && endStr) {
    const start = Number(startStr);
    const end = Number(endStr);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end) {
      return null;
    }
  }

  return `bytes=${startStr}-${endStr}`;
}

/**
 * Builds the internal Next.js byte-range streaming endpoint path for an R2 key.
 */
export function buildInternalStreamPath(key: string): string {
  const cleanKey = key
    .replace(/^\/+/, '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `/api/media/stream/${cleanKey}`;
}

/**
 * Extracts the R2 object key (e.g. `videos/2026/reel-abc123.mp4`) from either:
 * - a full R2 public URL (`https://media.domain.com/videos/2026/reel.mp4`)
 * - an internal stream URL (`/api/media/stream/videos/2026/reel.mp4`)
 * - or a raw R2 key (`videos/2026/reel.mp4`)
 */
export function extractR2KeyFromUrl(urlOrKey: string): string | null {
  if (!urlOrKey) return null;

  const streamPrefix = '/api/media/stream/';
  if (urlOrKey.startsWith(streamPrefix)) {
    const key = decodeURIComponent(urlOrKey.slice(streamPrefix.length));
    return isValidR2StreamKey(key) ? key : null;
  }

  if (isValidR2StreamKey(urlOrKey)) {
    return urlOrKey;
  }

  try {
    const parsed = new URL(urlOrKey, 'http://localhost');
    if (parsed.pathname.startsWith(streamPrefix)) {
      const key = decodeURIComponent(parsed.pathname.slice(streamPrefix.length));
      return isValidR2StreamKey(key) ? key : null;
    }
    const candidate = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    return isValidR2StreamKey(candidate) ? candidate : null;
  } catch {
    return null;
  }
}
