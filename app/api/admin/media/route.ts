import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { requireAdminApi } from '@/lib/auth';
import type { MediaKind } from '@/types/portfolio';

export async function GET(request: NextRequest) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const kindParam = request.nextUrl.searchParams.get('kind');
  const db = getDb();

  const rows =
    kindParam === 'image' || kindParam === 'video' || kindParam === 'cv'
      ? await db
          .select()
          .from(schema.mediaAssets)
          .where(eq(schema.mediaAssets.kind, kindParam as MediaKind))
          .orderBy(desc(schema.mediaAssets.createdAt))
      : await db.select().from(schema.mediaAssets).orderBy(desc(schema.mediaAssets.createdAt));

  return NextResponse.json({
    assets: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
