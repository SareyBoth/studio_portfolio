'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ShieldCheck, LogOut, Trash2 } from 'lucide-react';
import type { AdminSessionRecord, AuthenticatedAdmin } from '@/lib/auth';
import {
  purgeCacheAction,
  revokeOtherSessionsAction,
  revokeSessionAction,
  updateCredentialsAction,
} from '@/app/dashboard/actions';

interface SettingsManagerProps {
  admin: AuthenticatedAdmin;
  sessions: AdminSessionRecord[];
  redisHealth: { ok: boolean; latencyMs: number | null; error?: string };
  cacheStatus: { cached: boolean; ttlSeconds: number };
}

export default function SettingsManager({
  admin,
  sessions,
  redisHealth,
  cacheStatus,
}: SettingsManagerProps) {
  const router = useRouter();
  const [name, setName] = useState(admin.name);
  const [email, setEmail] = useState(admin.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await updateCredentialsAction({
        currentPassword,
        newName: name,
        newEmail: email,
        newPassword: newPassword || undefined,
      });
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setMsg({ type: 'ok', text: res.message ?? 'Updated.' });
        router.refresh();
      } else {
        setMsg({ type: 'err', text: res.error ?? 'Failed to update.' });
      }
    });
  };

  const handlePurgeCache = () => {
    setMsg(null);
    startTransition(async () => {
      const res = await purgeCacheAction();
      setMsg({ type: res.ok ? 'ok' : 'err', text: res.message ?? res.error ?? '' });
      router.refresh();
    });
  };

  const handleRevokeSession = (sessionId: string) => {
    startTransition(async () => {
      const res = await revokeSessionAction(sessionId);
      setMsg({ type: res.ok ? 'ok' : 'err', text: res.message ?? res.error ?? '' });
      router.refresh();
    });
  };

  const handleRevokeOthers = () => {
    startTransition(async () => {
      const res = await revokeOtherSessionsAction();
      setMsg({ type: res.ok ? 'ok' : 'err', text: res.message ?? res.error ?? '' });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-white/10 pb-6">
        <span className="text-[11px] font-mono font-bold text-[#d7ff3f] tracking-widest block mb-1">
          {'// SECURITY, SESSIONS & REDIS'}
        </span>
        <h1 className="text-3xl font-black tracking-tight text-white">
          Security &amp; Cache Settings
        </h1>
      </div>

      {msg && (
        <div
          role="status"
          className={`rounded-xl px-4 py-3 text-xs font-mono border ${
            msg.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/10 border-red-500/40 text-red-300'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Redis Cache Inspector */}
      <section className="rounded-2xl bg-[#14151a] border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-mono font-bold text-white uppercase mb-1">
            Redis Portfolio Cache
          </h2>
          <p className="text-xs font-mono text-zinc-400">
            Status:{' '}
            <strong className={redisHealth.ok ? 'text-emerald-400' : 'text-red-400'}>
              {redisHealth.ok
                ? `Connected (${redisHealth.latencyMs}ms PING)`
                : redisHealth.error || 'Disconnected'}
            </strong>{' '}
            · Key <code className="text-zinc-200">portfolio:v1:full</code>:{' '}
            <strong className="text-[#d7ff3f]">
              {cacheStatus.cached ? `Cached (${cacheStatus.ttlSeconds}s TTL)` : 'Not cached'}
            </strong>
          </p>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={handlePurgeCache}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-[#d7ff3f] hover:text-black text-xs font-mono font-bold text-white flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Purge Cache Now</span>
        </button>
      </section>

      {/* Admin Credentials & Password Rotation */}
      <form
        onSubmit={handleUpdateCredentials}
        className="rounded-2xl bg-[#14151a] border border-white/10 p-6 flex flex-col gap-5"
      >
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <ShieldCheck className="w-4 h-4 text-[#d7ff3f]" />
          <h2 className="text-sm font-mono font-bold text-white uppercase">
            Admin Account &amp; Password
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Display Name</span>
            <input
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Admin Email</span>
            <input
              type="email"
              autoComplete="username"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">
              Current Password *
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">
              New Password (leave blank to keep current)
            </span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl bg-[#d7ff3f] text-black text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
          >
            {isPending ? 'Updating...' : 'Save Account Credentials'}
          </button>
        </div>
      </form>

      {/* Active Sessions */}
      <section className="rounded-2xl bg-[#14151a] border border-white/10 p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <h2 className="text-sm font-mono font-bold text-white uppercase">
            Active Sessions ({sessions.length})
          </h2>
          {sessions.length > 1 && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleRevokeOthers}
              className="px-3.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Other Devices</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-white/10">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {s.ipAddress || 'Unknown IP'}
                  </span>
                  {s.isCurrent && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d7ff3f]/20 text-[#d7ff3f] font-bold">
                      CURRENT SESSION
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">
                  {s.userAgent || 'Unknown browser'}
                </p>
                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  Last active: {new Date(s.lastActiveAt).toLocaleString()} · Expires:{' '}
                  {new Date(s.expiresAt).toLocaleDateString()}
                </p>
              </div>

              {!s.isCurrent && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRevokeSession(s.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-mono flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
