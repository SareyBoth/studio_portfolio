import { asc } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { requireAdmin } from '@/lib/auth';
import ProjectsManager from '@/components/dashboard/ProjectsManager';
import type { ProjectData } from '@/types/portfolio';

export default async function DashboardProjectsPage() {
  await requireAdmin();
  const db = getDb();

  const [projectRows, mediaRows] = await Promise.all([
    db
      .select()
      .from(schema.projects)
      .orderBy(asc(schema.projects.sortOrder), asc(schema.projects.createdAt)),
    db.select({ id: schema.mediaAssets.id, url: schema.mediaAssets.url }).from(schema.mediaAssets),
  ]);

  const mediaMap = new Map(mediaRows.map((m) => [m.id, m.url]));

  const projects: ProjectData[] = projectRows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    aspect: p.aspect,
    subtitle: p.subtitle,
    description: p.description,
    tools: p.tools,
    year: p.year,
    color: p.color,
    featured: p.featured,
    published: p.published,
    thumbnailAssetId: p.thumbnailAssetId,
    thumbnailUrl: p.thumbnailAssetId ? (mediaMap.get(p.thumbnailAssetId) ?? null) : null,
    videoAssetId: p.videoAssetId,
    videoUrl: p.videoAssetId ? (mediaMap.get(p.videoAssetId) ?? null) : null,
    externalVideoUrl: p.externalVideoUrl,
    sortOrder: p.sortOrder,
  }));

  return <ProjectsManager initialProjects={projects} />;
}
