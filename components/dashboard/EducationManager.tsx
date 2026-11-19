'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import type { EducationData } from '@/types/portfolio';
import { deleteEducationAction, saveEducationAction } from '@/app/dashboard/actions';
import ConfirmDialog from './ConfirmDialog';

interface EducationManagerProps {
  initialEducation: EducationData[];
}

export default function EducationManager({ initialEducation }: EducationManagerProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<(Omit<EducationData, 'id'> & { id?: string }) | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<EducationData | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setStatusMsg(null);
    startTransition(async () => {
      const res = await saveEducationAction(editing);
      if (res.ok) {
        setStatusMsg({ type: 'ok', text: res.message ?? 'Education saved.' });
        setEditing(null);
        router.refresh();
      } else {
        setStatusMsg({ type: 'err', text: res.error ?? 'Failed to save.' });
      }
    });
  };

  const handleDelete = (item: EducationData) => {
    startTransition(async () => {
      const res = await deleteEducationAction(item.id);
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
            {'// ACADEMIC CREDENTIALS'}
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white">Education</h1>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              period: '',
              degree: '',
              institution: '',
              location: 'Phnom Penh, Cambodia',
              focus: '',
              sortOrder: initialEducation.length,
            })
          }
          className="px-4 py-2.5 rounded-xl bg-[#d7ff3f] hover:brightness-110 text-black text-xs font-mono font-bold flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Education</span>
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
              {editing.id ? `Edit: ${editing.degree}` : 'Add Education'}
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
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Degree / Diploma *</span>
              <input
                type="text"
                required
                value={editing.degree}
                onChange={(e) => setEditing({ ...editing, degree: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Institution *</span>
              <input
                type="text"
                required
                value={editing.institution}
                onChange={(e) => setEditing({ ...editing, institution: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Period *</span>
              <input
                type="text"
                required
                value={editing.period}
                onChange={(e) => setEditing({ ...editing, period: e.target.value })}
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

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Sort Order</span>
              <input
                type="number"
                min={0}
                value={editing.sortOrder}
                onChange={(e) =>
                  setEditing({ ...editing, sortOrder: Number(e.target.value) || 0 })
                }
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Academic Focus *</span>
            <textarea
              rows={3}
              required
              value={editing.focus}
              onChange={(e) => setEditing({ ...editing, focus: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none resize-y"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
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
              <span>{isPending ? 'Saving...' : 'Save Education'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {initialEducation.map((edu) => (
          <div
            key={edu.id}
            className="rounded-2xl bg-[#14151a] border border-white/10 p-6 flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-[#d7ff3f]">{edu.period}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...edu })}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(edu)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="text-base font-black text-white">{edu.degree}</h3>
              <p className="text-xs font-bold text-[#2549ff] mt-1">{edu.institution}</p>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{edu.focus}</p>
            </div>
            <div className="text-[11px] font-mono text-zinc-500 border-t border-white/10 pt-3">
              {edu.location}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete education entry?"
        description={`Remove "${deleteTarget?.degree ?? ''}" from your credentials?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
