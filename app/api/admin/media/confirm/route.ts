import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { requireAdminApi } from '@/lib/auth';
import { buildR2PublicUrl, verifyR2ObjectExists } from '@/lib/r2';
import { validateMediaUpload } from '@/lib/r2-validation';
import { isSameOriginRequest } from '@/lib/request-ip';

const confirmSchema = z.object({
  key: z.string().trim().min(3).max(512),
  kind: z.enum(['image', 'video', 'cv']),
  folder: z.enum(['frames', 'projects', 'videos', 'profile', 'cv']),
  originalFilename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid media metadata.' },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (!data.key.startsWith(`${data.folder}/`) || data.key.includes('..')) {
    return NextResponse.json({ error: 'Invalid R2 object key.' }, { status: 400 });
  }

  const validation = validateMediaUpload({
    filename: data.originalFilename,
    mimeType: data.mimeType,
    sizeBytes: data.sizeBytes,
    kind: data.kind,
    folder: data.folder,
  });
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const head = await verifyR2ObjectExists(data.key);
  if (!head.exists) {
    return NextResponse.json(
      { error: 'Uploaded object could not be verified in Cloudflare R2.' },
      { status: 404 }
    );
  }

  const db = getDb();
  const url = buildR2PublicUrl(data.key);
  const [asset] = await db
    .insert(schema.mediaAssets)
    .values({
      key: data.key,
      url,
      kind: data.kind,
      folder: data.folder,
      originalFilename: data.originalFilename,
      mimeType: head.contentType || data.mimeType,
      sizeBytes: head.contentLength ?? data.sizeBytes,
      width: data.width ?? null,
      height: data.height ?? null,
    })
    .returning();

  return NextResponse.json(
    {
      asset: {
        ...asset,
        createdAt: asset.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
