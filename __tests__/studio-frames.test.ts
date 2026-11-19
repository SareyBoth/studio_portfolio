import { describe, expect, it } from 'vitest';
import {
  computeCoverCropRect,
  STUDIO_FRAME_DIMENSIONS,
  STUDIO_FRAME_PLACEMENTS,
} from '@/lib/frame-math';

describe('3D Studio Room 6-Frame Geometry (3x 9:16 Left Wall + 3x 16:9 Back Wall)', () => {
  it('places 3 vertical 9:16 frames on the left wall and 3 horizontal 16:9 frames on the back wall', () => {
    expect(STUDIO_FRAME_PLACEMENTS).toHaveLength(6);

    const leftWall = STUDIO_FRAME_PLACEMENTS.filter((f) => f.wall === 'left');
    const backWall = STUDIO_FRAME_PLACEMENTS.filter((f) => f.wall === 'back');

    expect(leftWall).toHaveLength(3);
    expect(backWall).toHaveLength(3);

    leftWall.forEach((f) => expect(f.aspectRatio).toBe('9:16'));
    backWall.forEach((f) => expect(f.aspectRatio).toBe('16:9'));
  });

  it('maintains exact 9:16 and 16:9 art plane ratios with uniform 5cm bezel', () => {
    const portrait = STUDIO_FRAME_DIMENSIONS['9:16'];
    const landscape = STUDIO_FRAME_DIMENSIONS['16:9'];

    expect(portrait.artWidth / portrait.artHeight).toBeCloseTo(9 / 16, 6);
    expect(landscape.artWidth / landscape.artHeight).toBeCloseTo(16 / 9, 6);

    expect(portrait.outerWidth - portrait.artWidth).toBeCloseTo(0.1, 6);
    expect(portrait.outerHeight - portrait.artHeight).toBeCloseTo(0.1, 6);
    expect(landscape.outerWidth - landscape.artWidth).toBeCloseTo(0.1, 6);
    expect(landscape.outerHeight - landscape.artHeight).toBeCloseTo(0.1, 6);
  });

  it('keeps back wall frames cleanly below the y=3.65 floating bookshelf and above the monitor', () => {
    const landscape = STUDIO_FRAME_DIMENSIONS['16:9'];
    const backWall = STUDIO_FRAME_PLACEMENTS.filter((f) => f.wall === 'back');

    for (const f of backWall) {
      const topY = f.position[1] + landscape.outerHeight / 2;
      const bottomY = f.position[1] - landscape.outerHeight / 2;
      expect(topY).toBeLessThan(3.5); // Shelf is at y = 3.65
      expect(bottomY).toBeGreaterThan(2.0); // Monitor top is y = 1.87
    }
  });

  it('computes center cover-fit crop rects accurately for mismatched source ratios', () => {
    // 1920x1080 landscape image cropped into 1080x1920 (9:16) portrait frame
    const cropPortrait = computeCoverCropRect(1920, 1080, 1080, 1920);
    expect(cropPortrait.sy).toBe(0);
    expect(cropPortrait.sHeight).toBe(1080);
    expect(cropPortrait.sWidth / cropPortrait.sHeight).toBeCloseTo(9 / 16, 6);
    expect(cropPortrait.sx).toBeCloseTo((1920 - cropPortrait.sWidth) / 2, 4);

    // 1080x1920 portrait image cropped into 1920x1080 (16:9) landscape frame
    const cropLandscape = computeCoverCropRect(1080, 1920, 1920, 1080);
    expect(cropLandscape.sx).toBe(0);
    expect(cropLandscape.sWidth).toBe(1080);
    expect(cropLandscape.sWidth / cropLandscape.sHeight).toBeCloseTo(16 / 9, 6);
    expect(cropLandscape.sy).toBeCloseTo((1920 - cropLandscape.sHeight) / 2, 4);
  });
});
