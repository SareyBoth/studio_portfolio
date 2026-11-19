import { desc } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { requireAdmin } from '@/lib/auth';
import MediaLibraryManager from '@/components/dashboard/MediaLibraryManager';

export default async function DashboardMediaPage() {
  await requireAdmin();
  const db = getDb();

  const rows = await db
    .select()
    .from(schema.mediaAssets)
    .orderBy(desc(schema.mediaAssets.createdAt));

  return (
    <MediaLibraryManager
      initialAssets={rows.map((r) => ({
        id: r.id,
        key: r.key,
        url: r.url,
        kind: r.kind,
        folder: r.folder,
        originalFilename: r.originalFilename,
        mimeType: r.mimeType,
        sizeBytes: r.sizeBytes,
        width: r.width,
        height: r.height,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
