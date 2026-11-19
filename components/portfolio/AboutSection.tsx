'use client';

import React from 'react';
import type { ProfileData } from '@/types/portfolio';

interface AboutSectionProps {
  profile: ProfileData;
}

export default function AboutSection({ profile }: AboutSectionProps) {
  const visiblePillars = profile.disciplines.filter((d) => d.visible !== false);

  return (
    <section
      id="about"
      className="relative w-full py-20 border-t border-[var(--line)]"
    >
      {/* Eyebrow & Headline */}
      <div className="max-w-4xl mb-16">
        <span
          data-ps
          className="text-xs font-mono tracking-widest text-[var(--acid)] font-bold uppercase block mb-3"
        >
          {'// ABOUT & PHILOSOPHY'}
        </span>
        <h2
          data-ps
          className="text-3xl sm:text-5xl lg:text-6xl font-black text-[var(--on-surface)] tracking-tight leading-[1.05] mb-6"
        >
          {profile.aboutHeadline}
        </h2>
        <p className="text-base sm:text-lg text-[var(--on-surface-dim)] leading-relaxed">
          {profile.bioLong}
        </p>
      </div>

      {/* Discipline Pillars */}
      {visiblePillars.length > 0 && (
        <div
          className={`grid grid-cols-1 ${
            visiblePillars.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
          } gap-12 pt-8`}
        >
          {visiblePillars.map((p, idx) => (
            <div
              key={`${p.index}-${idx}`}
              className="flex flex-col justify-between pt-6 border-t-2 border-[var(--line-highlight)] hover:border-[var(--acid)] transition-colors group"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-3">
                  <span style={{ color: p.color || 'var(--acid)' }}>
                    {p.index} {'// DISCIPLINE'}
                  </span>
                  <span className="text-[var(--on-surface-muted)] group-hover:text-[var(--on-surface)] transition-colors">
                    0{idx + 1} / 0{visiblePillars.length}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-[var(--on-surface)] mb-3 capitalize">
                  {p.title}
                </h3>

                <p className="text-xs sm:text-sm text-[var(--on-surface-dim)] leading-relaxed mb-6">
                  {p.desc}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[var(--line)]">
                {p.tools.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--line)] text-[var(--on-surface-dim)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
