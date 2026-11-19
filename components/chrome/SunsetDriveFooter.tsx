'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { ProfileData } from '@/types/portfolio';

interface SunsetDriveFooterProps {
  profile: ProfileData;
  onNavigateTo: (sectionId: string) => void;
  onOpenContactBrief?: () => void;
}

export default function SunsetDriveFooter({
  profile,
  onNavigateTo,
  onOpenContactBrief,
}: SunsetDriveFooterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = canvas.clientWidth || 1000;
    let height = canvas.clientHeight || 450;

    const resize = () => {
      width = canvas.clientWidth || 1000;
      height = canvas.clientHeight || 450;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Starfield
    const stars: { x: number; y: number; r: number; alpha: number }[] = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.45,
        r: 0.6 + Math.random() * 1.4,
        alpha: 0.3 + Math.random() * 0.7,
      });
    }

    let animId: number;
    let offset = 0;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const horizonY = height * 0.46;
      const vpX = width / 2;

      if (!prefersReducedMotion) {
        offset = (time * 0.0006) % 1.0;
      }

      // 1. Sky Gradient (Deep Indigo to warm dusky magenta)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#07080f');
      skyGrad.addColorStop(0.6, '#180e22');
      skyGrad.addColorStop(0.9, '#3b162f');
      skyGrad.addColorStop(1, '#662235');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY);

      // Stars
      stars.forEach((s, idx) => {
        const twinkle = prefersReducedMotion ? 1 : Math.sin(time * 0.003 + idx) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * twinkle * 0.8})`;
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Slatted Retro Sunset Sun
      const sunR = Math.min(width * 0.16, 90);
      const sunY = horizonY - 15;
      const sunGrad = ctx.createLinearGradient(vpX, sunY - sunR, vpX, sunY + sunR);
      sunGrad.addColorStop(0, '#ffd15c');
      sunGrad.addColorStop(0.4, '#ff6b12');
      sunGrad.addColorStop(1, '#db2777');

      ctx.save();
      ctx.beginPath();
      ctx.arc(vpX, sunY, sunR, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = sunGrad;
      ctx.fillRect(vpX - sunR, sunY - sunR, sunR * 2, sunR * 2);

      // Horizontal slats cut through lower half of sun
      ctx.fillStyle = '#180e22';
      const slatCount = 7;
      for (let sl = 0; sl < slatCount; sl++) {
        const progress = sl / slatCount;
        const slatThickness = 1.5 + progress * 4.5;
        const sy = sunY + progress * (sunR * 0.95);
        ctx.fillRect(vpX - sunR, sy, sunR * 2, slatThickness);
      }
      ctx.restore();

      // 3. Mountain Silhouette on Horizon
      ctx.fillStyle = '#0a0b12';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      const mPoints = [
        [0, horizonY],
        [width * 0.15, horizonY - 24],
        [width * 0.28, horizonY - 10],
        [width * 0.38, horizonY - 32],
        [width * 0.48, horizonY - 14],
        [width * 0.62, horizonY - 38],
        [width * 0.75, horizonY - 18],
        [width * 0.88, horizonY - 28],
        [width, horizonY],
      ];
      mPoints.forEach(([px, py]) => ctx.lineTo(px, py));
      ctx.lineTo(width, horizonY);
      ctx.closePath();
      ctx.fill();

      // Horizon atmospheric glow line
      ctx.strokeStyle = 'rgba(255, 107, 18, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.stroke();

      // 4. Ground & Perspective Highway
      // Ground plane
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      groundGrad.addColorStop(0, '#0c0d16');
      groundGrad.addColorStop(1, '#06070a');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Road geometry (trapezoid)
      const roadTopW = width * 0.08;
      const roadBottomW = width * 0.82;

      const pTL = { x: vpX - roadTopW / 2, y: horizonY };
      const pTR = { x: vpX + roadTopW / 2, y: horizonY };
      const pBR = { x: vpX + roadBottomW / 2, y: height };
      const pBL = { x: vpX - roadBottomW / 2, y: height };

      // Road asphalt
      ctx.fillStyle = '#10111a';
      ctx.beginPath();
      ctx.moveTo(pTL.x, pTL.y);
      ctx.lineTo(pTR.x, pTR.y);
      ctx.lineTo(pBR.x, pBR.y);
      ctx.lineTo(pBL.x, pBL.y);
      ctx.closePath();
      ctx.fill();

      // Road outer border lines
      ctx.strokeStyle = '#2549ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pTL.x, pTL.y);
      ctx.lineTo(pBL.x, pBL.y);
      ctx.moveTo(pTR.x, pTR.y);
      ctx.lineTo(pBR.x, pBR.y);
      ctx.stroke();

      // Lateral perspective grid lines on the road
      const gridSteps = 16;
      ctx.strokeStyle = 'rgba(37, 73, 255, 0.25)';
      ctx.lineWidth = 1;

      for (let g = 0; g < gridSteps; g++) {
        const frac = (g / gridSteps + offset) % 1.0;
        // Non-linear projection to simulate distance
        const pFrac = Math.pow(frac, 2.5);
        const y = horizonY + pFrac * (height - horizonY);
        const curW = roadTopW + pFrac * (roadBottomW - roadTopW);

        ctx.beginPath();
        ctx.moveTo(vpX - curW / 2, y);
        ctx.lineTo(vpX + curW / 2, y);
        ctx.stroke();
      }

      // Moving Dashed Center Line
      ctx.fillStyle = '#d7ff3f';
      const dashSteps = 12;
      for (let d = 0; d < dashSteps; d++) {
        const frac1 = (d / dashSteps + offset) % 1.0;
        const frac2 = ((d + 0.45) / dashSteps + offset) % 1.0;

        if (frac2 > frac1) {
          const y1 = horizonY + Math.pow(frac1, 2.5) * (height - horizonY);
          const y2 = horizonY + Math.pow(frac2, 2.5) * (height - horizonY);
          const wCenter = 1.5 + Math.pow(frac2, 2.0) * 8;

          ctx.fillRect(vpX - wCenter / 2, y1, wCenter, y2 - y1);
        }
      }

      // 5. Overhead highway gantries / streetlights
      const postSteps = 4;
      for (let p = 0; p < postSteps; p++) {
        const frac = (p / postSteps + offset * 0.5) % 1.0;
        const pFrac = Math.pow(frac, 2.2);
        if (pFrac > 0.08) {
          const py = horizonY + pFrac * (height - horizonY);
          const curW = roadTopW + pFrac * (roadBottomW - roadTopW);
          const poleH = pFrac * 65;

          // Left streetlight pole & light cone
          const lx = vpX - curW / 2 - 12 * pFrac;
          ctx.strokeStyle = '#4a5068';
          ctx.lineWidth = Math.max(1, pFrac * 3);
          ctx.beginPath();
          ctx.moveTo(lx, py);
          ctx.lineTo(lx, py - poleH);
          ctx.lineTo(lx + 15 * pFrac, py - poleH);
          ctx.stroke();

          // Amber lamp fixture
          ctx.fillStyle = '#ff6b12';
          ctx.beginPath();
          ctx.arc(lx + 15 * pFrac, py - poleH, 2.5 * pFrac, 0, Math.PI * 2);
          ctx.fill();

          // Soft light cone on the ground
          ctx.fillStyle = 'rgba(255, 107, 18, 0.06)';
          ctx.beginPath();
          ctx.moveTo(lx + 15 * pFrac, py - poleH);
          ctx.lineTo(lx - 20 * pFrac, py + 10 * pFrac);
          ctx.lineTo(lx + 40 * pFrac, py + 10 * pFrac);
          ctx.closePath();
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isVisible]);

  return (
    <footer
      ref={containerRef}
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 mb-12 select-none"
    >
      {/* Outer Floating Glass Card */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0c0d14]/90 border border-white/15 shadow-2xl backdrop-blur-2xl">
        {/* Retro 2D Highway Canvas Background */}
        <div className="relative w-full h-[320px] sm:h-[400px] overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block"
          />

          {/* Vignette fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d14] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0d14]/80 via-transparent to-[#0c0d14]/80" />

          {/* Floating CTA Overlay in Canvas Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <span className="text-[11px] font-mono tracking-widest text-[#d7ff3f] uppercase mb-2">
              {"// LET'S COLLABORATE"}
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 max-w-xl">
              {profile.footerCtaHeadline}
            </h2>

            <button
              onClick={() => {
                onNavigateTo('contact');
                if (onOpenContactBrief) onOpenContactBrief();
              }}
              className="ember-keycap px-8 py-4 rounded-xl text-xs sm:text-sm font-mono font-bold text-white flex items-center gap-3 cursor-pointer group"
            >
              <span className="w-2 h-2 rounded-full bg-[#ff6b12] pulse-dot" />
              <span>SEND A PROJECT BRIEF</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
          </div>
        </div>

        {/* Foreground Content Card & Nav Links */}
        <div className="p-8 sm:p-12 border-t border-white/10 bg-[#0c0d14]">
          {/* Top metadata row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Monumental Wordmark & Bio */}
            <div className="md:col-span-2">
              <div className="text-3xl sm:text-5xl font-black text-white tracking-tighter mb-3 font-mono">
                {(profile.name.trim().replace(/\s+/g, '').toUpperCase() || 'SAREYBOTH')}
                <span className="text-[#d7ff3f]">.26</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm leading-relaxed mb-4">
                {profile.footerBio}
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-[#d7ff3f]">
                <span className="w-2 h-2 rounded-full bg-[#d7ff3f]" />
                <span>{profile.availability}</span>
              </div>
            </div>

            {/* Quick Navigation */}
            <div>
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-4">
                Directory
              </span>
              <ul className="flex flex-col gap-2 text-xs font-mono">
                {['projects', 'about', 'skills', 'experience', 'contact'].map(
                  (sec) => (
                    <li key={sec}>
                      <button
                        onClick={() => onNavigateTo(sec)}
                        className="text-zinc-400 hover:text-[#d7ff3f] transition-colors capitalize cursor-pointer"
                      >
                        {sec}
                      </button>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Social & Contact Direct Links */}
            <div>
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-4">
                Connect
              </span>
              <ul className="flex flex-col gap-2.5 text-xs font-mono">
                <li>
                  <a
                    href={`mailto:${profile.contact.email}`}
                    className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>Email:</span>
                    <span className="text-white truncate">
                      {profile.contact.email}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href={profile.contact.telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-400 hover:text-[#06b6d4] transition-colors flex items-center gap-2"
                  >
                    <span>Telegram:</span>
                    <span className="text-white">{profile.contact.telegram}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${profile.contact.phone.replace(/\s+/g, '')}`}
                    className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>Phone:</span>
                    <span className="text-white">{profile.contact.phone}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={profile.contact.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-400 hover:text-[#2549ff] transition-colors flex items-center gap-2"
                  >
                    <span>Facebook:</span>
                    <span className="text-white">{profile.contact.facebook}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Timestamp */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
            <div>
              © {new Date().getFullYear()} {profile.name} · {profile.location}
            </div>
            <div className="flex items-center gap-4">
              <span>Next.js 16 · Three.js r187</span>
              <span>•</span>
              <span>All rights reserved</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
