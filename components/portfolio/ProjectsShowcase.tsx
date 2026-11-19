'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { ProjectCategory, ProjectData } from '@/types/portfolio';
import VideoStreamPlayer from '@/components/media/VideoStreamPlayer';

interface ProjectsShowcaseProps {
  projects: ProjectData[];
  showTechnicalCategory: boolean;
}

export default function ProjectsShowcase({
  projects,
  showTechnicalCategory,
}: ProjectsShowcaseProps) {
  const availableCategories = useMemo<ProjectCategory[]>(
    () => (showTechnicalCategory ? ['Poster', 'Video', 'Technical'] : ['Poster', 'Video']),
    [showTechnicalCategory]
  );

  const [selectedFilter, setSelectedFilter] = useState<ProjectCategory>('Poster');
  const [activeModalProject, setActiveModalProject] = useState<ProjectData | null>(null);

  const effectiveFilter: ProjectCategory = availableCategories.includes(selectedFilter)
    ? selectedFilter
    : 'Poster';

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => p.category === effectiveFilter);
  }, [projects, effectiveFilter]);

  const counts = useMemo(() => {
    return {
      Poster: projects.filter((p) => p.category === 'Poster').length,
      Video: projects.filter((p) => p.category === 'Video').length,
      Technical: projects.filter((p) => p.category === 'Technical').length,
    };
  }, [projects]);

  const handleModalNext = useCallback(() => {
    if (!activeModalProject || filteredProjects.length === 0) return;
    const curIdx = filteredProjects.findIndex((p) => p.id === activeModalProject.id);
    const nextIdx = (curIdx + 1) % filteredProjects.length;
    setActiveModalProject(filteredProjects[nextIdx]);
  }, [activeModalProject, filteredProjects]);

  const handleModalPrev = useCallback(() => {
    if (!activeModalProject || filteredProjects.length === 0) return;
    const curIdx = filteredProjects.findIndex((p) => p.id === activeModalProject.id);
    const prevIdx = (curIdx - 1 + filteredProjects.length) % filteredProjects.length;
    setActiveModalProject(filteredProjects[prevIdx]);
  }, [activeModalProject, filteredProjects]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeModalProject) return;
      if (e.key === 'Escape') {
        setActiveModalProject(null);
      } else if (e.key === 'ArrowRight') {
        handleModalNext();
      } else if (e.key === 'ArrowLeft') {
        handleModalPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalProject, handleModalNext, handleModalPrev]);

  const getAspectClass = (aspect: ProjectData['aspect']) => {
    switch (aspect) {
      case '9:16':
        return 'aspect-[9/16]';
      case '4:5':
        return 'aspect-[4/5]';
      case '16:9':
        return 'aspect-[16/9]';
      default:
        return 'aspect-[16/10]';
    }
  };

  return (
    <section id="projects" className="relative w-full py-20 border-t border-[var(--line)]">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span
            data-ps
            className="text-xs font-mono tracking-widest text-[var(--acid)] font-bold uppercase block mb-2"
          >
            {'// SELECTED PROJECTS'}
          </span>
          <h2
            data-ps
            className="text-3xl sm:text-5xl font-black text-[var(--on-surface)] tracking-tight"
          >
            {showTechnicalCategory ? 'Posters, video & systems.' : 'Posters & video.'}
          </h2>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--line)]">
          {availableCategories.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-2 ${
                effectiveFilter === cat
                  ? 'bg-[var(--acid)] text-black font-bold shadow-md'
                  : 'text-[var(--on-surface-dim)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-card)]'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  effectiveFilter === cat
                    ? 'bg-black/20 text-black'
                    : 'bg-white/10 text-[var(--on-surface-dim)]'
                }`}
              >
                {counts[cat]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line-highlight)] bg-[var(--surface-raised)] p-12 text-center font-mono text-xs text-[var(--on-surface-dim)]">
          No published {effectiveFilter.toLowerCase()} projects yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => setActiveModalProject(project)}
              className="group relative rounded-2xl bg-[var(--surface-raised)] border border-[var(--line)] hover:border-[var(--line-highlight)] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between"
            >
              {/* Visual Thumbnail Area */}
              <div
                className={`relative w-full overflow-hidden bg-[#12141c] flex items-center justify-center ${
                  project.thumbnailUrl ? '' : 'p-4'
                } ${getAspectClass(project.aspect)}`}
              >
                {project.thumbnailUrl ? (
                  <>
                    <Image
                      src={project.thumbnailUrl}
                      alt={project.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                    {project.category === 'Video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/70 border border-white/20 group-hover:bg-[var(--acid)] group-hover:text-black text-white flex items-center justify-center transition-all shadow-lg backdrop-blur-md">
                          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-2 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white/90 border border-white/10">
                        {project.category}
                      </span>
                      <span
                        style={{ color: project.color }}
                        className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md font-bold"
                      >
                        {project.year}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
                      style={{
                        background: `radial-gradient(circle at center, ${project.color} 0%, transparent 70%)`,
                      }}
                    />

                    <div className="relative w-full h-full rounded-xl border border-white/10 bg-[#181a24] p-4 flex flex-col justify-between overflow-hidden">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-black/40 text-white/80">
                          {project.category}
                        </span>
                        <span style={{ color: project.color }} className="font-bold">
                          {project.year}
                        </span>
                      </div>

                      <div className="text-center py-4">
                        {project.category === 'Video' ? (
                          <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-[var(--acid)] group-hover:text-black text-white mx-auto flex items-center justify-center transition-all shadow-lg">
                            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        ) : project.category === 'Technical' ? (
                          <div className="text-3xl font-mono" style={{ color: project.color }}>
                            &lt;/&gt;
                          </div>
                        ) : (
                          <div className="text-4xl font-serif italic text-white/80 group-hover:text-white transition-colors">
                            {project.title.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-zinc-400 truncate">
                        {project.subtitle}
                      </div>
                    </div>
                  </>
                )}

                {/* Hover Inspect Pill */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[11px] font-mono text-white border border-white/20 flex items-center gap-1 shadow-lg">
                    <span>Inspect</span>
                    <span>↗</span>
                  </span>
                </div>
              </div>

              {/* Card Content Footer */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--on-surface)] group-hover:text-[var(--acid)] transition-colors mb-1">
                    {project.title}
                  </h3>
                  <p className="text-xs text-[var(--on-surface-dim)] line-clamp-2 leading-relaxed mb-4">
                    {project.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--line)]">
                  {project.tools.map((tool) => (
                    <span
                      key={tool}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-card)] text-[var(--on-surface-dim)]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Cinema / Lightbox Modal */}
      {activeModalProject && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8"
        >
          <div className="relative w-full max-w-5xl rounded-3xl bg-[#0e1017] border border-white/15 overflow-hidden shadow-2xl flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activeModalProject.color }}
                />
                <span className="text-xs font-mono text-white/70 uppercase">
                  {activeModalProject.category} SHOWCASE // {activeModalProject.year}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleModalPrev}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center text-xs font-mono cursor-pointer"
                  title="Previous (ArrowLeft)"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={handleModalNext}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center text-xs font-mono cursor-pointer"
                  title="Next (ArrowRight)"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalProject(null)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono cursor-pointer flex items-center gap-1.5 ml-2"
                >
                  <span>[ESC] CLOSE</span>
                  <span>×</span>
                </button>
              </div>
            </div>

            {/* Media Area */}
            <div className="relative w-full bg-black/60 flex items-center justify-center p-4 sm:p-8 min-h-[340px] max-h-[65vh] overflow-hidden">
              {activeModalProject.category === 'Video' ? (
                activeModalProject.videoUrl ? (
                  <div className="w-full max-w-4xl">
                    <VideoStreamPlayer
                      key={activeModalProject.videoUrl}
                      src={activeModalProject.videoUrl}
                      poster={activeModalProject.thumbnailUrl}
                      title={activeModalProject.title}
                      accentColor={activeModalProject.color}
                      autoPlay
                    />
                  </div>
                ) : activeModalProject.externalVideoUrl ? (
                  <div className="w-full max-w-3xl aspect-[16/9] rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                    <iframe
                      src={activeModalProject.externalVideoUrl}
                      title={activeModalProject.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <div className="text-xs font-mono text-zinc-400">
                    No video asset uploaded yet for this project.
                  </div>
                )
              ) : activeModalProject.thumbnailUrl ? (
                <Image
                  src={activeModalProject.thumbnailUrl}
                  alt={activeModalProject.title}
                  width={1200}
                  height={1500}
                  unoptimized
                  className="max-h-[58vh] w-auto max-w-full rounded-2xl border border-white/15 shadow-2xl object-contain"
                />
              ) : (
                <div className="relative max-w-xl w-full p-8 rounded-2xl bg-[#141622] border border-white/15 shadow-2xl flex flex-col items-center text-center">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black mb-4"
                    style={{
                      backgroundColor: `${activeModalProject.color}20`,
                      color: activeModalProject.color,
                    }}
                  >
                    {activeModalProject.category === 'Technical' ? '</>' : 'ART'}
                  </div>
                  <h4 className="text-2xl font-black text-white mb-2">
                    {activeModalProject.title}
                  </h4>
                  <p className="text-xs font-mono text-[var(--acid)] mb-4">
                    {activeModalProject.subtitle}
                  </p>
                  <p className="text-sm text-zinc-300 leading-relaxed max-w-md">
                    {activeModalProject.description}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Info */}
            <div className="p-6 sm:p-8 bg-[#12141c] border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {activeModalProject.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-lg">
                  {activeModalProject.description}
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2">
                <span className="text-[11px] font-mono text-zinc-500 uppercase">
                  Production Tools
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalProject.tools.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-mono px-2.5 py-1 rounded-md bg-white/10 text-white font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
