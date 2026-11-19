'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import type { DisciplineItem, ProfileData } from '@/types/portfolio';
import { updateProfileAction } from '@/app/dashboard/actions';
import R2Uploader from './R2Uploader';

interface ProfileEditorProps {
  initialProfile: ProfileData;
}

export default function ProfileEditor({ initialProfile }: ProfileEditorProps) {
  const [form, setForm] = useState<ProfileData>(initialProfile);
  const [rolesText, setRolesText] = useState(initialProfile.rolesCycling.join('\n'));
  const [statusesText, setStatusesText] = useState(initialProfile.terminalStatuses.join('\n'));
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const rolesCycling = rolesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const terminalStatuses = statusesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      const res = await updateProfileAction({
        name: form.name,
        role: form.role,
        location: form.location,
        locationShort: form.locationShort,
        timezone: form.timezone,
        availability: form.availability,
        isAvailable: form.isAvailable,
        kicker: form.kicker,
        headline: form.headline,
        subhead: form.subhead,
        bioLong: form.bioLong,
        aboutHeadline: form.aboutHeadline,
        rolesCycling: rolesCycling.length > 0 ? rolesCycling : ['Designer.'],
        terminalStatuses,
        disciplines: form.disciplines,
        contactEmail: form.contact.email,
        contactPhone: form.contact.phone,
        telegramHandle: form.contact.telegram,
        telegramUrl: form.contact.telegramUrl,
        facebookName: form.contact.facebook,
        facebookUrl: form.contact.facebookUrl,
        portraitAssetId: form.portraitAssetId,
        cvAssetId: form.cvAssetId,
        cvTitle: form.cvTitle,
        cvDescription: form.cvDescription,
        showTechnicalCategory: form.showTechnicalCategory,
        footerCtaHeadline: form.footerCtaHeadline,
        footerBio: form.footerBio,
      });

      setStatusMsg(
        res.ok
          ? { type: 'ok', text: res.message ?? 'Saved!' }
          : { type: 'err', text: res.error ?? 'Failed to save.' }
      );
    });
  };

  const updateDiscipline = (idx: number, patch: Partial<DisciplineItem>) => {
    setForm((prev) => ({
      ...prev,
      disciplines: prev.disciplines.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    }));
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[11px] font-mono font-bold text-[#d7ff3f] tracking-widest block mb-1">
            {'// IDENTITY, PORTRAIT & CV'}
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white">Profile &amp; Site Settings</h1>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl bg-[#d7ff3f] hover:brightness-110 text-black text-xs font-mono font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isPending ? 'Saving...' : 'Save Changes'}</span>
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

      {/* Portrait & CV R2 Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <R2Uploader
          label="Profile Portrait Photo (R2)"
          kind="image"
          folder="profile"
          currentUrl={form.portraitUrl}
          currentAssetId={form.portraitAssetId}
          aspectHint="Recommended 4:5 portrait — renders in Hero card & 3D Monitor"
          onChange={(asset) =>
            setForm((prev) => ({
              ...prev,
              portraitAssetId: asset?.id ?? null,
              portraitUrl: asset?.url ?? null,
            }))
          }
        />

        <R2Uploader
          label="Curriculum Vitae / Resume PDF (R2)"
          kind="cv"
          folder="cv"
          currentUrl={form.cvUrl}
          currentAssetId={form.cvAssetId}
          aspectHint="PDF up to 15 MB — served directly for Preview & Download"
          onChange={(asset) =>
            setForm((prev) => ({
              ...prev,
              cvAssetId: asset?.id ?? null,
              cvUrl: asset?.url ?? null,
            }))
          }
        />
      </div>

      {/* Hero & Identity */}
      <section className="rounded-2xl bg-[#14151a] border border-white/10 p-6 flex flex-col gap-5">
        <h2 className="text-sm font-mono font-bold text-white uppercase border-b border-white/10 pb-3">
          Hero &amp; Identity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Role Summary" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
          <Field label="Hero Kicker" value={form.kicker} onChange={(v) => setForm({ ...form, kicker: v })} />
          <Field label="Hero Headline" value={form.headline} onChange={(v) => setForm({ ...form, headline: v })} />
          <Field label="Location (Full)" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <Field
            label="Location (Short)"
            value={form.locationShort}
            onChange={(v) => setForm({ ...form, locationShort: v })}
          />
          <Field label="Timezone" value={form.timezone} onChange={(v) => setForm({ ...form, timezone: v })} />
          <Field
            label="Availability Label"
            value={form.availability}
            onChange={(v) => setForm({ ...form, availability: v })}
          />
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2.5 text-xs font-mono text-zinc-200 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              className="accent-[#d7ff3f] w-4 h-4"
            />
            <span>Available for Work (green pulse indicator)</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs font-mono text-zinc-200 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showTechnicalCategory}
              onChange={(e) => setForm({ ...form, showTechnicalCategory: e.target.checked })}
              className="accent-[#d7ff3f] w-4 h-4"
            />
            <span>Show &ldquo;Technical&rdquo; Category Tab in Projects Showcase</span>
          </label>
        </div>

        <TextAreaField
          label="Hero Subhead"
          rows={2}
          value={form.subhead}
          onChange={(v) => setForm({ ...form, subhead: v })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextAreaField
            label="Cycling Roles (one per line)"
            rows={4}
            value={rolesText}
            onChange={setRolesText}
          />
          <TextAreaField
            label="Terminal Status Lines (one per line)"
            rows={4}
            value={statusesText}
            onChange={setStatusesText}
          />
        </div>
      </section>

      {/* About & Disciplines */}
      <section className="rounded-2xl bg-[#14151a] border border-white/10 p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-mono font-bold text-white uppercase">
            About &amp; Discipline Pillars
          </h2>
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                disciplines: [
                  ...prev.disciplines,
                  {
                    index: `0${prev.disciplines.length + 1}`,
                    title: 'New Discipline',
                    desc: 'Describe your capability...',
                    tools: ['Tool 1'],
                    color: '#d7ff3f',
                    visible: true,
                  },
                ],
              }))
            }
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Pillar</span>
          </button>
        </div>

        <Field
          label="About Section Headline"
          value={form.aboutHeadline}
          onChange={(v) => setForm({ ...form, aboutHeadline: v })}
        />
        <TextAreaField
          label="Long Biography (About & CV Summary)"
          rows={4}
          value={form.bioLong}
          onChange={(v) => setForm({ ...form, bioLong: v })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {form.disciplines.map((d, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-[#0b0b0d] border border-white/10 p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.visible !== false}
                    onChange={(e) => updateDiscipline(idx, { visible: e.target.checked })}
                    className="accent-[#d7ff3f]"
                  />
                  <span>Visible on About Section</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      disciplines: prev.disciplines.filter((_, i) => i !== idx),
                    }))
                  }
                  className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                  aria-label="Remove discipline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Field
                  label="Index"
                  value={d.index}
                  onChange={(v) => updateDiscipline(idx, { index: v })}
                />
                <div className="col-span-2">
                  <Field
                    label="Title"
                    value={d.title}
                    onChange={(v) => updateDiscipline(idx, { title: v })}
                  />
                </div>
              </div>
              <TextAreaField
                label="Description"
                rows={3}
                value={d.desc}
                onChange={(v) => updateDiscipline(idx, { desc: v })}
              />
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Field
                    label="Tools (comma-separated)"
                    value={d.tools.join(', ')}
                    onChange={(v) =>
                      updateDiscipline(idx, {
                        tools: v
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
                <Field
                  label="Color Hex"
                  value={d.color}
                  onChange={(v) => updateDiscipline(idx, { color: v })}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact, CV Card & Footer */}
      <section className="rounded-2xl bg-[#14151a] border border-white/10 p-6 flex flex-col gap-5">
        <h2 className="text-sm font-mono font-bold text-white uppercase border-b border-white/10 pb-3">
          Contact Channels, CV Card &amp; Footer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Primary Email"
            value={form.contact.email}
            onChange={(v) => setForm({ ...form, contact: { ...form.contact, email: v } })}
          />
          <Field
            label="Telephone"
            value={form.contact.phone}
            onChange={(v) => setForm({ ...form, contact: { ...form.contact, phone: v } })}
          />
          <Field
            label="Telegram Handle"
            value={form.contact.telegram}
            onChange={(v) => setForm({ ...form, contact: { ...form.contact, telegram: v } })}
          />
          <Field
            label="Telegram URL"
            value={form.contact.telegramUrl}
            onChange={(v) => setForm({ ...form, contact: { ...form.contact, telegramUrl: v } })}
          />
          <Field
            label="Facebook Name"
            value={form.contact.facebook}
            onChange={(v) => setForm({ ...form, contact: { ...form.contact, facebook: v } })}
          />
          <Field
            label="Facebook URL"
            value={form.contact.facebookUrl}
            onChange={(v) => setForm({ ...form, contact: { ...form.contact, facebookUrl: v } })}
          />
          <Field
            label="CV Card Title"
            value={form.cvTitle}
            onChange={(v) => setForm({ ...form, cvTitle: v })}
          />
          <Field
            label="Footer CTA Headline"
            value={form.footerCtaHeadline}
            onChange={(v) => setForm({ ...form, footerCtaHeadline: v })}
          />
        </div>
        <TextAreaField
          label="CV Card Description"
          rows={2}
          value={form.cvDescription}
          onChange={(v) => setForm({ ...form, cvDescription: v })}
        />
        <TextAreaField
          label="Footer Bio"
          rows={2}
          value={form.footerBio}
          onChange={(v) => setForm({ ...form, footerBio: v })}
        />
      </section>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-mono text-zinc-400 uppercase">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none transition-colors"
      />
    </label>
  );
}

function TextAreaField({
  label,
  rows,
  value,
  onChange,
}: {
  label: string;
  rows: number;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-mono text-zinc-400 uppercase">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none transition-colors resize-y"
      />
    </label>
  );
}
