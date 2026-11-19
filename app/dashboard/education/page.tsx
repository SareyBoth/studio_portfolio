import { asc } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { requireAdmin } from '@/lib/auth';
import EducationManager from '@/components/dashboard/EducationManager';

export default async function DashboardEducationPage() {
  await requireAdmin();
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.educations)
    .orderBy(asc(schema.educations.sortOrder), asc(schema.educations.createdAt));

  return (
    <EducationManager
      initialEducation={rows.map((e) => ({
        id: e.id,
        period: e.period,
        degree: e.degree,
        institution: e.institution,
        location: e.location,
        focus: e.focus,
        sortOrder: e.sortOrder,
      }))}
    />
  );
}
