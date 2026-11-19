import { randomUUID } from 'node:crypto';
import type { MediaFolder, MediaKind } from '@/types/portfolio';

export const MEDIA_POLICIES: Record<
  MediaKind,
  {
    maxBytes: number;
    mimeTypes: readonly string[];
    extensions: Record<string, string>;
    allowedFolders: readonly MediaFolder[];
  }
> = {
  image: {
    maxBytes: 15 * 1024 * 1024, // 15 MB
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    extensions: {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/avif': 'avif',
    },
    allowedFolders: ['frames', 'projects', 'profile'],
  },
  video: {
    maxBytes: 250 * 1024 * 1024, // 250 MB
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    extensions: {
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
    },
    allowedFolders: ['videos'],
  },
  cv: {
    maxBytes: 15 * 1024 * 1024, // 15 MB
    mimeTypes: ['application/pdf'],
    extensions: {
      'application/pdf': 'pdf',
    },
    allowedFolders: ['cv'],
  },
};

export interface MediaUploadValidationInput {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  kind: MediaKind;
  folder: MediaFolder;
}

export function validateMediaUpload(input: MediaUploadValidationInput): {
  valid: boolean;
  error?: string;
} {
  const policy = MEDIA_POLICIES[input.kind];
  if (!policy) {
    return { valid: false, error: 'Unsupported media kind.' };
  }

  if (!policy.allowedFolders.includes(input.folder)) {
    return {
      valid: false,
      error: `Folder "${input.folder}" is not allowed for media kind "${input.kind}".`,
    };
  }

  if (!policy.mimeTypes.includes(input.mimeType)) {
    return {
      valid: false,
      error: `Unsupported file type "${input.mimeType}". Allowed: ${policy.mimeTypes.join(', ')}.`,
    };
  }

  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    return { valid: false, error: 'File size must be greater than 0 bytes.' };
  }

  if (input.sizeBytes > policy.maxBytes) {
    const maxMb = Math.round(policy.maxBytes / (1024 * 1024));
    return { valid: false, error: `File exceeds the ${maxMb} MB limit for ${input.kind} uploads.` };
  }

  if (!input.filename || input.filename.trim().length === 0) {
    return { valid: false, error: 'Filename is required.' };
  }

  return { valid: true };
}

export function sanitizeFilenameBase(filename: string): string {
  const base = filename
    .split(/[\\/]/)
    .pop()
    ?.replace(/\.[^.]+$/, '')
    ?.toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return base || 'asset';
}

export function generateR2ObjectKey(
  folder: MediaFolder,
  kind: MediaKind,
  mimeType: string,
  originalFilename: string
): string {
  const ext = MEDIA_POLICIES[kind].extensions[mimeType] ?? 'bin';
  const year = new Date().getUTCFullYear();
  const safeBase = sanitizeFilenameBase(originalFilename);
  const id = randomUUID().slice(0, 12);
  return `${folder}/${year}/${safeBase}-${id}.${ext}`;
}
