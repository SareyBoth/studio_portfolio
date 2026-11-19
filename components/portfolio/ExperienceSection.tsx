'use client';

import React from 'react';
import type { ExperienceData } from '@/types/portfolio';

interface ExperienceSectionProps {
  experiences: ExperienceData[];
}

export default function ExperienceSection({ experiences }: ExperienceSectionProps) {
  return (
    <section id="experience" className="relative w-full py-20 border-t border-[var(--line)]">
      <div className="max-w-3xl mb-12">
        <span
          data-ps
          className="text-xs font-mono tracking-widest text-[var(--acid)] font-bold uppercase block mb-2"
        >
          {'// WORK HISTORY'}
        </span>
        <h2
          data-ps
          className="text-3xl sm:text-5xl font-black text-[var(--on-surface)] tracking-tight mb-4"
        >
          Professional experience.
        </h2>
        <p className="text-xs sm:text-sm font-mono text-[var(--on-surface-dim)]">
          Hands-on teaching, lab maintenance, and computer hardware support.
        </p>
      </div>

      <div className="relative border-l-2 border-[var(--line-highlight)] ml-4 sm:ml-8 pl-6 sm:pl-10 flex flex-col gap-12">
        {experiences.map((exp) => (
          <div key={exp.id} className="relative group">
            <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-4 h-4 rounded-full bg-[var(--surface)] border-2 border-[var(--acid)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--acid)] pulse-dot" />
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[var(--surface-raised)] border border-[var(--line)] hover:border-[var(--line-highlight)] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-4 border-b border-[var(--line)]">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--acid)] block mb-1">
                    {exp.period}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--on-surface)]">
                    {exp.role}
                  </h3>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-sm font-bold text-[var(--on-surface)]">
                    {exp.organization}
                  </div>
                  <div className="text-xs font-mono text-[var(--on-surface-dim)]">
                    {exp.location}
                  </div>
                </div>
              </div>

              <ul className="flex flex-col gap-2.5">
                {exp.responsibilities.map((resp, rIdx) => (
                  <li
                    key={rIdx}
                    className="flex items-start gap-3 text-xs sm:text-sm text-[var(--on-surface-dim)] leading-relaxed"
                  >
                    <span className="text-[var(--acid)] font-bold mt-0.5">›</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
