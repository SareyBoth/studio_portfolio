import 'server-only';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { MediaFolder, MediaKind } from '@/types/portfolio';
import { generateR2ObjectKey, validateMediaUpload } from './r2-validation';
import { buildInternalStreamPath } from './video-stream';

const globalForR2 = globalThis as unknown as {
  __ratanakR2Client?: S3Client;
};

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, '') || null;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      'Cloudflare R2 environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) must all be configured.'
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
  );
}

export function getR2Client(): S3Client {
  if (!globalForR2.__ratanakR2Client) {
    const cfg = getR2Config();
    globalForR2.__ratanakR2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });
  }
  return globalForR2.__ratanakR2Client;
}

/**
 * Builds the primary playback/display URL for an R2 object.
 * - For videos (or when R2_PUBLIC_URL is not configured), returns the built-in
 *   HTTP 206 byte-range streaming endpoint (`/api/media/stream/<key>`) if R2_PUBLIC_URL is unset,
 *   or the public CDN URL when R2_PUBLIC_URL is configured.
 */
export function buildR2PublicUrl(key: string): string {
  const { publicUrl } = getR2Config();
  const cleanKey = key.replace(/^\/+/, '');
  if (!publicUrl) {
    return buildInternalStreamPath(cleanKey);
  }
  return `${publicUrl}/${cleanKey}`;
}

export async function createPresignedUploadUrl(params: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  kind: MediaKind;
  folder: MediaFolder;
}): Promise<{
  uploadUrl: string;
  key: string;
  publicUrl: string;
  streamUrl: string;
  expiresIn: number;
}> {
  const validation = validateMediaUpload(params);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { bucket } = getR2Config();
  const key = generateR2ObjectKey(params.folder, params.kind, params.mimeType, params.filename);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: params.mimeType,
    ContentLength: params.sizeBytes,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  const expiresIn = 300; // 5 minutes
  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: buildR2PublicUrl(key),
    streamUrl: buildInternalStreamPath(key),
    expiresIn,
  };
}

export async function verifyR2ObjectExists(key: string): Promise<{
  exists: boolean;
  contentType?: string;
  contentLength?: number;
  etag?: string;
}> {
  const { bucket } = getR2Config();
  try {
    const head = await getR2Client().send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return {
      exists: true,
      contentType: head.ContentType,
      contentLength: head.ContentLength,
      etag: head.ETag,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Fetches a readable stream from Cloudflare R2 supporting HTTP byte-range requests (`Range: bytes=start-end`)
 * for instant browser `<video>` seeking and chunked playback.
 */
export async function getR2ObjectStream(
  key: string,
  rangeHeader?: string | null
): Promise<{
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  etag?: string;
  isPartial: boolean;
} | null> {
  const { bucket } = getR2Config();
  try {
    const response = await getR2Client().send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ...(rangeHeader ? { Range: rangeHeader } : {}),
      })
    );

    if (!response.Body) {
      return null;
    }

    const webStream = response.Body.transformToWebStream();
    return {
      stream: webStream,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength,
      contentRange: response.ContentRange,
      etag: response.ETag,
      isPartial: Boolean(rangeHeader && response.ContentRange),
    };
  } catch {
    return null;
  }
}

export async function deleteR2Object(key: string): Promise<void> {
  const { bucket } = getR2Config();
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
