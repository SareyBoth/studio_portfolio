'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ProfileData } from '@/types/portfolio';

interface WavingSheetMenuProps {
  profile: ProfileData;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTo: (sectionId: string) => void;
}

// 8-DOF Homography Solver: maps 4 source points to 4 destination points
function solveHomography(
  src: [number, number][],
  dst: [number, number][]
): number[] | null {
  // src: 4 points [ [u0, v0], [u1, v1], [u2, v2], [u3, v3] ]
  // dst: 4 points [ [x0, y0], [x1, y1], [x2, y2], [x3, y3] ]
  // Solves Ah = b for 8 parameters
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const [u, v] = src[i];
    const [x, y] = dst[i];
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    b.push(x);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    b.push(y);
  }

  // Gaussian elimination with partial pivoting
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    if (Math.abs(A[maxRow][i]) < 1e-12) return null;

    // Swap rows
    const tempA = A[i];
    A[i] = A[maxRow];
    A[maxRow] = tempA;

    const tempB = b[i];
    b[i] = b[maxRow];
    b[maxRow] = tempB;

    for (let k = i + 1; k < n; k++) {
      const c = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        A[k][j] -= c * A[i][j];
      }
      b[k] -= c * b[i];
    }
  }

  // Back substitution
  const h = new Array(8).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = b[i];
    for (let j = i + 1; j < n; j++) {
      sum -= A[i][j] * h[j];
    }
    h[i] = sum / A[i][i];
  }

  // Homography matrix H = [[h0, h1, h2], [h3, h4, h5], [h6, h7, 1]]
  return [...h, 1];
}

export default function WavingSheetMenu({
  profile,
  isOpen,
  onClose,
  onNavigateTo,
}: WavingSheetMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardOpacity, setCardOpacity] = useState(1);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    const cardEl = cardRef.current;
    if (!container || !cardEl) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.prepend(renderer.domElement);

    // Sheet Dimensions
    const sheetW = 2.4;
    const sheetH = 3.2;

    const geometry = new THREE.PlaneGeometry(sheetW, sheetH, 32, 32);

    // Custom Physical Material with vertex wave
    const uniforms = {
      uTime: { value: 0 },
      uWaveAmp: { value: prefersReducedMotion ? 0 : 0.12 },
    };

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x141620,
      roughness: 0.2,
      metalness: 0.1,
      transmission: 0.6,
      thickness: 0.4,
      ior: 1.45,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uWaveAmp = uniforms.uWaveAmp;

      shader.vertexShader = `
        uniform float uTime;
        uniform float uWaveAmp;
        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        // Gentle arc-length conserving wave
        float wave = sin(position.x * 1.8 + uTime * 1.4) * cos(position.y * 1.2 + uTime * 0.8);
        transformed.z += wave * uWaveAmp;
        transformed.x -= wave * wave * 0.04;
        `
      );
    };

    const sheetMesh = new THREE.Mesh(geometry, material);
    scene.add(sheetMesh);

    // Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xd7ff3f, 1.5);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x2549ff, 1.8);
    rimLight.position.set(-3, -2, -3);
    scene.add(rimLight);

    const hoverLight = new THREE.PointLight(0xff6b12, 15, 6, 2);
    hoverLight.position.set(0, 0, 2);
    scene.add(hoverLight);

    // Inertial dragging state
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotX = -0.05;
    let rotY = 0.08;
    let velX = 0;
    let velY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      hoverLight.position.set(normX * 2.5, normY * 2.5, 1.8);

      if (isDragging) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        velY = dx * 0.005;
        velX = dy * 0.005;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Escape listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 4 Corner Local Positions on the 3D sheet
    const cornersLocal = [
      new THREE.Vector3(-sheetW / 2, sheetH / 2, 0), // Top-Left
      new THREE.Vector3(sheetW / 2, sheetH / 2, 0),  // Top-Right
      new THREE.Vector3(sheetW / 2, -sheetH / 2, 0), // Bottom-Right
      new THREE.Vector3(-sheetW / 2, -sheetH / 2, 0),// Bottom-Left
    ];

    // Render & Homography loop
    const animate = (time: number) => {
      uniforms.uTime.value = time * 0.001;

      // Apply drag velocity & damping
      if (!isDragging) {
        velX *= 0.94;
        velY *= 0.94;

        if (!prefersReducedMotion) {
          // Subtle idle floating breathing
          rotY += Math.sin(time * 0.0012) * 0.002;
          rotX += Math.cos(time * 0.0015) * 0.0015;
        }
      }

      rotX += velX;
      rotY += velY;

      // Clamp tilt so sheet doesn't flip completely upside down
      rotX = Math.max(-0.6, Math.min(0.6, rotX));
      sheetMesh.rotation.set(rotX, rotY, 0);

      sheetMesh.updateMatrixWorld();

      // Check sheet orientation towards camera
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(sheetMesh.quaternion);
      const isFacingCamera = normal.z > 0.15;

      // Project corners into screen pixel coordinates
      const w = window.innerWidth;
      const h = window.innerHeight;
      const projectedCorners: [number, number][] = [];

      cornersLocal.forEach((corner) => {
        const worldPos = corner.clone().applyMatrix4(sheetMesh.matrixWorld);
        const ndc = worldPos.project(camera);
        const sx = ((ndc.x + 1) / 2) * w;
        const sy = ((-ndc.y + 1) / 2) * h;
        projectedCorners.push([sx, sy]);
      });

      // Target DOM card dimensions (reference width and height)
      const cardW = 420;
      const cardH = 560;
      const srcCorners: [number, number][] = [
        [0, 0],
        [cardW, 0],
        [cardW, cardH],
        [0, cardH],
      ];

      // Solve Homography mapping [srcCorners] -> [projectedCorners]
      const H = solveHomography(srcCorners, projectedCorners);

      if (H && isFacingCamera && cardEl) {
        const [h0, h1, h2, h3, h4, h5, h6, h7, h8] = H;
        // Build CSS matrix3d(a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, a4, b4, c4, d4)
        cardEl.style.transform = `matrix3d(${h0}, ${h3}, 0, ${h6}, ${h1}, ${h4}, 0, ${h7}, 0, 0, 1, 0, ${h2}, ${h5}, 0, ${h8})`;
        setCardOpacity(Math.min(1, Math.max(0, (normal.z - 0.15) * 2.5)));
      } else {
        setCardOpacity(0);
      }

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    // Teardown
    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);

      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navItems = [
    { label: '01 / PROJECTS', id: 'projects', desc: 'Commercial Video Cuts & Editorial Posters' },
    { label: '02 / ABOUT', id: 'about', desc: 'Creative Practice & Phnom Penh Studio' },
    { label: '03 / SKILLS', id: 'skills', desc: 'Post-Production, Color & Retouching' },
    { label: '04 / EXPERIENCE', id: 'experience', desc: 'Commercial & Editorial Production History' },
    { label: '05 / CONTACT & CV', id: 'contact', desc: 'Inquiries, Commissions & Resume' },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-2xl flex items-center justify-center select-none"
    >
      {/* Top Controls Bar */}
      <div className="absolute top-6 inset-x-6 z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs font-mono text-white/80">
          <span className="w-2 h-2 rounded-full bg-[#d7ff3f] pulse-dot" />
          <span>3D WAVING SHEET NAVIGATION</span>
          <span className="text-white/40">·</span>
          <span className="text-white/60">Drag to Spin & Tilt</span>
        </div>

        <button
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white px-4 py-2 rounded-full border border-white/20 text-xs font-mono flex items-center gap-2 cursor-pointer"
        >
          <span>[ESC] CLOSE</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Homography-Locked DOM Glass Menu Card (420x560) */}
      <div
        ref={cardRef}
        style={{
          width: '420px',
          height: '560px',
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: '0 0',
          opacity: cardOpacity,
          pointerEvents: cardOpacity > 0.4 ? 'auto' : 'none',
        }}
        className="menu-links rounded-2xl bg-[#0e1017]/92 border border-white/20 backdrop-blur-2xl p-7 shadow-2xl flex flex-col justify-between transition-opacity duration-150"
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
            <div>
              <span className="text-xs font-mono text-[#d7ff3f] font-bold block mb-0.5">
                {'// DIRECTORY'}
              </span>
              <h2 className="text-lg font-black tracking-tight text-white">
                {profile.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-zinc-400 block">
                LOCATION
              </span>
              <span className="text-xs font-mono text-white font-medium">
                {profile.locationShort}
              </span>
            </div>
          </div>

          {/* Links list */}
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigateTo(item.id);
                  onClose();
                }}
                className="group flex flex-col text-left px-3 py-2 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white group-hover:text-[#d7ff3f] transition-colors">
                    {item.label}
                  </span>
                  <span className="text-xs font-mono text-zinc-500 group-hover:text-[#d7ff3f] group-hover:translate-x-1 transition-all">
                    →
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  {item.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Contact Metadata */}
        <div className="border-t border-white/10 pt-4 mt-2">
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-zinc-500 block text-[9px]">EMAIL</span>
              <a
                href={`mailto:${profile.contact.email}`}
                className="text-zinc-300 hover:text-[#d7ff3f] truncate block"
              >
                {profile.contact.email}
              </a>
            </div>
            <div>
              <span className="text-zinc-500 block text-[9px]">TELEGRAM</span>
              <a
                href={profile.contact.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-300 hover:text-[#d7ff3f] block"
              >
                {profile.contact.telegram}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
