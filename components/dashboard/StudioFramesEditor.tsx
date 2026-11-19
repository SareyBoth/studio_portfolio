'use client';

import React, { useState, useTransition } from 'react';
import { Save } from 'lucide-react';
import type { StudioFrameData } from '@/types/portfolio';
import { updateStudioFrameAction } from '@/app/dashboard/actions';
import R2Uploader from './R2Uploader';

interface StudioFramesEditorProps {
  initialFrames: StudioFrameData[];
}

export default function StudioFramesEditor({ initialFrames }: StudioFramesEditorProps) {
  const [frames, setFrames] = useState<StudioFrameData[]>(initialFrames);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const current = frames[activeSlot];

  const updateCurrent = (patch: Partial<StudioFrameData>) => {
    setFrames((prev) =>
      prev.map((f, idx) => (idx === activeSlot ? { ...f, ...patch } : f))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    startTransition(async () => {
      const res = await updateStudioFrameAction({
        slotIndex: current.slotIndex,
        title: current.title,
        subtitle: current.subtitle,
        category: current.category,
        description: current.description,
        accentColor: current.accentColor,
        primaryMetric: current.primaryMetric,
        tags: current.tags,
        imageAssetId: current.imageAssetId,
      });
      setStatusMsg(
        res.ok
          ? { type: 'ok', text: res.message ?? 'Frame saved!' }
          : { type: 'err', text: res.error ?? 'Failed to save frame.' }
      );
    });
  };

  const leftWallFrames = frames.slice(0, 3);
  const backWallFrames = frames.slice(3, 6);

  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-white/10 pb-6">
        <span className="text-[11px] font-mono font-bold text-[#d7ff3f] tracking-widest block mb-1">
          {'// 3D STUDIO GALLERY WALLS'}
        </span>
        <h1 className="text-3xl font-black tracking-tight text-white">
          6 Studio Image Frames
        </h1>
        <p className="text-xs font-mono text-zinc-400 mt-1">
          Left Wall: 3 vertical <strong className="text-[#d7ff3f]">9:16</strong> portrait frames · Back Wall: 3 horizontal <strong className="text-[#06b6d4]">16:9</strong> landscape frames. Images are center-cropped cleanly onto the 3D wall meshes.
        </p>
      </div>

      {/* Visual Two-Wall Slot Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Wall (3 x 9:16) */}
        <div className="rounded-2xl bg-[#14151a] border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-white uppercase">
              Left Wall (Acoustic Slats)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d7ff3f]/15 text-[#d7ff3f] font-bold">
              3 × 9:16 PORTRAIT
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {leftWallFrames.map((f) => {
              const selected = activeSlot === f.slotIndex;
              return (
                <button
                  key={f.slotIndex}
                  type="button"
                  onClick={() => {
                    setActiveSlot(f.slotIndex);
                    setStatusMsg(null);
                  }}
                  className={`group rounded-xl overflow-hidden border-2 transition-all text-left cursor-pointer ${
                    selected
                      ? 'border-[#d7ff3f] ring-2 ring-[#d7ff3f]/30'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="aspect-[9/16] bg-[#0b0b0d] relative flex items-center justify-center overflow-hidden">
                    {f.imageUrl ? (
                      <img
                        src={f.imageUrl}
                        alt={f.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-500 text-center px-2">
                        Procedural
                        <br />
                        9:16
                      </span>
                    )}
                    <span
                      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/75"
                      style={{ color: f.accentColor }}
                    >
                      0{f.slotIndex + 1}
                    </span>
                  </div>
                  <div className="p-2 bg-[#0e1015] text-[10px] font-mono text-zinc-300 truncate">
                    {f.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Back Wall (3 x 16:9) */}
        <div className="rounded-2xl bg-[#14151a] border border-white/10 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold text-white uppercase">
                Back Wall (Under Bookshelf)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#06b6d4]/15 text-[#06b6d4] font-bold">
                3 × 16:9 LANDSCAPE
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {backWallFrames.map((f) => {
                const selected = activeSlot === f.slotIndex;
                return (
                  <button
                    key={f.slotIndex}
                    type="button"
                    onClick={() => {
                      setActiveSlot(f.slotIndex);
                      setStatusMsg(null);
                    }}
                    className={`group rounded-xl overflow-hidden border-2 transition-all text-left cursor-pointer ${
                      selected
                        ? 'border-[#06b6d4] ring-2 ring-[#06b6d4]/30'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="aspect-[16/9] bg-[#0b0b0d] relative flex items-center justify-center overflow-hidden">
                      {f.imageUrl ? (
                        <img
                          src={f.imageUrl}
                          alt={f.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-500 text-center px-1">
                          Procedural 16:9
                        </span>
                      )}
                      <span
                        className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/75"
                        style={{ color: f.accentColor }}
                      >
                        0{f.slotIndex + 1}
                      </span>
                    </div>
                    <div className="p-2 bg-[#0e1015] text-[10px] font-mono text-zinc-300 truncate">
                      {f.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#0b0b0d] border border-white/10 text-[11px] font-mono text-zinc-400">
            Click any slot above to upload its Cloudflare R2 image, customize its LED glow color, and edit its 3D inspection card.
          </div>
        </div>
      </div>

      {/* Selected Frame Editor */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl bg-[#14151a] border border-white/10 p-6 flex flex-col gap-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: current.accentColor }}
            />
            <h2 className="text-lg font-black text-white">
              Editing Slot {current.index} —{' '}
              <span className="font-mono text-xs text-zinc-400 uppercase">
                {current.wall} wall · {current.aspectRatio}
              </span>
            </h2>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl bg-[#d7ff3f] hover:brightness-110 text-black text-xs font-mono font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isPending ? 'Saving...' : 'Save Frame'}</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <R2Uploader
              label={`Frame Artwork (${current.aspectRatio})`}
              kind="image"
              folder="frames"
              currentUrl={current.imageUrl}
              currentAssetId={current.imageAssetId}
              aspectHint={
                current.aspectRatio === '9:16'
                  ? 'Best at 1080×1920 (9:16 vertical). Auto center-cropped.'
                  : 'Best at 1920×1080 (16:9 widescreen). Auto center-cropped.'
              }
              onChange={(asset) =>
                updateCurrent({
                  imageAssetId: asset?.id ?? null,
                  imageUrl: asset?.url ?? null,
                })
              }
            />
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">Title</span>
                <input
                  type="text"
                  required
                  value={current.title}
                  onChange={(e) => updateCurrent({ title: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">Subtitle</span>
                <input
                  type="text"
                  required
                  value={current.subtitle}
                  onChange={(e) => updateCurrent({ subtitle: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">Category</span>
                <input
                  type="text"
                  required
                  value={current.category}
                  onChange={(e) => updateCurrent({ category: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">Primary Metric</span>
                <input
                  type="text"
                  required
                  value={current.primaryMetric}
                  onChange={(e) => updateCurrent({ primaryMetric: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Description</span>
              <textarea
                rows={3}
                required
                value={current.description}
                onChange={(e) => updateCurrent({ description: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none resize-y"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">
                  Tags (comma-separated)
                </span>
                <input
                  type="text"
                  value={current.tags.join(', ')}
                  onChange={(e) =>
                    updateCurrent({
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  className="px-3.5 py-2.5 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">
                  LED Glow Color
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={current.accentColor}
                    onChange={(e) => updateCurrent({ accentColor: e.target.value })}
                    className="w-10 h-10 rounded-lg bg-transparent border border-white/15 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={current.accentColor}
                    onChange={(e) => updateCurrent({ accentColor: e.target.value })}
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#0b0b0d] border border-white/10 text-xs font-mono text-white outline-none"
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
