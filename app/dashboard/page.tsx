import Link from 'next/link';
import { count, desc, eq, isNotNull } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { requireAdmin } from '@/lib/auth';
import { getPortfolioCacheStatus } from '@/lib/cache';
import { isR2Configured } from '@/lib/r2';
import { pingRedis } from '@/lib/redis';

export default async function DashboardOverviewPage() {
  await requireAdmin();
  const db = getDb();

  const [
    [{ value: projectCount }],
    [{ value: frameImageCount }],
    [{ value: skillCount }],
    [{ value: unreadCount }],
    [{ value: mediaCount }],
    recentInquiries,
    redisHealth,
    cacheStatus,
  ] = await Promise.all([
    db.select({ value: count() }).from(schema.projects),
    db
      .select({ value: count() })
      .from(schema.studioFrames)
      .where(isNotNull(schema.studioFrames.imageAssetId)),
    db.select({ value: count() }).from(schema.skills),
    db
      .select({ value: count() })
      .from(schema.contactInquiries)
      .where(eq(schema.contactInquiries.status, 'new')),
    db.select({ value: count() }).from(schema.mediaAssets),
    db
      .select()
      .from(schema.contactInquiries)
      .orderBy(desc(schema.contactInquiries.createdAt))
      .limit(5),
    pingRedis(),
    getPortfolioCacheStatus(),
  ]);

  const r2Ready = isR2Configured();

  const stats = [
    { label: 'Projects', value: projectCount, href: '/dashboard/projects', accent: '#d7ff3f' },
    {
      label: '3D Wall Frames (R2)',
      value: `${frameImageCount} / 6`,
      href: '/dashboard/studio',
      accent: '#06b6d4',
    },
    { label: 'Skills', value: skillCount, href: '/dashboard/skills', accent: '#ff6b12' },
    { label: 'Unread Briefs', value: unreadCount, href: '/dashboard/inquiries', accent: '#10b981' },
    { label: 'R2 Assets', value: mediaCount, href: '/dashboard/media', accent: '#f59e0b' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[11px] font-mono font-bold text-[#d7ff3f] tracking-widest block mb-1">
            {'// STUDIO COMMAND CENTER'}
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white">Dashboard Overview</h1>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-[#d7ff3f] text-black text-xs font-mono font-bold hover:brightness-110 transition-all self-start sm:self-auto"
        >
          Open Live 3D Studio ↗
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl bg-[#14151a] border border-white/10 hover:border-white/25 p-5 transition-colors flex flex-col justify-between gap-3"
          >
            <span className="text-[11px] font-mono text-zinc-400 uppercase">{s.label}</span>
            <span className="text-2xl font-black font-mono" style={{ color: s.accent }}>
              {s.value}
            </span>
          </Link>
        ))}
      </div>

      {/* Infrastructure Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#14151a] border border-white/10 p-5">
          <div className="text-[11px] font-mono text-zinc-400 uppercase mb-2">PostgreSQL</div>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>Connected (Drizzle ORM)</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#14151a] border border-white/10 p-5">
          <div className="text-[11px] font-mono text-zinc-400 uppercase mb-2">Redis Cache</div>
          <div className="flex items-center justify-between text-sm font-bold text-white">
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  redisHealth.ok ? 'bg-[#10b981]' : 'bg-red-500'
                }`}
              />
              <span>
                {redisHealth.ok ? `Connected (${redisHealth.latencyMs}ms)` : 'Disconnected'}
              </span>
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              {cacheStatus.cached ? `Warm (${cacheStatus.ttlSeconds}s)` : 'Cold'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#14151a] border border-white/10 p-5">
          <div className="text-[11px] font-mono text-zinc-400 uppercase mb-2">Cloudflare R2</div>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <span
              className={`w-2 h-2 rounded-full ${r2Ready ? 'bg-[#10b981]' : 'bg-amber-400'}`}
            />
            <span>{r2Ready ? 'Configured (Presigned PUT)' : 'Missing R2 Env Vars'}</span>
          </div>
        </div>
      </div>

      {/* Recent Inquiries */}
      <div className="rounded-2xl bg-[#14151a] border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <h2 className="text-sm font-mono font-bold text-white uppercase">
            Recent Project Briefs
          </h2>
          <Link
            href="/dashboard/inquiries"
            className="text-xs font-mono text-[#d7ff3f] hover:underline"
          >
            View All →
          </Link>
        </div>

        {recentInquiries.length === 0 ? (
          <p className="text-xs font-mono text-zinc-500 py-6 text-center">
            No project inquiries received yet.
          </p>
        ) : (
          <div className="divide-y divide-white/10">
            {recentInquiries.map((inq) => (
              <div
                key={inq.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{inq.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                      {inq.service}
                    </span>
                    {inq.status === 'new' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#d7ff3f] text-black font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate mt-1">{inq.message}</p>
                </div>
                <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                  {inq.createdAt.toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
