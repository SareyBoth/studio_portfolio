'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import type { SkillCategory, SkillData, SkillLevel } from '@/types/portfolio';
import { deleteSkillAction, saveSkillAction } from '@/app/dashboard/actions';
import ConfirmDialog from './ConfirmDialog';

interface SkillsManagerProps {
  initialSkills: SkillData[];
}

export default function SkillsManager({ initialSkills }: SkillsManagerProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<(Omit<SkillData, 'id'> & { id?: string }) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SkillData | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setStatusMsg(null);
    startTransition(async () => {
      const res = await saveSkillAction(editing);
      if (res.ok) {
        setStatusMsg({ type: 'ok', text: res.message ?? 'Skill saved.' });
        setEditing(null);
        router.refresh();
      } else {
        setStatusMsg({ type: 'err', text: res.error ?? 'Failed to save skill.' });
      }
    });
  };

  const handleDelete = (skill: SkillData) => {
    startTransition(async () => {
      const res = await deleteSkillAction(skill.id);
      setDeleteTarget(null);
      setStatusMsg(
        res.ok
          ? { type: 'ok', text: res.message ?? 'Skill deleted.' }
          : { type: 'err', text: res.error ?? 'Failed to delete.' }
      );
      router.refresh();
    });
  };

  const categories: SkillCategory[] = ['Design & Visual', 'Video & Motion', 'IT & Networking'];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[11px] font-mono font-bold text-[#d7ff3f] tracking-widest block mb-1">
            {'// TOOLS & CAPABILITIES'}
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white">Skills &amp; Tech Stack</h1>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              name: '',
              category: 'Design & Visual',
              level: 'Advanced',
              tag: '',
              shortCode: '',
              sortOrder: initialSkills.length,
            })
          }
          className="px-4 py-2.5 rounded-xl bg-[#d7ff3f] hover:brightness-110 text-black text-xs font-mono font-bold flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Skill</span>
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
              {editing.id ? `Edit: ${editing.name}` : 'New Skill'}
            </h2>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-2 rounded-lg bg-white/5 text-zinc-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Skill Name *</span>
              <input
                type="text"
                required
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Short Code *</span>
              <input
                type="text"
                required
                maxLength={16}
                placeholder="Ps, Pr, MikroTik"
                value={editing.shortCode}
                onChange={(e) => setEditing({ ...editing, shortCode: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm font-mono text-white outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Focus Tag *</span>
              <input
                type="text"
                required
                placeholder="Print & Digital"
                value={editing.tag}
                onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Category</span>
              <select
                value={editing.category}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value as SkillCategory })
                }
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Proficiency</span>
              <select
                value={editing.level}
                onChange={(e) => setEditing({ ...editing, level: e.target.value as SkillLevel })}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              >
                <option value="Expert">Expert</option>
                <option value="Advanced">Advanced</option>
                <option value="Intermediate">Intermediate</option>
              </select>
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
              className="px-5 py-2 rounded-xl bg-[#d7ff3f] text-black text-xs font-mono font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isPending ? 'Saving...' : 'Save Skill'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const items = initialSkills.filter((s) => s.category === cat);
          return (
            <div
              key={cat}
              className="rounded-2xl bg-[#14151a] border border-white/10 p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h2 className="text-sm font-black text-white">{cat}</h2>
                <span className="text-[11px] font-mono text-zinc-500">{items.length}</span>
              </div>
              {items.map((skill) => (
                <div
                  key={skill.id}
                  className="p-3 rounded-xl bg-[#0b0b0d] border border-white/10 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-mono font-bold text-[#d7ff3f] shrink-0">
                      {skill.shortCode}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{skill.name}</div>
                      <div className="text-[10px] font-mono text-zinc-500 truncate">
                        {skill.level} · {skill.tag}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...skill })}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 cursor-pointer"
                      aria-label={`Edit ${skill.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(skill)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                      aria-label={`Delete ${skill.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this skill?"
        description={`Remove "${deleteTarget?.name ?? ''}" from your portfolio tech stack?`}
        confirmLabel="Delete Skill"
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
