'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Copy, Trash2, FileText, Film, Check } from 'lucide-react';
import type { MediaAssetData, MediaFolder, MediaKind } from '@/types/portfolio';
import R2Uploader from './R2Uploader';
import ConfirmDialog from './ConfirmDialog';

interface MediaLibraryManagerProps {
  initialAssets: MediaAssetData[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function MediaLibraryManager({ initialAssets }: MediaLibraryManagerProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | MediaKind>('all');
  const [uploadKind, setUploadKind] = useState<MediaKind>('image');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const folderByKind: Record<MediaKind, MediaFolder> = {
    image: 'projects',
    video: 'videos',
    cv: 'cv',
  };

  const visible =
    filter === 'all' ? initialAssets : initialAssets.filter((a) => a.kind === filter);

  const copyUrl = async (asset: MediaAssetData) => {
    await navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const confirmDelete = async (asset: MediaAssetData) => {
    setDeleting(true);
    try {
      await fetch(`/api/admin/media/${asset.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-white/10 pb-6">
        <span className="text-[11px] font-mono font-bold text-[#d7ff3f] tracking-widest block mb-1">
          {'// CLOUDFLARE R2 BUCKET'}
        </span>
        <h1 className="text-3xl font-black tracking-tight text-white">R2 Media Library</h1>
        <p className="text-xs font-mono text-zinc-400 mt-1">
          All photos, videos, studio frame artworks, and CV PDFs stored on Cloudflare R2.
        </p>
      </div>

      {/* Quick Upload Panel */}
      <div className="rounded-2xl bg-[#14151a] border border-white/10 p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-mono font-bold text-white uppercase">
            Upload New Asset to R2
          </span>
          <div className="flex items-center gap-1.5">
            {(['image', 'video', 'cv'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setUploadKind(k)}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono uppercase cursor-pointer ${
                  uploadKind === k
                    ? 'bg-[#d7ff3f] text-black font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <R2Uploader
          label={`Direct R2 Upload (${uploadKind.toUpperCase()})`}
          kind={uploadKind}
          folder={folderByKind[uploadKind]}
          currentUrl={null}
          currentAssetId={null}
          onChange={() => router.refresh()}
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(['all', 'image', 'video', 'cv'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase cursor-pointer ${
              filter === k
                ? 'bg-[#d7ff3f] text-black font-bold'
                : 'bg-[#14151a] border border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl bg-[#14151a] border border-white/10 p-12 text-center font-mono text-xs text-zinc-500">
          No assets uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((asset) => (
            <div
              key={asset.id}
              className="rounded-2xl bg-[#14151a] border border-white/10 overflow-hidden flex flex-col justify-between"
            >
              <div className="h-44 bg-[#0b0b0d] flex items-center justify-center overflow-hidden relative">
                {asset.kind === 'image' ? (
                  <Image
                    src={asset.url}
                    alt={asset.originalFilename}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : asset.kind === 'video' ? (
                  <div className="flex flex-col items-center gap-2 text-[#d7ff3f]">
                    <Film className="w-8 h-8" />
                    <span className="text-[10px] font-mono text-zinc-400">VIDEO ASSET</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#d7ff3f]">
                    <FileText className="w-8 h-8" />
                    <span className="text-[10px] font-mono text-zinc-400">PDF DOCUMENT</span>
                  </div>
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono uppercase text-zinc-200">
                  {asset.folder}
                </span>
              </div>

              <div className="p-4 flex flex-col gap-3">
                <div>
                  <div className="text-xs font-bold text-white truncate">
                    {asset.originalFilename}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                    {formatBytes(asset.sizeBytes)}
                    {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ''}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => void copyUrl(asset)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/15 text-[11px] font-mono text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === asset.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#d7ff3f]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setDeleteTarget(asset)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                    aria-label={`Delete ${asset.originalFilename}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete R2 object permanently?"
        description={`"${deleteTarget?.originalFilename ?? ''}" will be deleted from Cloudflare R2 and detached from any frames, projects, or profile records using it.`}
        confirmLabel="Delete from R2"
        onConfirm={() => {
          if (deleteTarget) void confirmDelete(deleteTarget);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
