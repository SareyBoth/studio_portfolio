import { asc } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { requireAdmin } from '@/lib/auth';
import { buildFallbackPortfolioPayload } from '@/lib/portfolio';
import StudioFramesEditor from '@/components/dashboard/StudioFramesEditor';
import type { StudioFrameData } from '@/types/portfolio';

export default async function DashboardStudioPage() {
  await requireAdmin();
  const db = getDb();

  const [frameRows, mediaRows] = await Promise.all([
    db.select().from(schema.studioFrames).orderBy(asc(schema.studioFrames.slotIndex)),
    db.select({ id: schema.mediaAssets.id, url: schema.mediaAssets.url }).from(schema.mediaAssets),
  ]);

  const mediaMap = new Map(mediaRows.map((m) => [m.id, m.url]));
  const fallbackFrames = buildFallbackPortfolioPayload().wallFrames;

  const frames: StudioFrameData[] = Array.from({ length: 6 }, (_, idx) => {
    const row = frameRows.find((r) => r.slotIndex === idx);
    if (row) {
      return {
        id: row.id,
        slotIndex: row.slotIndex,
        wall: idx < 3 ? 'left' : 'back',
        aspectRatio: idx < 3 ? '9:16' : '16:9',
        index: `0${idx + 1} / 06`,
        title: row.title,
        subtitle: row.subtitle,
        category: row.category,
        description: row.description,
        accentColor: row.accentColor,
        primaryMetric: row.primaryMetric,
        tags: row.tags,
        imageAssetId: row.imageAssetId,
        imageUrl: row.imageAssetId ? (mediaMap.get(row.imageAssetId) ?? null) : null,
      };
    }
    return fallbackFrames[idx];
  });

  return <StudioFramesEditor initialFrames={frames} />;
}
