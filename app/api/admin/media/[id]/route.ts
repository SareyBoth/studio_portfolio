import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { requireAdminApi } from '@/lib/auth';
import { invalidatePortfolioFromRoute } from '@/lib/cache';
import { deleteR2Object } from '@/lib/r2';
import { isSameOriginRequest } from '@/lib/request-ip';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const db = getDb();

  const [asset] = await db
    .select()
    .from(schema.mediaAssets)
    .where(eq(schema.mediaAssets.id, id))
    .limit(1);

  if (!asset) {
    return NextResponse.json({ error: 'Media asset not found.' }, { status: 404 });
  }

  try {
    await deleteR2Object(asset.key);
  } catch (err) {
    console.warn('[media/delete] Failed to delete R2 object (continuing DB cleanup):', err);
  }

  await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, id));
  await invalidatePortfolioFromRoute();

  return NextResponse.json({ ok: true });
}
