import { asc } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { requireAdmin } from '@/lib/auth';
import ExperienceManager from '@/components/dashboard/ExperienceManager';

export default async function DashboardExperiencePage() {
  await requireAdmin();
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.experiences)
    .orderBy(asc(schema.experiences.sortOrder), asc(schema.experiences.createdAt));

  return (
    <ExperienceManager
      initialExperiences={rows.map((e) => ({
        id: e.id,
        period: e.period,
        role: e.role,
        organization: e.organization,
        location: e.location,
        responsibilities: e.responsibilities,
        sortOrder: e.sortOrder,
      }))}
    />
  );
}
