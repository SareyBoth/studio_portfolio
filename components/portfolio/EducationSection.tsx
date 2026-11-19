'use client';

import React from 'react';
import type { EducationData } from '@/types/portfolio';

interface EducationSectionProps {
  education: EducationData[];
}

export default function EducationSection({ education }: EducationSectionProps) {
  return (
    <section id="education" className="relative w-full py-20 border-t border-[var(--line)]">
      <div className="max-w-3xl mb-12">
        <span
          data-ps
          className="text-xs font-mono tracking-widest text-[var(--acid)] font-bold uppercase block mb-2"
        >
          {'// ACADEMIC BACKGROUND'}
        </span>
        <h2
          data-ps
          className="text-3xl sm:text-5xl font-black text-[var(--on-surface)] tracking-tight mb-4"
        >
          Education &amp; credentials.
        </h2>
        <p className="text-xs sm:text-sm font-mono text-[var(--on-surface-dim)]">
          Formal university study in information systems, networks, and general academic foundations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {education.map((item) => (
          <div
            key={item.id}
            className="p-6 sm:p-8 rounded-2xl bg-[var(--surface-raised)] border border-[var(--line)] hover:border-[var(--line-highlight)] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--line)]">
                <span className="text-xs font-mono font-bold text-[var(--acid)]">
                  {item.period}
                </span>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[var(--surface-card)] text-[var(--on-surface-dim)]">
                  {item.location}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-[var(--on-surface)] mb-2">
                {item.degree}
              </h3>

              <div className="text-sm font-bold text-[var(--cobalt)] [data-theme='light']:text-blue-600 mb-4">
                {item.institution}
              </div>

              <p className="text-xs sm:text-sm text-[var(--on-surface-dim)] leading-relaxed">
                {item.focus}
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-[var(--line)] flex items-center justify-between text-[11px] font-mono text-[var(--on-surface-muted)]">
              <span>Verified Institution</span>
              <span className="text-[var(--acid)]">{item.location}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
