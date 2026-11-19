import * as THREE from 'three';
import type { ProfileData, StudioFrameAspect, StudioFrameData } from '@/types/portfolio';
import { computeCoverCropRect } from '@/lib/frame-math';

/**
 * Procedural Walnut Plank Floor Texture (1024x1024)
 * 8 planks, bezier grain, staggered butt joints, RepeatWrapping 2x2.
 */
export function createWalnutFloorTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = '#1c120c';
  ctx.fillRect(0, 0, size, size);

  const plankCount = 8;
  const plankHeight = size / plankCount;
  const plankShades = ['#281810', '#22140d', '#2c1b12', '#20120a', '#301d14', '#25160e'];

  for (let i = 0; i < plankCount; i++) {
    const y = i * plankHeight;
    ctx.fillStyle = plankShades[i % plankShades.length];
    ctx.fillRect(0, y, size, plankHeight);

    const seamOffset = (i * 380) % size;
    ctx.fillStyle = '#0f0805';
    ctx.fillRect(seamOffset, y, 3, plankHeight);
    ctx.fillStyle = '#3a2318';
    ctx.fillRect(seamOffset + 3, y, 1, plankHeight);

    ctx.strokeStyle = 'rgba(10, 6, 3, 0.35)';
    ctx.lineWidth = 1.2;
    for (let g = 0; g < 14; g++) {
      ctx.beginPath();
      const gy = y + (g / 14) * plankHeight + Math.sin(g) * 3;
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(
        size * 0.3,
        gy + Math.sin(i * 4 + g) * 8,
        size * 0.7,
        gy - Math.cos(i * 3 + g) * 8,
        size,
        gy + Math.sin(g * 2) * 5
      );
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(74, 46, 31, 0.22)';
    ctx.lineWidth = 0.8;
    for (let h = 0; h < 6; h++) {
      ctx.beginPath();
      const hy = y + (h / 6) * plankHeight + 4;
      ctx.moveTo(0, hy);
      ctx.bezierCurveTo(
        size * 0.4,
        hy + Math.cos(h) * 6,
        size * 0.8,
        hy - Math.sin(h) * 6,
        size,
        hy
      );
      ctx.stroke();
    }

    ctx.fillStyle = '#0b0604';
    ctx.fillRect(0, y + plankHeight - 2.5, size, 2.5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(0, y, size, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/**
 * Procedural Acoustic Wall Slat Texture (512x512)
 */
export function createAcousticSlatsTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = '#101115';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  for (let s = 0; s < 800; s++) {
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }

  const slatCount = 16;
  const slatSlotWidth = size / slatCount;
  const slatWidth = slatSlotWidth * 0.65;
  const gap = slatSlotWidth - slatWidth;

  for (let i = 0; i < slatCount; i++) {
    const x = i * slatSlotWidth + gap / 2;
    const grad = ctx.createLinearGradient(x, 0, x + slatWidth, 0);
    grad.addColorStop(0, '#533b2a');
    grad.addColorStop(0.15, '#73523c');
    grad.addColorStop(0.5, '#624532');
    grad.addColorStop(0.9, '#4f3727');
    grad.addColorStop(1, '#332318');

    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, slatWidth, size);

    ctx.fillStyle = 'rgba(30, 20, 14, 0.3)';
    ctx.fillRect(x + slatWidth * 0.25, 0, 1.5, size);
    ctx.fillRect(x + slatWidth * 0.7, 0, 1.2, size);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(x, 0, 1, size);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x + slatWidth, 0, 3, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Underside Grid Texture (512x512)
 */
export function createUndersideGridTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = '#0a0c10';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const step = 64;
  for (let p = 0; p <= size; p += step) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 1.5;
  const crossSize = 6;
  for (let x = 0; x <= size; x += step) {
    for (let y = 0; y <= size; y += step) {
      ctx.beginPath();
      ctx.moveTo(x - crossSize, y);
      ctx.lineTo(x + crossSize, y);
      ctx.moveTo(x, y - crossSize);
      ctx.lineTo(x, y + crossSize);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Dynamic Monitor Hero Preview Texture (1920x800 crisp CanvasTexture)
 * Driven by live database ProfileData and optional uploaded R2 portrait image.
 */
export function createMonitorHeroTexture(
  profile: ProfileData,
  portraitImg?: HTMLImageElement | null
): THREE.CanvasTexture {
  const width = 1920;
  const height = 800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = '#08090c';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < width; gx += 80) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }
  for (let gy = 0; gy < height; gy += 80) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }

  const glow = ctx.createRadialGradient(480, 400, 50, 480, 400, 600);
  glow.addColorStop(0, 'rgba(37, 73, 255, 0.16)');
  glow.addColorStop(0.5, 'rgba(215, 255, 63, 0.06)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Top Metadata Bar
  ctx.font = '600 18px monospace';
  ctx.fillStyle = '#8e95a2';
  ctx.fillText(profile.location.toUpperCase(), 90, 75);

  const chipX = 1430;
  ctx.fillStyle = profile.isAvailable ? 'rgba(215, 255, 63, 0.12)' : 'rgba(255, 107, 18, 0.12)';
  ctx.strokeStyle = profile.isAvailable ? '#d7ff3f' : '#ff6b12';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(chipX, 48, 300, 40, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = profile.isAvailable ? '#d7ff3f' : '#ff6b12';
  ctx.beginPath();
  ctx.arc(chipX + 24, 68, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f2efe8';
  ctx.font = '600 15px monospace';
  ctx.fillText(profile.availability.toUpperCase().slice(0, 22), chipX + 42, 74);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(90, 110);
  ctx.lineTo(width - 90, 110);
  ctx.stroke();

  // Kicker
  ctx.fillStyle = '#d7ff3f';
  ctx.font = '700 22px monospace';
  ctx.fillText(`// ${profile.kicker.toUpperCase()}`, 90, 175);

  // Display Headline
  ctx.fillStyle = '#f2efe8';
  ctx.font = '900 92px sans-serif';
  ctx.fillText(profile.headline.slice(0, 22), 90, 275);

  // Role subtitle tag
  ctx.fillStyle = '#2549ff';
  ctx.fillRect(90, 310, 8, 38);

  ctx.fillStyle = '#e2dfd6';
  ctx.font = '700 30px sans-serif';
  ctx.fillText(profile.role.toUpperCase().slice(0, 44), 115, 340);

  // Bio summary
  ctx.fillStyle = '#9ba1a6';
  ctx.font = '400 23px sans-serif';
  ctx.fillText(profile.subhead.slice(0, 82), 90, 395);

  // Discipline strip preview cards (up to 3)
  const cardW = 320;
  const cardH = 110;
  const displayDisciplines = (
    profile.disciplines.length > 0
      ? profile.disciplines
      : [
          { index: '01', title: 'POSTER DESIGN', desc: 'Typography & Key Visuals', color: '#d7ff3f', tools: [], visible: true },
          { index: '02', title: 'VIDEO & MOTION', desc: 'Speed Ramps & 4K Grading', color: '#ff6b12', tools: [], visible: true },
          { index: '03', title: 'IT & MIKROTIK', desc: 'RouterOS & Lab Deployment', color: '#06b6d4', tools: [], visible: true },
        ]
  ).slice(0, 3);

  displayDisciplines.forEach((c, idx) => {
    const cx = 90 + idx * (cardW + 28);
    const cy = 445;
    ctx.fillStyle = 'rgba(24, 26, 34, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = c.color || '#d7ff3f';
    ctx.fillRect(cx + 16, cy + 18, 24, 3);

    ctx.font = '800 16px monospace';
    ctx.fillStyle = '#f2efe8';
    ctx.fillText(`${c.index} / ${c.title.toUpperCase().slice(0, 18)}`, cx + 16, cy + 48);

    ctx.font = '400 14px sans-serif';
    ctx.fillStyle = '#8e95a2';
    ctx.fillText(c.desc.slice(0, 34), cx + 16, cy + 78);
  });

  // Callout Pill
  const pillW = 420;
  const pillH = 54;
  const pillX = 90;
  const pillY = 600;
  ctx.fillStyle = '#d7ff3f';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 27);
  ctx.fill();

  ctx.fillStyle = '#0a0b0d';
  ctx.font = '800 20px monospace';
  ctx.fillText('CLICK OR SCROLL TO ENTER  ↓', pillX + 38, pillY + 34);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.beginPath();
  ctx.roundRect(pillX + pillW + 20, pillY, 260, pillH, 27);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f2efe8';
  ctx.font = '600 18px monospace';
  ctx.fillText('DOWNLOAD CV (PDF) ↗', pillX + pillW + 45, pillY + 34);

  // Right Column: Editorial Portrait Frame preview
  const frameX = 1260;
  const frameY = 160;
  const frameW = 440;
  const frameH = 530;

  ctx.fillStyle = '#d7ff3f';
  ctx.fillRect(frameX + 18, frameY + 18, frameW, frameH);

  ctx.fillStyle = '#14161f';
  ctx.strokeStyle = '#2549ff';
  ctx.lineWidth = 2;
  ctx.fillRect(frameX, frameY, frameW, frameH);
  ctx.strokeRect(frameX, frameY, frameW, frameH);

  const innerX = frameX + 24;
  const innerY = frameY + 24;
  const innerW = frameW - 48;
  const innerH = frameH - 120;

  ctx.fillStyle = '#1c1f2e';
  ctx.fillRect(innerX, innerY, innerW, innerH);

  if (portraitImg && portraitImg.naturalWidth > 0 && portraitImg.naturalHeight > 0) {
    const crop = computeCoverCropRect(
      portraitImg.naturalWidth,
      portraitImg.naturalHeight,
      innerW,
      innerH
    );
    ctx.drawImage(
      portraitImg,
      crop.sx,
      crop.sy,
      crop.sWidth,
      crop.sHeight,
      innerX,
      innerY,
      innerW,
      innerH
    );
  } else {
    ctx.strokeStyle = 'rgba(215, 255, 63, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(frameX + frameW / 2, frameY + 180, 90, 0, Math.PI * 2);
    ctx.stroke();

    const initial = (profile.name.trim()[0] || 'R').toUpperCase();
    ctx.font = '900 120px sans-serif';
    ctx.fillStyle = '#d7ff3f';
    ctx.textAlign = 'center';
    ctx.fillText(initial, frameX + frameW / 2, frameY + 220);
    ctx.textAlign = 'left';
  }

  ctx.font = '700 16px monospace';
  ctx.fillStyle = '#2549ff';
  ctx.fillText('01 / PROFILE IDENT', frameX + 28, frameY + frameH - 58);

  ctx.font = '700 20px sans-serif';
  ctx.fillStyle = '#f2efe8';
  ctx.fillText(profile.name.toUpperCase().slice(0, 22), frameX + 28, frameY + frameH - 28);

  ctx.font = '500 15px monospace';
  ctx.fillStyle = '#d7ff3f';
  ctx.fillText(profile.locationShort.toUpperCase().slice(0, 14), frameX + frameW - 160, frameY + frameH - 28);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);

  return texture;
}

/**
 * Curved ultrawide monitor patch geometry.
 */
export function createCurvedMonitorGeometry(
  radius = 2.4,
  arc = 0.72,
  height = 0.66,
  segsX = 48,
  segsY = 1,
  isBackFace = false
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const numVertices = (segsX + 1) * (segsY + 1);
  const positions = new Float32Array(numVertices * 3);
  const normals = new Float32Array(numVertices * 3);
  const uvs = new Float32Array(numVertices * 2);

  let vIdx = 0;
  let uvIdx = 0;

  for (let y = 0; y <= segsY; y++) {
    const v = y / segsY;
    const posY = (v - 0.5) * height;

    for (let x = 0; x <= segsX; x++) {
      const u = x / segsX;
      const theta = (u - 0.5) * arc;

      const posX = radius * Math.sin(theta);
      const posZ = radius * (1.0 - Math.cos(theta));

      positions[vIdx * 3 + 0] = posX;
      positions[vIdx * 3 + 1] = posY;
      positions[vIdx * 3 + 2] = posZ;

      if (!isBackFace) {
        normals[vIdx * 3 + 0] = -Math.sin(theta);
        normals[vIdx * 3 + 1] = 0;
        normals[vIdx * 3 + 2] = Math.cos(theta);
      } else {
        normals[vIdx * 3 + 0] = Math.sin(theta);
        normals[vIdx * 3 + 1] = 0;
        normals[vIdx * 3 + 2] = -Math.cos(theta);
      }

      uvs[uvIdx * 2 + 0] = u;
      uvs[uvIdx * 2 + 1] = v;

      vIdx++;
      uvIdx++;
    }
  }

  const indices: number[] = [];
  for (let y = 0; y < segsY; y++) {
    for (let x = 0; x < segsX; x++) {
      const a = y * (segsX + 1) + x;
      const b = y * (segsX + 1) + (x + 1);
      const c = (y + 1) * (segsX + 1) + x;
      const d = (y + 1) * (segsX + 1) + (x + 1);

      if (!isBackFace) {
        indices.push(a, b, d);
        indices.push(a, d, c);
      } else {
        indices.push(a, d, b);
        indices.push(a, c, d);
      }
    }
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setIndex(indices);

  return geom;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(/\s+/);
  let line = '';
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(`${line.slice(0, Math.max(0, line.length - 3))}...`, x, y);
        return;
      }
      ctx.fillText(line, x, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
  }
}

/**
 * Aspect-aware procedural fallback CanvasTextures for Studio Wall Frames:
 * - Left Wall (9:16 portrait): 720 x 1280
 * - Back Wall (16:9 landscape): 1280 x 720
 */
export function createWallFrameTexture(frame: StudioFrameData): THREE.CanvasTexture {
  const isPortrait = frame.aspectRatio === '9:16';
  const width = isPortrait ? 720 : 1280;
  const height = isPortrait ? 1280 : 720;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Deep matte canvas background
  ctx.fillStyle = '#0f1117';
  ctx.fillRect(0, 0, width, height);

  // Subtle architectural grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const gridStep = isPortrait ? 48 : 64;
  for (let x = 0; x < width; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Ambient glow
  const rad = ctx.createRadialGradient(width / 2, height * 0.4, 30, width / 2, height * 0.4, width * 0.65);
  rad.addColorStop(0, `${frame.accentColor}24`);
  rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, width, height);

  const pad = isPortrait ? 40 : 48;

  // Header band
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.fillRect(pad, pad, width - pad * 2, 56);

  ctx.font = '800 20px monospace';
  ctx.fillStyle = frame.accentColor;
  ctx.fillText(frame.index, pad + 18, pad + 35);

  ctx.font = '600 15px monospace';
  ctx.fillStyle = '#8e95a2';
  ctx.textAlign = 'right';
  ctx.fillText(`${frame.aspectRatio} · ${frame.category.toUpperCase()}`, width - pad - 18, pad + 35);
  ctx.textAlign = 'left';

  // Center artwork showcase zone
  const artY = pad + 80;
  const artH = isPortrait ? 680 : 340;
  ctx.fillStyle = '#141621';
  ctx.fillRect(pad, artY, width - pad * 2, artH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(pad, artY, width - pad * 2, artH);

  // Geometric centerpiece scaled to portrait or landscape
  const cx = width / 2;
  const cy = artY + artH / 2;
  const ringR = isPortrait ? 150 : 105;

  ctx.strokeStyle = frame.accentColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, ringR * 0.72, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12;
    ctx.strokeStyle = i % 3 === 0 ? frame.accentColor : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (ringR + 14), cy + Math.sin(a) * (ringR + 14));
    ctx.lineTo(cx + Math.cos(a) * (ringR + 34), cy + Math.sin(a) * (ringR + 34));
    ctx.stroke();
  }

  ctx.fillStyle = '#f2efe8';
  ctx.font = `900 ${isPortrait ? 46 : 38}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(frame.primaryMetric.toUpperCase().slice(0, 22), cx, cy + 12);

  ctx.fillStyle = '#8e95a2';
  ctx.font = '600 16px monospace';
  ctx.fillText(frame.subtitle.toUpperCase().slice(0, 34), cx, cy + 52);
  ctx.textAlign = 'left';

  // Footer text block
  const footerY = artY + artH + 28;
  ctx.fillStyle = frame.accentColor;
  ctx.fillRect(pad, footerY, 84, 4);

  ctx.fillStyle = '#f2efe8';
  ctx.font = `800 ${isPortrait ? 38 : 34}px sans-serif`;
  wrapCanvasText(ctx, frame.title, pad, footerY + 52, width - pad * 2, 46, isPortrait ? 2 : 1);

  ctx.fillStyle = '#8e95a2';
  ctx.font = `400 ${isPortrait ? 22 : 18}px sans-serif`;
  wrapCanvasText(
    ctx,
    frame.description,
    pad,
    footerY + (isPortrait ? 148 : 96),
    width - pad * 2,
    isPortrait ? 32 : 26,
    isPortrait ? 3 : 2
  );

  // Tags strip at bottom
  let tagX = pad;
  const tagY = height - pad - 36;
  frame.tags.slice(0, 4).forEach((t) => {
    ctx.font = '600 14px monospace';
    const tagW = ctx.measureText(t).width + 24;
    if (tagX + tagW > width - pad) return;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(tagX, tagY, tagW, 32);
    ctx.fillStyle = '#e2dfd6';
    ctx.fillText(t, tagX + 12, tagY + 21);
    tagX += tagW + 10;
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

/**
 * Loads an external R2 image URL with CORS enabled and center-crops it (`object-fit: cover`)
 * onto a high-res offscreen canvas matching the exact 9:16 or 16:9 frame ratio.
 * Returns a cancellation callback so unmounted effects never update disposed meshes.
 */
export function loadCoverFitFrameTexture(
  imageUrl: string,
  aspectRatio: StudioFrameAspect,
  maxAnisotropy: number,
  onLoad: (texture: THREE.CanvasTexture) => void,
  onError?: () => void
): () => void {
  let cancelled = false;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.decoding = 'async';

  img.onload = () => {
    if (cancelled) return;
    const targetW = aspectRatio === '9:16' ? 1080 : 1920;
    const targetH = aspectRatio === '9:16' ? 1920 : 1080;

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const crop = computeCoverCropRect(img.naturalWidth, img.naturalHeight, targetW, targetH);
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, targetW, targetH);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = Math.min(8, maxAnisotropy);
    texture.needsUpdate = true;

    onLoad(texture);
  };

  img.onerror = () => {
    if (!cancelled && onError) onError();
  };

  img.src = imageUrl;

  return () => {
    cancelled = true;
    img.onload = null;
    img.onerror = null;
  };
}
