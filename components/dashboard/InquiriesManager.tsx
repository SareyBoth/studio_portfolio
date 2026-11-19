'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Trash2, Save } from 'lucide-react';
import type { ContactInquiryData, InquiryStatus } from '@/types/portfolio';
import { deleteInquiryAction, updateInquiryAction } from '@/app/dashboard/actions';
import ConfirmDialog from './ConfirmDialog';

interface InquiriesManagerProps {
  initialInquiries: ContactInquiryData[];
}

export default function InquiriesManager({ initialInquiries }: InquiriesManagerProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | InquiryStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialInquiries[0]?.id ?? null);
  const [deleteTarget, setDeleteTarget] = useState<ContactInquiryData | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered =
    filter === 'all'
      ? initialInquiries
      : initialInquiries.filter((i) => i.status === filter);

  const selected = filtered.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

  const [draftStatus, setDraftStatus] = useState<InquiryStatus>(selected?.status ?? 'new');
  const [draftNotes, setDraftNotes] = useState<string>(selected?.adminNotes ?? '');

  const selectInquiry = (inq: ContactInquiryData) => {
    setSelectedId(inq.id);
    setDraftStatus(inq.status);
    setDraftNotes(inq.adminNotes);
    setStatusMsg(null);
  };

  const handleSave = () => {
    if (!selected) return;
    startTransition(async () => {
      const res = await updateInquiryAction({
        id: selected.id,
        status: draftStatus,
        adminNotes: draftNotes,
      });
      setStatusMsg(res.ok ? (res.message ?? 'Updated.') : (res.error ?? 'Failed.'));
      router.refresh();
    });
  };

  const handleDelete = (inq: ContactInquiryData) => {
    startTransition(async () => {
      await deleteInquiryAction(inq.id);
      setDeleteTarget(null);
      setSelectedId(null);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-white/10 pb-6">
        <span className="text-[11px] font-mono font-bold text-[#d7ff3f] tracking-widest block mb-1">
          {'// CLIENT PROJECT BRIEFS'}
        </span>
        <h1 className="text-3xl font-black tracking-tight text-white">Contact Inbox</h1>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'new', 'read', 'replied', 'archived'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilter(st)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase cursor-pointer ${
              filter === st
                ? 'bg-[#d7ff3f] text-black font-bold'
                : 'bg-[#14151a] border border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-[#14151a] border border-white/10 p-12 text-center font-mono text-xs text-zinc-500">
          No inquiries in this view.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            {filtered.map((inq) => {
              const isSelected = selected?.id === inq.id;
              return (
                <button
                  key={inq.id}
                  type="button"
                  onClick={() => selectInquiry(inq)}
                  className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a1c24] border-[#d7ff3f]'
                      : 'bg-[#14151a] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold text-white truncate">{inq.name}</span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                        inq.status === 'new'
                          ? 'bg-[#d7ff3f] text-black'
                          : inq.status === 'replied'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/10 text-zinc-400'
                      }`}
                    >
                      {inq.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 truncate mb-1">
                    {inq.service}
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2">{inq.message}</p>
                </button>
              );
            })}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="lg:col-span-7 rounded-2xl bg-[#14151a] border border-white/10 p-6 flex flex-col gap-5 h-fit">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white">{selected.name}</h2>
                  <p className="text-xs font-mono text-[#d7ff3f] mt-0.5">{selected.email}</p>
                  <p className="text-[11px] font-mono text-zinc-500 mt-1">
                    {selected.service} · {new Date(selected.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.service} Inquiry`)}`}
                    className="px-3 py-2 rounded-xl bg-[#d7ff3f] text-black text-xs font-mono font-bold flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selected)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                    aria-label="Delete inquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-[#0b0b0d] border border-white/10 p-4 text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {selected.message}
              </div>

              {statusMsg && (
                <div className="text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                  {statusMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase">Status</span>
                  <select
                    value={draftStatus}
                    onChange={(e) => setDraftStatus(e.target.value as InquiryStatus)}
                    className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>

                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleSave}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isPending ? 'Saving...' : 'Save Status & Notes'}</span>
                  </button>
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">
                  Private Admin Notes
                </span>
                <textarea
                  rows={3}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Quote sent, follow-up date, deliverables..."
                  className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none resize-y"
                />
              </label>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this inquiry?"
        description={`Permanently delete the brief from ${deleteTarget?.name ?? ''}?`}
        confirmLabel="Delete Inquiry"
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
