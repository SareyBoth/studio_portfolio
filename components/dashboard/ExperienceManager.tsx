'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import type { ExperienceData } from '@/types/portfolio';
import { deleteExperienceAction, saveExperienceAction } from '@/app/dashboard/actions';
import ConfirmDialog from './ConfirmDialog';

interface ExperienceManagerProps {
  initialExperiences: ExperienceData[];
}

export default function ExperienceManager({ initialExperiences }: ExperienceManagerProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<(Omit<ExperienceData, 'id'> & { id?: string }) | null>(
    null
  );
  const [bulletsText, setBulletsText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ExperienceData | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const openNew = () => {
    setEditing({
      period: '',
      role: '',
      organization: '',
      location: 'Phnom Penh, Cambodia',
      responsibilities: [],
      sortOrder: initialExperiences.length,
    });
    setBulletsText('');
  };

  const openEdit = (e: ExperienceData) => {
    setEditing({ ...e });
    setBulletsText(e.responsibilities.join('\n'));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setStatusMsg(null);
    const responsibilities = bulletsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      const res = await saveExperienceAction({ ...editing, responsibilities });
      if (res.ok) {
        setStatusMsg({ type: 'ok', text: res.message ?? 'Experience saved.' });
        setEditing(null);
        router.refresh();
      } else {
        setStatusMsg({ type: 'err', text: res.error ?? 'Failed to save.' });
      }
    });
  };

  const handleDelete = (item: ExperienceData) => {
    startTransition(async () => {
      const res = await deleteExperienceAction(item.id);
      setDeleteTarget(null);
      setStatusMsg(
        res.ok
          ? { type: 'ok', text: res.message ?? 'Deleted.' }
          : { type: 'err', text: res.error ?? 'Delete failed.' }
      );
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[11px] font-mono font-bold text-[#d7ff3f] tracking-widest block mb-1">
            {'// CAREER TIMELINE'}
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white">Work Experience</h1>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-2.5 rounded-xl bg-[#d7ff3f] hover:brightness-110 text-black text-xs font-mono font-bold flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Experience</span>
        </button>
      </div>

      {statusMsg && (
        <div
          role="status"
          className={`rounded-xl px-4 py-3 text-xs font-mono border ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/10 border-red-500/40 text-red-300'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {editing && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl bg-[#14151a] border border-[#d7ff3f]/40 p-6 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-black text-white">
              {editing.id ? `Edit: ${editing.role}` : 'Add Work Experience'}
            </h2>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-2 rounded-lg bg-white/5 text-zinc-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Role / Title *</span>
              <input
                type="text"
                required
                value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Period *</span>
              <input
                type="text"
                required
                placeholder="2025 - 2026"
                value={editing.period}
                onChange={(e) => setEditing({ ...editing, period: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Organization *</span>
              <input
                type="text"
                required
                value={editing.organization}
                onChange={(e) => setEditing({ ...editing, organization: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Location *</span>
              <input
                type="text"
                required
                value={editing.location}
                onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">
              Responsibilities / Achievements (one bullet per line) *
            </span>
            <textarea
              rows={5}
              required
              value={bulletsText}
              onChange={(e) => setBulletsText(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none resize-y"
            />
          </label>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span>Sort Order</span>
              <input
                type="number"
                min={0}
                value={editing.sortOrder}
                onChange={(e) =>
                  setEditing({ ...editing, sortOrder: Number(e.target.value) || 0 })
                }
                className="w-20 px-2.5 py-1.5 rounded-lg bg-[#0b0b0d] border border-white/10 text-white"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-mono text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-[#d7ff3f] text-black text-xs font-mono font-bold flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isPending ? 'Saving...' : 'Save Experience'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {initialExperiences.map((exp) => (
          <div
            key={exp.id}
            className="rounded-2xl bg-[#14151a] border border-white/10 p-6 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#d7ff3f]">{exp.period}</span>
                <h3 className="text-lg font-black text-white">{exp.role}</h3>
                <p className="text-xs font-mono text-zinc-400">
                  {exp.organization} · {exp.location}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(exp)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(exp)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <ul className="list-disc list-inside text-xs text-zinc-400 flex flex-col gap-1">
              {exp.responsibilities.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete experience entry?"
        description={`Remove "${deleteTarget?.role ?? ''}" at ${deleteTarget?.organization ?? ''}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
