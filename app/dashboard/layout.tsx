import React, { Suspense } from 'react';
import { count, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { requireAdmin } from '@/lib/auth';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

async function AuthenticatedDashboardShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  let unreadCount = 0;
  try {
    const db = getDb();
    const [{ value }] = await db
      .select({ value: count() })
      .from(schema.contactInquiries)
      .where(eq(schema.contactInquiries.status, 'new'));
    unreadCount = value;
  } catch {
    unreadCount = 0;
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0b0d] text-[#f2efe8] flex flex-col lg:flex-row">
      <DashboardSidebar
        adminName={admin.name}
        adminEmail={admin.email}
        unreadInquiries={unreadCount}
      />
      <main className="flex-1 min-w-0 p-5 sm:p-8 lg:p-10 max-w-6xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#0a0b0d] text-[#f2efe8] flex items-center justify-center font-mono text-xs text-zinc-400">
          Loading studio dashboard...
        </div>
      }
    >
      <AuthenticatedDashboardShell>{children}</AuthenticatedDashboardShell>
    </Suspense>
  );
}
