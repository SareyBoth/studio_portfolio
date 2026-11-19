'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PortfolioPayload } from '@/types/portfolio';
import StudioCanvas from './StudioCanvas';
import FloatingGlassNav from '../chrome/FloatingGlassNav';
import WavingSheetMenu from '../chrome/WavingSheetMenu';
import ParticleScrollEffect from '../chrome/ParticleScrollEffect';
import SunsetDriveFooter from '../chrome/SunsetDriveFooter';

import ProfileHero from '../portfolio/ProfileHero';
import ProjectsShowcase from '../portfolio/ProjectsShowcase';
import AboutSection from '../portfolio/AboutSection';
import SkillsSection from '../portfolio/SkillsSection';
import ExperienceSection from '../portfolio/ExperienceSection';
import EducationSection from '../portfolio/EducationSection';
import ContactSection from '../portfolio/ContactSection';

interface StudioExperienceProps {
  data: PortfolioPayload;
}

export default function StudioExperience({ data }: StudioExperienceProps) {
  const { profile, wallFrames, projects, skills, experience, education } = data;

  const [monitorProgress, setMonitorProgress] = useState(0.0);
  const [cameraMode, setCameraMode] = useState<
    'OVERVIEW' | 'FRAME_INSPECT' | 'MONITOR_PORTFOLIO'
  >('OVERVIEW');
  const [activeFrameIndex, setActiveFrameIndex] = useState<number | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [cvTab, setCvTab] = useState<'pdf' | 'summary'>(profile.cvUrl ? 'pdf' : 'summary');

  const [inMonitor, setInMonitor] = useState(false);

  const cvDialogRef = useRef<HTMLDialogElement>(null);
  const runwayPxRef = useRef(2200);
  const accumulatedWheelRef = useRef(0);
  const touchStartYRef = useRef(0);

  const handleOpenCvModal = useCallback(() => {
    setCvTab(profile.cvUrl ? 'pdf' : 'summary');
    setIsCvModalOpen(true);
  }, [profile.cvUrl]);

  // Sync native <dialog> modal open/close cleanly
  useEffect(() => {
    const dialog = cvDialogRef.current;
    if (!dialog) return;

    if (isCvModalOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isCvModalOpen && dialog.open) {
      dialog.close();
    }
  }, [isCvModalOpen]);

  const applyMonitorProgress = useCallback(
    (next: number | ((prev: number) => number)) => {
      setMonitorProgress((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        if (resolved >= 0.95) {
          setInMonitor(true);
          setCameraMode('MONITOR_PORTFOLIO');
        } else if (resolved < 0.9) {
          setInMonitor(false);
          setCameraMode((mode) => (mode === 'MONITOR_PORTFOLIO' ? 'OVERVIEW' : mode));
        }
        return resolved;
      });
    },
    []
  );

  useEffect(() => {
    if (inMonitor) {
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [inMonitor]);

  // Virtual Scroll Runway in 3D Mode
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isMenuOpen || isCvModalOpen || cameraMode === 'FRAME_INSPECT') {
        return;
      }

      if (!inMonitor) {
        accumulatedWheelRef.current = Math.max(
          0,
          Math.min(runwayPxRef.current, accumulatedWheelRef.current + e.deltaY)
        );
        const nextProgress = accumulatedWheelRef.current / runwayPxRef.current;
        applyMonitorProgress(nextProgress);
      } else if (window.scrollY <= 0 && e.deltaY < -15) {
        accumulatedWheelRef.current = 0;
        applyMonitorProgress(0.0);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isMenuOpen || isCvModalOpen || cameraMode === 'FRAME_INSPECT') {
        return;
      }

      const currentY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;

      if (!inMonitor) {
        accumulatedWheelRef.current = Math.max(
          0,
          Math.min(runwayPxRef.current, accumulatedWheelRef.current + deltaY * 1.6)
        );
        const nextProgress = accumulatedWheelRef.current / runwayPxRef.current;
        applyMonitorProgress(nextProgress);
      } else if (window.scrollY <= 0 && deltaY < -20) {
        accumulatedWheelRef.current = 0;
        applyMonitorProgress(0.0);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [inMonitor, isMenuOpen, isCvModalOpen, cameraMode, applyMonitorProgress]);

  const handleNavigateTo = useCallback(
    (sectionId: string) => {
      if (!inMonitor) {
        accumulatedWheelRef.current = runwayPxRef.current;
        setMonitorProgress(1.0);
        setInMonitor(true);
        setCameraMode('MONITOR_PORTFOLIO');

        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 500);
      } else {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    },
    [inMonitor]
  );

  const handleExitMonitor = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      accumulatedWheelRef.current = 0;
      setMonitorProgress(0.0);
      setInMonitor(false);
      setCameraMode('OVERVIEW');
    }, 200);
  }, []);

  const handleEnterMonitor = useCallback(() => {
    accumulatedWheelRef.current = runwayPxRef.current;
    setMonitorProgress(1.0);
    setInMonitor(true);
    setCameraMode('MONITOR_PORTFOLIO');
  }, []);

  const computePortfolioOpacity = () => {
    if (monitorProgress <= 0.85) return 0;
    if (monitorProgress >= 1.0) return 1;
    const t = (monitorProgress - 0.85) / (1.0 - 0.85);
    return t * t * (3 - 2 * t);
  };

  const portfolioOpacity = computePortfolioOpacity();

  return (
    <div className="relative w-full min-h-screen bg-[#0a0b0d] text-[#f2efe8] overflow-x-hidden font-sans">
      {/* 1. Global Particle Scroll Dissolve Canvas & Vertical Hairlines */}
      <ParticleScrollEffect />

      {/* 2. Top Floating Glass Nav */}
      <FloatingGlassNav
        profile={profile}
        onNavigateTo={handleNavigateTo}
        onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
        isMenuOpen={isMenuOpen}
        inMonitor={inMonitor}
        onExitMonitor={handleExitMonitor}
      />

      {/* 3. Fullscreen 3D Waving Sheet Menu */}
      <WavingSheetMenu
        profile={profile}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigateTo={handleNavigateTo}
      />

      {/* 4. Fixed 3D Studio Canvas Background */}
      <div
        id="canvas-container"
        className={`fixed inset-0 w-[100vw] h-[100dvh] z-0 overflow-hidden transition-opacity duration-700 ${
          inMonitor
            ? 'pointer-events-none opacity-30'
            : 'pointer-events-auto opacity-100'
        }`}
        style={{ margin: 0, padding: 0 }}
      >
        <StudioCanvas
          profile={profile}
          wallFrames={wallFrames}
          monitorProgress={monitorProgress}
          setMonitorProgress={applyMonitorProgress}
          cameraMode={cameraMode}
          setCameraMode={setCameraMode}
          activeFrameIndex={activeFrameIndex}
          setActiveFrameIndex={setActiveFrameIndex}
          onEnterMonitor={handleEnterMonitor}
        />
      </div>

      {/* Floating Exit Monitor / 3D Studio Pill Button */}
      {inMonitor && (
        <div className="fixed top-20 sm:top-24 right-4 sm:right-8 z-40">
          <button
            type="button"
            onClick={handleExitMonitor}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 hover:bg-black/95 text-white/90 hover:text-white border border-white/20 hover:border-[#d7ff3f] backdrop-blur-xl shadow-xl text-xs font-mono transition-all cursor-pointer group active:scale-95"
            title="Return to 3D Isometric Loft"
          >
            <span className="text-[#d7ff3f] group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            <span>Exit Monitor / 3D Studio</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
              ESC
            </span>
          </button>
        </div>
      )}

      {/* 5. In-Monitor Portfolio Website */}
      <div
        id="layout"
        className="bg-black relative z-20 w-full min-h-screen transition-opacity duration-300"
        style={{
          opacity: portfolioOpacity,
          pointerEvents: inMonitor ? 'auto' : 'none',
        }}
      >
        <main className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProfileHero
            profile={profile}
            onNavigateTo={handleNavigateTo}
            onOpenCvModal={handleOpenCvModal}
          />

          <ProjectsShowcase
            projects={projects}
            showTechnicalCategory={profile.showTechnicalCategory}
          />

          <AboutSection profile={profile} />

          <SkillsSection skills={skills} />

          <ExperienceSection experiences={experience} />

          <EducationSection education={education} />

          <ContactSection
            profile={profile}
            onOpenCvModal={handleOpenCvModal}
          />
        </main>

        <SunsetDriveFooter
          profile={profile}
          onNavigateTo={handleNavigateTo}
          onOpenContactBrief={() => handleNavigateTo('contact')}
        />
      </div>

      {/* 6. Native Modal CV Preview Dialog */}
      <dialog
        ref={cvDialogRef}
        aria-labelledby="cv-dialog-title"
        onClose={() => {
          if (cvDialogRef.current) cvDialogRef.current.returnValue = '';
          setIsCvModalOpen(false);
        }}
        className="m-auto w-full max-w-4xl rounded-3xl bg-[#0e1017] text-[#f2efe8] border border-white/20 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-col gap-6">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-[#d7ff3f] block mb-1">
                CURRICULUM VITAE
              </span>
              <h3 id="cv-dialog-title" className="text-2xl font-black text-white">
                {profile.name}
              </h3>
              <p className="text-xs font-mono text-zinc-400">
                {profile.role} · {profile.location}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {profile.cvUrl && (
                <>
                  <div className="flex rounded-lg bg-white/5 p-1 border border-white/10 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setCvTab('pdf')}
                      className={`px-2.5 py-1 rounded cursor-pointer ${
                        cvTab === 'pdf' ? 'bg-[#d7ff3f] text-black font-bold' : 'text-zinc-300'
                      }`}
                    >
                      PDF VIEW
                    </button>
                    <button
                      type="button"
                      onClick={() => setCvTab('summary')}
                      className={`px-2.5 py-1 rounded cursor-pointer ${
                        cvTab === 'summary' ? 'bg-[#d7ff3f] text-black font-bold' : 'text-zinc-300'
                      }`}
                    >
                      SUMMARY
                    </button>
                  </div>

                  <a
                    href={profile.cvUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-[#d7ff3f] hover:brightness-110 text-black text-xs font-mono font-bold flex items-center gap-1.5"
                  >
                    <span>DOWNLOAD PDF</span>
                    <span>↓</span>
                  </a>
                </>
              )}

              {!profile.cvUrl && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono cursor-pointer flex items-center gap-1.5"
                >
                  <span>PRINT / SAVE PDF</span>
                  <span>⎙</span>
                </button>
              )}

              <button
                type="button"
                autoFocus
                onClick={() => setIsCvModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono cursor-pointer"
              >
                [ESC] CLOSE
              </button>
            </div>
          </div>

          {/* Body: Embedded R2 PDF or Structured Resume Summary */}
          {profile.cvUrl && cvTab === 'pdf' ? (
            <div className="w-full h-[65vh] rounded-2xl overflow-hidden border border-white/10 bg-black">
              <iframe
                src={profile.cvUrl}
                title={`${profile.name} Curriculum Vitae PDF`}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-6 text-sm text-zinc-300">
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-2 border-b border-white/10 pb-1">
                  Professional Summary
                </h4>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {profile.bioLong}
                </p>
              </div>

              {education.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3 border-b border-white/10 pb-1">
                    Education &amp; Diplomas
                  </h4>
                  <div className="flex flex-col gap-3">
                    {education.map((e) => (
                      <div
                        key={e.id}
                        className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs"
                      >
                        <div>
                          <strong className="text-white block">{e.degree}</strong>
                          <span className="text-zinc-400">
                            {e.institution} ({e.location})
                          </span>
                        </div>
                        <span className="font-mono text-[#d7ff3f] shrink-0 mt-1 sm:mt-0">
                          {e.period}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {experience.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3 border-b border-white/10 pb-1">
                    Experience
                  </h4>
                  {experience.map((exp) => (
                    <div key={exp.id} className="text-xs mb-3">
                      <div className="flex justify-between items-baseline mb-1">
                        <strong className="text-white">
                          {exp.role} — {exp.organization}
                        </strong>
                        <span className="font-mono text-[#d7ff3f]">{exp.period}</span>
                      </div>
                      <ul className="list-disc list-inside text-zinc-400 flex flex-col gap-1 mt-1">
                        {exp.responsibilities.map((r, rIdx) => (
                          <li key={rIdx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3 border-b border-white/10 pb-1">
                    Core Technical Tools
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                    {skills.map((s) => (
                      <div
                        key={s.id}
                        className="p-2 rounded bg-white/5 border border-white/5 flex items-center justify-between"
                      >
                        <span className="text-zinc-200 truncate">{s.name}</span>
                        <span className="text-[10px] text-[#d7ff3f] shrink-0 ml-1">
                          {s.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/10 flex flex-wrap justify-between gap-2 text-xs font-mono text-zinc-400">
                <span>Email: {profile.contact.email}</span>
                <span>Phone: {profile.contact.phone}</span>
                <span>Telegram: {profile.contact.telegram}</span>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
