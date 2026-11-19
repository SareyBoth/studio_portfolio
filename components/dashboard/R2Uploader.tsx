'use client';

import React, { useRef, useState } from 'react';
import { Upload, FolderOpen, X, FileText, Film, Image as ImageIcon } from 'lucide-react';
import type { MediaAssetData, MediaFolder, MediaKind } from '@/types/portfolio';

interface R2UploaderProps {
  label: string;
  kind: MediaKind;
  folder: MediaFolder;
  currentUrl: string | null;
  currentAssetId: string | null;
  aspectHint?: string;
  onChange: (asset: { id: string; url: string } | null) => void;
}

const ACCEPT_BY_KIND: Record<MediaKind, string> = {
  image: 'image/jpeg,image/png,image/webp,image/avif',
  video: 'video/mp4,video/webm,video/quicktime',
  cv: 'application/pdf',
};

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith('image/')) return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export default function R2Uploader({
  label,
  kind,
  folder,
  currentUrl,
  aspectHint,
  onChange,
}: R2UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<MediaAssetData[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const handleFileSelected = async (file: File) => {
    setError(null);
    setProgress(5);

    try {
      const dims = await readImageDimensions(file);

      // 1. Request presigned PUT URL from Next.js server
      const presignRes = await fetch('/api/admin/media/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          kind,
          folder,
        }),
      });
      const presignJson = (await presignRes.json()) as {
        uploadUrl?: string;
        key?: string;
        error?: string;
      };
      if (!presignRes.ok || !presignJson.uploadUrl || !presignJson.key) {
        throw new Error(presignJson.error || 'Failed to prepare R2 upload.');
      }

      // 2. Direct browser PUT to Cloudflare R2 with real progress bar
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignJson.uploadUrl!);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.min(95, Math.round((evt.loaded / evt.total) * 90) + 5);
            setProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(
              new Error(
                `R2 upload failed (HTTP ${xhr.status}). Verify your R2 bucket CORS policy allows PUT from this origin.`
              )
            );
          }
        };

        xhr.onerror = () =>
          reject(
            new Error(
              'Network/CORS error uploading to Cloudflare R2. Check R2 CORS policy and R2 credentials.'
            )
          );

        xhr.send(file);
      });

      setProgress(98);

      // 3. Confirm object in R2 & record in PostgreSQL media_assets
      const confirmRes = await fetch('/api/admin/media/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: presignJson.key,
          kind,
          folder,
          originalFilename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          width: dims?.width ?? null,
          height: dims?.height ?? null,
        }),
      });
      const confirmJson = (await confirmRes.json()) as {
        asset?: MediaAssetData;
        error?: string;
      };
      if (!confirmRes.ok || !confirmJson.asset) {
        throw new Error(confirmJson.error || 'Failed to confirm uploaded asset.');
      }

      onChange({ id: confirmJson.asset.id, url: confirmJson.asset.url });
      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
      setProgress(null);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const openLibrary = async () => {
    setLibraryOpen(true);
    setLoadingLibrary(true);
    try {
      const res = await fetch(`/api/admin/media?kind=${kind}`);
      const json = (await res.json()) as { assets?: MediaAssetData[] };
      setLibraryAssets(json.assets ?? []);
    } catch {
      setLibraryAssets([]);
    } finally {
      setLoadingLibrary(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#0b0b0d] border border-white/10 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-mono font-bold text-white block">{label}</span>
          {aspectHint && (
            <span className="text-[10px] font-mono text-zinc-500">{aspectHint}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openLibrary}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-zinc-300 flex items-center gap-1.5 cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Library</span>
          </button>
          {currentUrl && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-[11px] font-mono text-red-300 flex items-center gap-1 cursor-pointer"
              title="Detach media"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      {currentUrl && (
        <div className="rounded-xl overflow-hidden border border-white/10 bg-[#14151a]">
          {kind === 'image' ? (
            <img
              src={currentUrl}
              alt={label}
              className="w-full max-h-48 object-contain bg-black/40"
            />
          ) : kind === 'video' ? (
            <video
              src={currentUrl}
              controls
              preload="metadata"
              className="w-full max-h-48 bg-black"
            />
          ) : (
            <div className="p-3 flex items-center justify-between text-xs font-mono">
              <span className="inline-flex items-center gap-2 text-zinc-200 truncate">
                <FileText className="w-4 h-4 text-[#d7ff3f] shrink-0" />
                <span className="truncate">{currentUrl.split('/').pop()}</span>
              </span>
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#d7ff3f] hover:underline shrink-0 ml-2"
              >
                Open PDF ↗
              </a>
            </div>
          )}
        </div>
      )}

      {/* Upload Dropzone */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_BY_KIND[kind]}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFileSelected(f);
        }}
        className="hidden"
      />

      <button
        type="button"
        disabled={progress !== null}
        onClick={() => inputRef.current?.click()}
        className="w-full py-3 px-4 rounded-xl border border-dashed border-white/20 hover:border-[#d7ff3f] bg-white/[0.02] hover:bg-white/[0.05] text-xs font-mono text-zinc-300 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
      >
        <Upload className="w-4 h-4 text-[#d7ff3f]" />
        <span>
          {progress !== null
            ? `Uploading to Cloudflare R2... ${progress}%`
            : currentUrl
              ? `Replace ${kind.toUpperCase()} on R2`
              : `Upload ${kind.toUpperCase()} to R2`}
        </span>
      </button>

      {progress !== null && (
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#d7ff3f] transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="text-[11px] font-mono text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Inline Media Library Picker */}
      {libraryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-[#14151a] border border-white/15 p-5 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <h3 className="text-sm font-mono font-bold text-white uppercase">
                Select {kind} from R2 Library
              </h3>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-mono text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            {loadingLibrary ? (
              <div className="py-12 text-center text-xs font-mono text-zinc-400">
                Loading R2 media library...
              </div>
            ) : libraryAssets.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-zinc-500">
                No {kind} assets uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1">
                {libraryAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      onChange({ id: asset.id, url: asset.url });
                      setLibraryOpen(false);
                    }}
                    className="rounded-xl bg-[#0b0b0d] border border-white/10 hover:border-[#d7ff3f] p-2 text-left transition-colors cursor-pointer flex flex-col gap-2"
                  >
                    {asset.kind === 'image' ? (
                      <img
                        src={asset.url}
                        alt={asset.originalFilename}
                        className="w-full h-24 object-cover rounded-lg bg-black"
                      />
                    ) : (
                      <div className="w-full h-24 rounded-lg bg-white/5 flex items-center justify-center text-[#d7ff3f]">
                        {asset.kind === 'video' ? (
                          <Film className="w-6 h-6" />
                        ) : asset.kind === 'cv' ? (
                          <FileText className="w-6 h-6" />
                        ) : (
                          <ImageIcon className="w-6 h-6" />
                        )}
                      </div>
                    )}
                    <span className="text-[11px] font-mono text-zinc-300 truncate block w-full">
                      {asset.originalFilename}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
