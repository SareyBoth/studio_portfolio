import type { StudioFrameAspect, StudioWall } from '@/types/portfolio';

export interface FrameDimensions {
  wall: StudioWall;
  aspectRatio: StudioFrameAspect;
  artWidth: number;
  artHeight: number;
  outerWidth: number;
  outerHeight: number;
  outerDepth: number;
  ledWidth: number;
  ledHeight: number;
  ledDepth: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface FrameSlotPlacement {
  slotIndex: number;
  wall: StudioWall;
  aspectRatio: StudioFrameAspect;
  position: [number, number, number];
  rotationY: number;
  inspectCam: [number, number, number];
  inspectLook: [number, number, number];
  defaultLedColor: string;
}

/**
 * Exact physical dimensions (in Three.js meters) for 9:16 portrait frames (Left Wall)
 * and 16:9 landscape frames (Back Wall), sharing a uniform 5cm matte-black bezel.
 */
export const STUDIO_FRAME_DIMENSIONS: Record<StudioFrameAspect, FrameDimensions> = {
  '9:16': {
    wall: 'left',
    aspectRatio: '9:16',
    artWidth: 0.9,
    artHeight: 1.6, // 0.90 / 1.60 === 0.5625 === 9/16
    outerWidth: 1.0,
    outerHeight: 1.7,
    outerDepth: 0.04,
    ledWidth: 1.02,
    ledHeight: 1.72,
    ledDepth: 0.012,
    canvasWidth: 720,
    canvasHeight: 1280,
  },
  '16:9': {
    wall: 'back',
    aspectRatio: '16:9',
    artWidth: 1.36,
    artHeight: 0.765, // 1.36 / 0.765 === 1.777777... === 16/9
    outerWidth: 1.46,
    outerHeight: 0.865,
    outerDepth: 0.04,
    ledWidth: 1.48,
    ledHeight: 0.885,
    ledDepth: 0.012,
    canvasWidth: 1280,
    canvasHeight: 720,
  },
};

/**
 * 6 aligned studio wall frame slots:
 * - Slots 0, 1, 2: Left Wall (Wood Slats), vertical 9:16 portrait frames
 * - Slots 3, 4, 5: Back Wall (Charcoal, cleanly beneath floating shelf at y=3.65), horizontal 16:9 landscape frames
 */
export const STUDIO_FRAME_PLACEMENTS: readonly FrameSlotPlacement[] = [
  // Left Wall — 3 vertical 9:16 frames
  {
    slotIndex: 0,
    wall: 'left',
    aspectRatio: '9:16',
    position: [-3.76, 2.4, -1.65],
    rotationY: Math.PI / 2,
    inspectCam: [-1.35, 2.4, -1.65],
    inspectLook: [-3.76, 2.4, -1.65],
    defaultLedColor: '#F59E0B',
  },
  {
    slotIndex: 1,
    wall: 'left',
    aspectRatio: '9:16',
    position: [-3.76, 2.4, 0.0],
    rotationY: Math.PI / 2,
    inspectCam: [-1.35, 2.4, 0.0],
    inspectLook: [-3.76, 2.4, 0.0],
    defaultLedColor: '#06B6D4',
  },
  {
    slotIndex: 2,
    wall: 'left',
    aspectRatio: '9:16',
    position: [-3.76, 2.4, 1.65],
    rotationY: Math.PI / 2,
    inspectCam: [-1.35, 2.4, 1.65],
    inspectLook: [-3.76, 2.4, 1.65],
    defaultLedColor: '#F59E0B',
  },
  // Back Wall — 3 horizontal 16:9 frames
  {
    slotIndex: 3,
    wall: 'back',
    aspectRatio: '16:9',
    position: [-1.9, 2.65, -3.76],
    rotationY: 0,
    inspectCam: [-1.9, 2.65, -1.75],
    inspectLook: [-1.9, 2.65, -3.76],
    defaultLedColor: '#06B6D4',
  },
  {
    slotIndex: 4,
    wall: 'back',
    aspectRatio: '16:9',
    position: [0.0, 2.65, -3.76],
    rotationY: 0,
    inspectCam: [0.0, 2.65, -1.75],
    inspectLook: [0.0, 2.65, -3.76],
    defaultLedColor: '#F59E0B',
  },
  {
    slotIndex: 5,
    wall: 'back',
    aspectRatio: '16:9',
    position: [1.9, 2.65, -3.76],
    rotationY: 0,
    inspectCam: [1.9, 2.65, -1.75],
    inspectLook: [1.9, 2.65, -3.76],
    defaultLedColor: '#06B6D4',
  },
] as const;

export interface CoverCropRect {
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
}

/**
 * Computes source rectangle for Canvas drawImage() implementing center `object-fit: cover`
 * so any uploaded image fills a 9:16 or 16:9 frame cleanly without distortion or letterboxing.
 */
export function computeCoverCropRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): CoverCropRect {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    return { sx: 0, sy: 0, sWidth: Math.max(1, sourceWidth), sHeight: Math.max(1, sourceHeight) };
  }

  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  if (sourceRatio > targetRatio) {
    // Source is wider than target -> crop horizontally
    const sWidth = sourceHeight * targetRatio;
    const sx = (sourceWidth - sWidth) / 2;
    return { sx, sy: 0, sWidth, sHeight: sourceHeight };
  }

  // Source is taller than target -> crop vertically
  const sHeight = sourceWidth / targetRatio;
  const sy = (sourceHeight - sHeight) / 2;
  return { sx: 0, sy, sWidth: sourceWidth, sHeight };
}
