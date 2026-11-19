'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import type { ProjectAspect, ProjectCategory, ProjectData } from '@/types/portfolio';
import { deleteProjectAction, saveProjectAction } from '@/app/dashboard/actions';
import R2Uploader from './R2Uploader';
import ConfirmDialog from './ConfirmDialog';

interface ProjectsManagerProps {
  initialProjects: ProjectData[];
}

function emptyDraft(sortOrder: number): Omit<ProjectData, 'id'> & { id?: string } {
  return {
    slug: '',
    title: '',
    category: 'Poster',
    aspect: '4:5',
    subtitle: '',
    description: '',
    tools: [],
    year: String(new Date().getFullYear()),
    color: '#d7ff3f',
    featured: false,
    published: true,
    thumbnailAssetId: null,
    thumbnailUrl: null,
    videoAssetId: null,
    videoUrl: null,
    externalVideoUrl: null,
    sortOrder,
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

export default function ProjectsManager({ initialProjects }: ProjectsManagerProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'All' | ProjectCategory>('All');
  const [editing, setEditing] = useState<(Omit<ProjectData, 'id'> & { id?: string }) | null>(null);
  const [toolsText, setToolsText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ProjectData | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleProjects =
    filter === 'All'
      ? initialProjects
      : initialProjects.filter((p) => p.category === filter);

  const openNew = () => {
    const draft = emptyDraft(initialProjects.length);
    setEditing(draft);
    setToolsText('');
    setStatusMsg(null);
  };

  const openEdit = (p: ProjectData) => {
    setEditing({ ...p });
    setToolsText(p.tools.join(', '));
    setStatusMsg(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setStatusMsg(null);

    const tools = toolsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      const res = await saveProjectAction({
        id: editing.id,
        slug: editing.slug || slugify(editing.title),
        title: editing.title,
        category: editing.category,
        aspect: editing.aspect,
        subtitle: editing.subtitle,
        description: editing.description,
        tools,
        year: editing.year,
        color: editing.color,
        featured: editing.featured,
        published: editing.published,
        thumbnailAssetId: editing.thumbnailAssetId,
        videoAssetId: editing.videoAssetId,
        externalVideoUrl: editing.externalVideoUrl,
        sortOrder: editing.sortOrder,
      });

      if (res.ok) {
        setStatusMsg({ type: 'ok', text: res.message ?? 'Project saved.' });
        setEditing(null);
        router.refresh();
      } else {
        setStatusMsg({ type: 'err', text: res.error ?? 'Failed to save project.' });
      }
    });
  };

  const handleDelete = (project: ProjectData) => {
    startTransition(async () => {
      const res = await deleteProjectAction(project.id);
      setDeleteTarget(null);
      setStatusMsg(
        res.ok
          ? { type: 'ok', text: res.message ?? 'Deleted.' }
          : { type: 'err', text: res.error ?? 'Failed to delete.' }
      );
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[11px] font-mono font-bold text-[#d7ff3f] tracking-widest block mb-1">
            {'// POSTERS, VIDEOS & TECHNICAL WORKS'}
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white">Projects</h1>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-2.5 rounded-xl bg-[#d7ff3f] hover:brightness-110 text-black text-xs font-mono font-bold flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
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

      {/* Editor Panel */}
      {editing && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl bg-[#14151a] border border-[#d7ff3f]/40 p-6 flex flex-col gap-5"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-base font-black text-white">
              {editing.id ? `Edit: ${editing.title}` : 'Create New Project'}
            </h2>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer"
              aria-label="Close editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <R2Uploader
              label="Poster / Thumbnail Image (R2)"
              kind="image"
              folder="projects"
              currentUrl={editing.thumbnailUrl}
              currentAssetId={editing.thumbnailAssetId}
              aspectHint="Used for Poster artwork, Technical photo, or Video cover"
              onChange={(asset) =>
                setEditing({
                  ...editing,
                  thumbnailAssetId: asset?.id ?? null,
                  thumbnailUrl: asset?.url ?? null,
                })
              }
            />

            {editing.category === 'Video' && (
              <R2Uploader
                label="Direct R2 Video File (MP4 / WebM)"
                kind="video"
                folder="videos"
                currentUrl={editing.videoUrl}
                currentAssetId={editing.videoAssetId}
                aspectHint="Up to 250 MB — plays natively in HTML5 <video> player"
                onChange={(asset) =>
                  setEditing({
                    ...editing,
                    videoAssetId: asset?.id ?? null,
                    videoUrl: asset?.url ?? null,
                  })
                }
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Title *</span>
              <input
                type="text"
                required
                value={editing.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setEditing({
                    ...editing,
                    title,
                    slug: editing.id ? editing.slug : slugify(title),
                  });
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Slug *</span>
              <input
                type="text"
                required
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-xs font-mono text-white outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Year *</span>
              <input
                type="text"
                required
                value={editing.year}
                onChange={(e) => setEditing({ ...editing, year: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Category</span>
              <select
                value={editing.category}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value as ProjectCategory })
                }
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              >
                <option value="Poster">Poster</option>
                <option value="Video">Video</option>
                <option value="Technical">Technical</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Aspect Ratio</span>
              <select
                value={editing.aspect}
                onChange={(e) =>
                  setEditing({ ...editing, aspect: e.target.value as ProjectAspect })
                }
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              >
                <option value="4:5">4:5 (Poster)</option>
                <option value="9:16">9:16 (Vertical Reel)</option>
                <option value="16:9">16:9 (Widescreen)</option>
                <option value="16:10">16:10 (Technical)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Accent Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editing.color}
                  onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                  className="w-10 h-10 rounded-lg bg-transparent border border-white/15 cursor-pointer"
                />
                <input
                  type="text"
                  value={editing.color}
                  onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#0b0b0d] border border-white/10 text-xs font-mono text-white outline-none"
                />
              </div>
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
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Subtitle *</span>
            <input
              type="text"
              required
              value={editing.subtitle}
              onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Description *</span>
            <textarea
              rows={3}
              required
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none resize-y"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">
                Tools (comma-separated)
              </span>
              <input
                type="text"
                value={toolsText}
                onChange={(e) => setToolsText(e.target.value)}
                placeholder="Adobe Photoshop, Premiere Pro"
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
              />
            </label>

            {editing.category === 'Video' && (
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">
                  External Embed URL (Optional YouTube/Vimeo Fallback)
                </span>
                <input
                  type="url"
                  value={editing.externalVideoUrl ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, externalVideoUrl: e.target.value || null })
                  }
                  placeholder="https://www.youtube-nocookie.com/embed/..."
                  className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 text-sm text-white outline-none"
                />
              </label>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-mono text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.published}
                  onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                  className="accent-[#d7ff3f]"
                />
                <span>Published</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-mono text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                  className="accent-[#d7ff3f]"
                />
                <span>Featured</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
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
                <span>{isPending ? 'Saving...' : 'Save Project'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {(['All', 'Poster', 'Video', 'Technical'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-colors ${
              filter === cat
                ? 'bg-[#d7ff3f] text-black font-bold'
                : 'bg-[#14151a] text-zinc-400 border border-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Projects Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleProjects.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl bg-[#14151a] border border-white/10 p-4 flex gap-4 items-start"
          >
            <div className="w-20 h-20 rounded-xl bg-[#0b0b0d] border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
              {project.thumbnailUrl ? (
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className="text-xs font-mono font-bold"
                  style={{ color: project.color }}
                >
                  {project.aspect}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-200">
                  {project.category}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">{project.year}</span>
                {!project.published && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    DRAFT
                  </span>
                )}
                {project.videoUrl && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    R2 VIDEO
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white truncate">{project.title}</h3>
              <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{project.subtitle}</p>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => openEdit(project)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white cursor-pointer"
                aria-label={`Edit ${project.title}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(project)}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                aria-label={`Delete ${project.title}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this project?"
        description={`"${deleteTarget?.title ?? ''}" will be removed from PostgreSQL and immediately purged from the public portfolio cache.`}
        confirmLabel="Delete Project"
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
