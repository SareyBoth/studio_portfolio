import { asc } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { requireAdmin } from '@/lib/auth';
import SkillsManager from '@/components/dashboard/SkillsManager';

export default async function DashboardSkillsPage() {
  await requireAdmin();
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.skills)
    .orderBy(asc(schema.skills.sortOrder), asc(schema.skills.createdAt));

  return (
    <SkillsManager
      initialSkills={rows.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        level: s.level,
        tag: s.tag,
        shortCode: s.shortCode,
        sortOrder: s.sortOrder,
      }))}
    />
  );
}
