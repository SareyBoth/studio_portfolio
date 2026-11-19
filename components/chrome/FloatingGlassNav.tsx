'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { ProfileData } from '@/types/portfolio';

interface FloatingGlassNavProps {
  profile: ProfileData;
  onNavigateTo: (sectionId: string) => void;
  onToggleMenu: () => void;
  isMenuOpen: boolean;
  inMonitor: boolean;
  onExitMonitor: () => void;
}

export default function FloatingGlassNav({
  profile,
  onNavigateTo,
  onToggleMenu,
  isMenuOpen,
  inMonitor,
  onExitMonitor,
}: FloatingGlassNavProps) {
  const [flashlight, setFlashlight] = useState({ x: 50, y: 50, active: false });
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    setFlashlight({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  };

  const handleMouseLeave = () => {
    setFlashlight((prev) => ({ ...prev, active: false }));
  };

  const navLinks = [
    { label: 'Projects', id: 'projects' },
    { label: 'About', id: 'about' },
    { label: 'Skills', id: 'skills' },
    { label: 'Experience', id: 'experience' },
    { label: 'Contact', id: 'contact' },
  ];

  const brandWord = profile.name.trim().split(/\s+/).pop()?.toLowerCase() || 'ratanak';
  const initial = (profile.name.trim()[0] || 'R').toUpperCase();

  return (
    <header className="fixed top-4 sm:top-6 inset-x-0 z-40 flex justify-center px-3 sm:px-6 pointer-events-none">
      <nav
        ref={navRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="pointer-events-auto relative w-full max-w-[880px] h-14 sm:h-15 rounded-2xl bg-[#0b0c10]/90 backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.6)] flex items-center justify-between px-4 sm:px-6 transition-all duration-300"
        style={{
          transform: 'perspective(1000px) rotateX(1.5deg)',
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
          style={{
            opacity: flashlight.active ? 1 : 0,
            background: `radial-gradient(circle 180px at ${flashlight.x}% ${flashlight.y}%, rgba(245, 158, 11, 0.12), transparent 70%)`,
          }}
        />

        <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#f59e0b]/70 pointer-events-none" />
        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#f59e0b]/70 pointer-events-none" />

        <button
          type="button"
          onClick={() => {
            if (inMonitor) {
              onExitMonitor();
            } else {
              onNavigateTo('top');
            }
          }}
          className="flex items-center gap-3 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f59e0b] rounded-lg p-1"
          aria-label={`${profile.name} Home`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f59e0b] to-[#d7ff3f] p-[1.5px] transition-transform group-hover:scale-105 shadow-md">
            <div className="w-full h-full rounded-[6.5px] bg-[#0c0d12] flex items-center justify-center">
              <span className="text-xs font-mono font-black text-[#f59e0b]">{initial}</span>
            </div>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold tracking-tight text-white group-hover:text-[#f59e0b] transition-colors leading-none">
              {brandWord}
              <span className="text-[#f59e0b]">.</span>
            </span>
            <span className="hidden sm:inline text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
              Studio &amp; Works
            </span>
          </div>
        </button>

        <div className="hidden md:flex items-center gap-1 sm:gap-2">
          {navLinks.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => onNavigateTo(item.id)}
              className="text-xs font-mono px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#f59e0b]"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-300">
            <span
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                profile.isAvailable ? 'bg-[#10b981]' : 'bg-[#ff6b12]'
              }`}
            />
            <span className="tracking-wide text-zinc-400 uppercase">
              {profile.isAvailable ? 'Available' : 'Busy'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTo('contact')}
            className="md:hidden text-xs font-mono px-2.5 py-1 rounded-md text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 cursor-pointer"
          >
            Contact
          </button>

          <button
            type="button"
            onClick={onToggleMenu}
            className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#f59e0b] ${
              isMenuOpen ? 'border-[#f59e0b] bg-white/10' : ''
            }`}
            aria-label="Toggle navigation menu"
          >
            <span
              className={`w-4 h-0.5 bg-current transition-transform duration-200 ${
                isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
              }`}
            />
            <span
              className={`w-4 h-0.5 bg-current transition-opacity duration-200 ${
                isMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`w-4 h-0.5 bg-current transition-transform duration-200 ${
                isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`}
            />
          </button>
        </div>
      </nav>
    </header>
  );
}
