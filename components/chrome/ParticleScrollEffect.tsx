'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  size: number;
  color: [number, number, number];
  alpha: number;
  progress: number;
  speed: number;
  scatterX: number;
  scatterY: number;
}

export default function ParticleScrollEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    const maxParticles = 300;

    // Tint colors: orange [255, 77, 0] to gold [255, 210, 51]
    const tintA: [number, number, number] = [255, 77, 0];
    const tintB: [number, number, number] = [255, 210, 51];

    let lastScrollY = window.scrollY;

    const checkAndSpawnParticles = () => {
      const psElements = document.querySelectorAll('[data-ps]');
      const viewBottom = height;

      psElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Formation band: element crossing bottom viewport edge
        const distFromBottom = rect.top - viewBottom;

        if (distFromBottom > -100 && distFromBottom < 250 && particles.length < maxParticles) {
          const spawnCount = Math.min(12, maxParticles - particles.length);
          for (let i = 0; i < spawnCount; i++) {
            const rx = rect.left + Math.random() * rect.width;
            const ry = rect.top + Math.random() * rect.height;
            const lerpRatio = Math.random();
            const color: [number, number, number] = [
              Math.round(tintA[0] * (1 - lerpRatio) + tintB[0] * lerpRatio),
              Math.round(tintA[1] * (1 - lerpRatio) + tintB[1] * lerpRatio),
              Math.round(tintA[2] * (1 - lerpRatio) + tintB[2] * lerpRatio),
            ];

            const scatterDistance = 30 + Math.random() * 50;
            const angle = Math.random() * Math.PI * 2;

            particles.push({
              x: rx + Math.cos(angle) * scatterDistance,
              y: ry + Math.sin(angle) * scatterDistance,
              originX: rx + Math.cos(angle) * scatterDistance,
              originY: ry + Math.sin(angle) * scatterDistance,
              targetX: rx,
              targetY: ry,
              size: 1.5 + Math.random() * 2.5,
              color,
              alpha: 0.8 + Math.random() * 0.2,
              progress: 0,
              speed: 0.02 + Math.random() * 0.03,
              scatterX: (Math.random() - 0.5) * 2,
              scatterY: (Math.random() - 0.5) * 2,
            });
          }
        }
      });
    };

    // Horizontal and vertical architectural rule observers
    const ruleElements = document.querySelectorAll('[data-line]');
    const ruleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.transform = 'scaleX(1)';
            (entry.target as HTMLElement).style.opacity = '1';
          }
        });
      },
      { threshold: 0.1 }
    );
    ruleElements.forEach((el) => {
      (el as HTMLElement).style.transform = 'scaleX(0)';
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transformOrigin = 'left center';
      (el as HTMLElement).style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease';
      ruleObserver.observe(el);
    });

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Check scroll changes
      if (Math.abs(window.scrollY - lastScrollY) > 2) {
        checkAndSpawnParticles();
        lastScrollY = window.scrollY;
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;

        // Smooth cubic ease out towards target
        const t = Math.min(1, p.progress);
        const ease = 1 - Math.pow(1 - t, 3);

        p.x = p.originX + (p.targetX - p.originX) * ease;
        p.y = p.originY + (p.targetY - p.originY) * ease - (window.scrollY - lastScrollY) * 0.2;
        p.alpha = Math.max(0, 1 - p.progress * 0.9);

        ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${p.alpha})`;
        ctx.shadowColor = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0.6)`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.progress >= 1) {
          particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      ruleObserver.disconnect();
    };
  }, []);

  return (
    <>
      {/* 6 Architectural vertical hairlines across viewport */}
      <div className="vrules fixed inset-0 pointer-events-none z-10 flex justify-between px-4 sm:px-12 max-w-7xl mx-auto opacity-20">
        <div className="w-[1px] h-full bg-white/10 dark:bg-white/10 [data-theme='light']:bg-black/10" />
        <div className="w-[1px] h-full bg-white/10 dark:bg-white/10 [data-theme='light']:bg-black/10 hidden md:block" />
        <div className="w-[1px] h-full bg-white/10 dark:bg-white/10 [data-theme='light']:bg-black/10 hidden lg:block" />
        <div className="w-[1px] h-full bg-white/10 dark:bg-white/10 [data-theme='light']:bg-black/10 hidden lg:block" />
        <div className="w-[1px] h-full bg-white/10 dark:bg-white/10 [data-theme='light']:bg-black/10 hidden md:block" />
        <div className="w-[1px] h-full bg-white/10 dark:bg-white/10 [data-theme='light']:bg-black/10" />
      </div>

      {/* Particle Canvas */}
      <canvas
        id="ps-output"
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-25"
        aria-hidden="true"
      />
    </>
  );
}
