import { listAdminSessions, requireAdmin } from '@/lib/auth';
import { getPortfolioCacheStatus } from '@/lib/cache';
import { pingRedis } from '@/lib/redis';
import SettingsManager from '@/components/dashboard/SettingsManager';

export default async function DashboardSettingsPage() {
  const admin = await requireAdmin();

  const [sessions, redisHealth, cacheStatus] = await Promise.all([
    listAdminSessions(admin.id, admin.sessionId),
    pingRedis(),
    getPortfolioCacheStatus(),
  ]);

  return (
    <SettingsManager
      admin={admin}
      sessions={sessions}
      redisHealth={redisHealth}
      cacheStatus={cacheStatus}
    />
  );
}
