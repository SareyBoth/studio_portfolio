'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  RotateCcw,
  RotateCw,
  Loader2,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { buildInternalStreamPath, extractR2KeyFromUrl } from '@/lib/video-stream';

interface VideoStreamPlayerProps {
  src: string;
  poster?: string | null;
  title?: string;
  accentColor?: string;
  autoPlay?: boolean;
  compact?: boolean;
  className?: string;
}

function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const totalSec = Math.floor(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * In-Browser Cloudflare R2 Video Streaming Player:
 * - Supports HTTP 206 Partial Content byte-range seeking and buffered chunk visualization
 * - Automatically falls back to the built-in `/api/media/stream/<key>` byte-range proxy if
 *   direct R2 public CDN playback fails (e.g. private bucket or missing R2 CORS headers)
 * - Includes play/pause, +/-10s seek, buffered range bar, volume slider, playback rate (0.5x..2x),
 *   Picture-in-Picture, fullscreen, and resolution badge.
 */
export default function VideoStreamPlayer({
  src,
  poster,
  title,
  accentColor = '#d7ff3f',
  autoPlay = false,
  compact = false,
  className = '',
}: VideoStreamPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const r2Key = extractR2KeyFromUrl(src);
  const fallbackStreamUrl = r2Key ? buildInternalStreamPath(r2Key) : null;

  const [proxyFallbackForSrc, setProxyFallbackForSrc] = useState<string | null>(null);
  const usingProxyStream =
    src.startsWith('/api/media/stream/') ||
    (Boolean(fallbackStreamUrl) && proxyFallbackForSrc === src);
  const activeSrc = usingProxyStream && fallbackStreamUrl ? fallbackStreamUrl : src;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resolutionLabel, setResolutionLabel] = useState<string | null>(null);
  const [errorForSrc, setErrorForSrc] = useState<{ src: string; message: string } | null>(null);
  const streamError = errorForSrc?.src === activeSrc ? errorForSrc.message : null;

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const syncBufferedRange = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.buffered.length === 0) return;
    const end = v.buffered.end(v.buffered.length - 1);
    setBufferedEnd(end);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) {
      void v.play().catch(() => {
        // Ignore play interruption
      });
    } else {
      v.pause();
    }
  }, []);

  const seekBy = useCallback((deltaSeconds: number) => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + deltaSeconds));
  }, []);

  const handleSeekInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const nextTime = Number(e.target.value);
    v.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const handleVolumeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const nextVol = Number(e.target.value);
    v.volume = nextVol;
    v.muted = nextVol === 0;
    setVolume(nextVol);
    setIsMuted(v.muted);
  };

  const cyclePlaybackRate = () => {
    const v = videoRef.current;
    if (!v) return;
    const rates = [0.5, 1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length] ?? 1;
    v.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const togglePip = async () => {
    const v = videoRef.current;
    if (!v || !('pictureInPictureEnabled' in document)) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await v.requestPictureInPicture();
      }
    } catch {
      // Ignore PiP unsupported
    }
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen blocked
    }
  };

  const handleVideoError = () => {
    // Automatic fallback from direct R2 public URL to our Next.js 206 byte-range R2 stream endpoint
    if (fallbackStreamUrl && activeSrc !== fallbackStreamUrl) {
      setProxyFallbackForSrc(src);
      setErrorForSrc(null);
      setIsBuffering(true);
      return;
    }
    setIsBuffering(false);
    setErrorForSrc({
      src: activeSrc,
      message: 'Unable to stream video from Cloudflare R2. Verify the object exists in R2.',
    });
  };

  const playProgressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const bufferedPct = duration > 0 ? Math.min(100, (bufferedEnd / duration) * 100) : 0;

  return (
    <div
      ref={containerRef}
      className={`group relative w-full overflow-hidden rounded-xl bg-black border border-white/10 select-none flex flex-col justify-between ${className}`}
    >
      {/* Top Streaming Status Badge */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-mono text-zinc-200">
          <Radio className="w-3 h-3 text-[#d7ff3f] animate-pulse" />
          <span>{usingProxyStream ? 'R2 BYTE-RANGE STREAM (206)' : 'R2 CDN STREAM'}</span>
          {resolutionLabel && (
            <>
              <span className="text-white/30">·</span>
              <span className="text-[#d7ff3f] font-bold">{resolutionLabel}</span>
            </>
          )}
        </div>

        {!compact && fallbackStreamUrl && !usingProxyStream && (
          <button
            type="button"
            onClick={() => {
              setProxyFallbackForSrc(src);
            }}
            className="pointer-events-auto px-2.5 py-1 rounded-full bg-black/75 hover:bg-black text-[10px] font-mono text-zinc-300 hover:text-[#d7ff3f] border border-white/15 cursor-pointer transition-colors"
            title="Switch to server 206 byte-range proxy stream"
          >
            Use 206 Proxy Stream
          </button>
        )}
      </div>

      {/* Core HTML5 Video Element */}
      <video
        ref={videoRef}
        key={activeSrc}
        src={activeSrc}
        poster={poster ?? undefined}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        onClick={togglePlay}
        onDoubleClick={() => void toggleFullscreen()}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setDuration(v.duration || 0);
          setIsBuffering(false);
          if (v.videoHeight >= 2160) setResolutionLabel('4K');
          else if (v.videoHeight >= 1440) setResolutionLabel('1440P');
          else if (v.videoHeight >= 1080) setResolutionLabel('1080P');
          else if (v.videoHeight >= 720) setResolutionLabel('720P');
          else if (v.videoHeight > 0) setResolutionLabel(`${v.videoHeight}P`);
          syncBufferedRange();
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
          syncBufferedRange();
        }}
        onProgress={syncBufferedRange}
        onPlay={() => {
          setIsPlaying(true);
          setIsBuffering(false);
        }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPlaying={() => setIsBuffering(false)}
        onError={handleVideoError}
        aria-label={title || 'Cloudflare R2 video stream'}
        className={`w-full bg-black object-contain cursor-pointer ${
          compact ? 'max-h-48 min-h-[160px]' : 'w-full h-full max-h-[62vh] min-h-[260px]'
        }`}
      />

      {/* Center Play / Buffering / Error Overlay */}
      {streamError ? (
        <div className="absolute inset-0 z-20 bg-black/85 flex flex-col items-center justify-center p-6 text-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-xs font-mono text-red-300 max-w-md">{streamError}</p>
        </div>
      ) : isBuffering ? (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-black/25">
          <div className="px-3.5 py-2 rounded-full bg-black/80 border border-white/15 flex items-center gap-2 text-xs font-mono text-white">
            <Loader2 className="w-4 h-4 text-[#d7ff3f] animate-spin" />
            <span>BUFFERING STREAM...</span>
          </div>
        </div>
      ) : !isPlaying ? (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play video stream"
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors cursor-pointer"
        >
          <span
            className="w-14 h-14 rounded-full flex items-center justify-center text-black shadow-2xl transition-transform group-hover:scale-105"
            style={{ backgroundColor: accentColor }}
          >
            <Play className="w-6 h-6 ml-0.5 fill-current" />
          </span>
        </button>
      ) : null}

      {/* Bottom Studio Control Bar */}
      <div className="relative z-20 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-3.5 pt-4 pb-3 flex flex-col gap-2">
        {/* Byte-Range Buffered + Played Scrub Timeline */}
        <div className="relative w-full h-2 flex items-center">
          <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden relative">
            {/* Buffered range bar */}
            <div
              className="absolute inset-y-0 left-0 bg-white/30 transition-all duration-150"
              style={{ width: `${bufferedPct}%` }}
            />
            {/* Played progress bar */}
            <div
              className="absolute inset-y-0 left-0 transition-all duration-75"
              style={{ width: `${playProgressPct}%`, backgroundColor: accentColor }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekInput}
            aria-label="Seek video timeline"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-2 text-xs font-mono text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {!compact && (
              <>
                <button
                  type="button"
                  onClick={() => seekBy(-10)}
                  title="Rewind 10s"
                  aria-label="Rewind 10 seconds"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => seekBy(10)}
                  title="Forward 10s"
                  aria-label="Forward 10 seconds"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              {!compact && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeInput}
                  aria-label="Volume"
                  className="w-16 accent-[#d7ff3f] cursor-pointer hidden sm:block"
                />
              )}
            </div>

            <span className="text-[11px] text-zinc-300 pl-1">
              {formatTimecode(currentTime)}{' '}
              <span className="text-zinc-500">/ {formatTimecode(duration)}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={cyclePlaybackRate}
              title="Playback Speed"
              className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold text-[#d7ff3f] cursor-pointer"
            >
              {playbackRate}×
            </button>

            {!compact && (
              <button
                type="button"
                onClick={() => void togglePip()}
                title="Picture in Picture"
                aria-label="Picture in Picture"
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer hidden sm:inline-flex"
              >
                <PictureInPicture2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              title="Toggle Fullscreen"
              aria-label="Toggle Fullscreen"
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize className="w-3.5 h-3.5" />
              ) : (
                <Maximize className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
