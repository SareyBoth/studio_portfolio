import 'server-only';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { MediaFolder, MediaKind } from '@/types/portfolio';
import { generateR2ObjectKey, validateMediaUpload } from './r2-validation';

const globalForR2 = globalThis as unknown as {
  __ratanakR2Client?: S3Client;
};

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, '');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error(
      'Cloudflare R2 environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL) must all be configured.'
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
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

export function buildR2PublicUrl(key: string): string {
  const { publicUrl } = getR2Config();
  return `${publicUrl}/${key.replace(/^\/+/, '')}`;
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
    expiresIn,
  };
}

export async function verifyR2ObjectExists(key: string): Promise<{
  exists: boolean;
  contentType?: string;
  contentLength?: number;
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
    };
  } catch {
    return { exists: false };
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
