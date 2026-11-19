'use client';

import React, { useState } from 'react';
import type { SkillData } from '@/types/portfolio';

interface SkillsSectionProps {
  skills: SkillData[];
}

export default function SkillsSection({ skills }: SkillsSectionProps) {
  const [spotlightSkill, setSpotlightSkill] = useState<SkillData | null>(skills[0] ?? null);

  const categories = [
    { title: 'Design & Visual', color: 'var(--acid)' },
    { title: 'Video & Motion', color: 'var(--amber)' },
    { title: 'IT & Networking', color: 'var(--cyan)' },
  ] as const;

  const activeSpotlight =
    spotlightSkill && skills.some((s) => s.id === spotlightSkill.id)
      ? spotlightSkill
      : skills[0] ?? null;

  const half = Math.ceil(skills.length / 2);
  const marqueeRow1 = skills.slice(0, half);
  const marqueeRow2 = skills.slice(half);

  return (
    <section id="skills" className="relative w-full py-20 border-t border-[var(--line)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span
            data-ps
            className="text-xs font-mono tracking-widest text-[var(--acid)] font-bold uppercase block mb-2"
          >
            {'// TOOLS & CAPABILITIES'}
          </span>
          <h2
            data-ps
            className="text-3xl sm:text-5xl font-black text-[var(--on-surface)] tracking-tight"
          >
            Skills &amp; tech stack.
          </h2>
        </div>
        <p className="text-xs sm:text-sm font-mono text-[var(--on-surface-dim)] max-w-sm">
          Dual discipline in digital media creation and enterprise network infrastructure.
        </p>
      </div>

      {/* Dual Opposing Infinite Marquee Rows */}
      {skills.length > 0 && (
        <div className="relative w-full overflow-hidden py-4 mb-14 rounded-2xl bg-[var(--surface-raised)] border border-[var(--line)]">
          {marqueeRow1.length > 0 && (
            <div className="relative w-full overflow-hidden flex mb-3">
              <div className="animate-marquee flex items-center gap-3">
                {[...marqueeRow1, ...marqueeRow1, ...marqueeRow1, ...marqueeRow1].map(
                  (skill, idx) => (
                    <div
                      key={`r1-${skill.id}-${idx}`}
                      onClick={() => setSpotlightSkill(skill)}
                      className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--line)] hover:border-[var(--acid)] cursor-pointer transition-all hover:scale-105 shrink-0"
                    >
                      <span className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-mono font-bold text-[var(--acid)]">
                        {skill.shortCode}
                      </span>
                      <span className="text-xs font-bold text-[var(--on-surface)]">
                        {skill.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-[var(--on-surface-dim)]">
                        {skill.level}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {marqueeRow2.length > 0 && (
            <div className="relative w-full overflow-hidden flex">
              <div className="animate-marquee-reverse flex items-center gap-3">
                {[...marqueeRow2, ...marqueeRow2, ...marqueeRow2, ...marqueeRow2].map(
                  (skill, idx) => (
                    <div
                      key={`r2-${skill.id}-${idx}`}
                      onClick={() => setSpotlightSkill(skill)}
                      className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--line)] hover:border-[var(--cyan)] cursor-pointer transition-all hover:scale-105 shrink-0"
                    >
                      <span className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-mono font-bold text-[var(--cyan)]">
                        {skill.shortCode}
                      </span>
                      <span className="text-xs font-bold text-[var(--on-surface)]">
                        {skill.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-[var(--on-surface-dim)]">
                        {skill.level}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--surface-raised)] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--surface-raised)] to-transparent pointer-events-none" />
        </div>
      )}

      {/* Interactive Spotlight Bar */}
      {activeSpotlight && (
        <div className="p-6 rounded-2xl bg-[#11131c] border border-[var(--line-highlight)] shadow-xl mb-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--acid)] text-black font-mono font-black text-sm flex items-center justify-center shadow-lg">
              {activeSpotlight.shortCode}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--acid)] mb-1">
                <span>SPOTLIGHT CAPABILITY</span>
                <span>·</span>
                <span className="text-white/60">{activeSpotlight.category}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {activeSpotlight.name}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
              Proficiency: <strong className="text-[var(--acid)]">{activeSpotlight.level}</strong>
            </div>
            <div className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
              Focus: <strong className="text-white">{activeSpotlight.tag}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Complete Categorized Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {categories.map((cat) => {
          const categorySkills = skills.filter((s) => s.category === cat.title);
          return (
            <div
              key={cat.title}
              className="p-6 rounded-2xl bg-[var(--surface-raised)] border border-[var(--line)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--line)]">
                  <h3 className="text-lg font-black text-[var(--on-surface)]">{cat.title}</h3>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  {categorySkills.map((skill) => (
                    <div
                      key={skill.id}
                      onClick={() => setSpotlightSkill(skill)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        activeSpotlight?.id === skill.id
                          ? 'bg-[var(--surface-card)] border-[var(--acid)] shadow-md'
                          : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--line-highlight)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-mono font-bold text-[var(--on-surface)]">
                          {skill.shortCode}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[var(--on-surface)]">
                            {skill.name}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--on-surface-dim)]">
                            {skill.tag}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-[var(--on-surface)] font-semibold">
                        {skill.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--line)] text-[11px] font-mono text-[var(--on-surface-muted)] flex items-center justify-between">
                <span>{categorySkills.length} tools verified</span>
                <span className="text-[var(--acid)]">Production Ready</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
