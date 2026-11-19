import { desc } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { requireAdmin } from '@/lib/auth';
import InquiriesManager from '@/components/dashboard/InquiriesManager';

export default async function DashboardInquiriesPage() {
  await requireAdmin();
  const db = getDb();

  const rows = await db
    .select()
    .from(schema.contactInquiries)
    .orderBy(desc(schema.contactInquiries.createdAt));

  return (
    <InquiriesManager
      initialInquiries={rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        service: r.service,
        message: r.message,
        status: r.status,
        adminNotes: r.adminNotes,
        ipAddress: r.ipAddress,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))}
    />
  );
}
