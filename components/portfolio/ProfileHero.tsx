'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { ProfileData } from '@/types/portfolio';

interface ProfileHeroProps {
  profile: ProfileData;
  onNavigateTo: (sectionId: string) => void;
  onOpenCvModal: () => void;
}

export default function ProfileHero({
  profile,
  onNavigateTo,
  onOpenCvModal,
}: ProfileHeroProps) {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const roles = useMemo(
    () => (profile.rolesCycling.length > 0 ? profile.rolesCycling : ['Designer.']),
    [profile.rolesCycling]
  );

  useEffect(() => {
    const currentFullRole = roles[roleIndex % roles.length] ?? '';
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (displayedText.length < currentFullRole.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentFullRole.slice(0, displayedText.length + 1));
        }, 75);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else if (displayedText.length > 0) {
      timeout = setTimeout(() => {
        setDisplayedText(displayedText.slice(0, -1));
      }, 40);
    } else {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setRoleIndex((prev) => (prev + 1) % roles.length);
      }, 40);
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, roleIndex, roles]);

  const initial = (profile.name.trim()[0] || 'R').toUpperCase();

  return (
    <section id="top" className="relative w-full pt-16 sm:pt-24 pb-16">
      {/* Top Metadata Bar */}
      <div className="flex items-center justify-between py-3 border-b border-[var(--line)] text-xs font-mono text-[var(--on-surface-dim)] mb-12 sm:mb-16">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)]" />
          <span>{profile.location.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2 h-2 rounded-full pulse-dot ${
              profile.isAvailable ? 'bg-[var(--acid)]' : 'bg-[var(--amber)]'
            }`}
          />
          <span className="text-[var(--on-surface)] font-medium uppercase">
            {profile.availability}
          </span>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mb-16">
        {/* Left Column: Typography & Bio */}
        <div className="lg:col-span-7 flex flex-col items-start">
          <div
            data-ps
            className="text-xs sm:text-sm font-mono tracking-widest text-[var(--acid)] font-bold mb-4 uppercase"
          >
            {/* */}
            {'// '}
            {profile.kicker}
          </div>

          <h1
            data-ps
            className="text-5xl sm:text-7xl lg:text-8xl font-black text-[var(--on-surface)] tracking-[-0.08em] leading-[0.82] mb-6"
          >
            {profile.headline}
          </h1>

          {/* Cycling Role Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--line-highlight)] text-xs sm:text-sm font-mono mb-6">
            <span className="text-[var(--acid)] font-bold">&gt;</span>
            <span className="text-[var(--on-surface)] font-bold">{displayedText}</span>
            <span className="w-2 h-4 bg-[var(--acid)] blinking-cursor inline-block" />
          </div>

          {/* Bio Description */}
          <p className="text-base sm:text-lg text-[var(--on-surface-dim)] leading-relaxed max-w-xl mb-8">
            {profile.subhead}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigateTo('projects')}
              className="px-6 py-3 rounded-full bg-[var(--acid)] text-black font-mono font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[var(--acid)]/10"
            >
              <span>SEE PROJECTS</span>
              <span>↓</span>
            </button>

            <button
              type="button"
              onClick={onOpenCvModal}
              className="px-6 py-3 rounded-full bg-[var(--surface-raised)] hover:bg-[var(--surface-card)] text-[var(--on-surface)] border border-[var(--line-highlight)] font-mono font-bold text-xs sm:text-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>DOWNLOAD CV (PDF)</span>
              <span>↗</span>
            </button>
          </div>
        </div>

        {/* Right Column: Editorial Portrait Frame with Acid-Lime Offset Backing */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[360px] aspect-[4/5]">
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-[var(--acid)] transition-transform" />

            <div className="relative w-full h-full rounded-2xl bg-[#12141c] border-2 border-[var(--cobalt)] overflow-hidden p-5 flex flex-col justify-between shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono font-bold text-[var(--acid)]">
                  01 / PROFILE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--cobalt)] text-white font-bold truncate max-w-[170px]">
                  {profile.role}
                </span>
              </div>

              {/* Center Portrait Photo (from R2) or Stylized Monogram Fallback */}
              <div className="relative w-full flex-1 my-4 rounded-xl bg-[#181a24] border border-white/10 flex flex-col items-center justify-center overflow-hidden">
                {profile.portraitUrl ? (
                  <Image
                    src={profile.portraitUrl}
                    alt={`${profile.name} portrait`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute w-44 h-44 rounded-full border border-dashed border-[var(--acid)]/25 animate-spin duration-1000" />
                    <div className="absolute w-32 h-32 rounded-full border border-white/10" />
                    <div className="relative text-7xl sm:text-8xl font-black font-sans text-[var(--acid)] select-none">
                      {initial}
                    </div>
                    <div className="absolute bottom-3 text-[10px] font-mono text-zinc-400 tracking-wider">
                      {profile.locationShort}
                    </div>
                  </>
                )}
              </div>

              <div>
                <div className="text-base font-bold text-white tracking-tight">
                  {profile.name}
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mt-1">
                  <span className="truncate pr-2">{profile.location}</span>
                  <span
                    className={
                      profile.isAvailable ? 'text-[var(--acid)] shrink-0' : 'text-[var(--amber)] shrink-0'
                    }
                  >
                    {profile.isAvailable ? 'Active Status' : 'Booked'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div data-line className="rule-horizontal mb-12" />
    </section>
  );
}
