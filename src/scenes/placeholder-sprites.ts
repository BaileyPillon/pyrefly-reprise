/**
 * Procedural stand-in sprites for the demo diorama.
 *
 * These exist only so the engine has something readable to draw before the
 * sprite pipeline lands. They are deliberately crude: flat silhouettes at the
 * real target sizes (48x64 party, 128x160 boss) with a 2-frame idle bob, drawn
 * straight into canvases so they can feed `SpriteActor.fromCanvases` unchanged.
 *
 * Delete this file once `src/sprites/` produces real frames.
 */

export interface PartyPalette {
  /** Main garment colour; what reads as "who is this". */
  main: string;
  /** Secondary trim / sash. */
  accent: string;
  hair: string;
  skin: string;
  /** Trousers / boots. */
  dark: string;
}

const OUTLINE = '#0b0f19';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

/** Add a 1px dark outline around every opaque cluster. */
function addOutline(ctx: CanvasRenderingContext2D, w: number, h: number, color = OUTLINE): void {
  const img = ctx.getImageData(0, 0, w, h);
  const src = img.data;
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = src[i * 4 + 3]! > 8 ? 1 : 0;

  const rgb = hexToRgb(color);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (alpha[i]) continue;
      const near =
        (x > 0 && alpha[i - 1]) ||
        (x < w - 1 && alpha[i + 1]) ||
        (y > 0 && alpha[i - w]) ||
        (y < h - 1 && alpha[i + w]);
      if (!near) continue;
      const o = i * 4;
      src[o] = rgb[0];
      src[o + 1] = rgb[1];
      src[o + 2] = rgb[2];
      src[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Flat shading: darken the left half of a rect a touch so forms read. */
function shadedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  shadow = 'rgba(0,0,0,0.22)',
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = shadow;
  ctx.fillRect(x, y, Math.max(1, Math.round(w * 0.3)), h);
}

/**
 * One 48x64 party silhouette, facing right.
 * @param bob 0 or 1 — the idle frame; frame 1 lifts the upper body by a pixel.
 */
export function drawPartyFrame(pal: PartyPalette, bob: 0 | 1): HTMLCanvasElement {
  const W = 48;
  const H = 64;
  const [canvas, ctx] = makeCanvas(W, H);
  const dy = bob === 0 ? 0 : -1;

  // legs + boots (planted, do not bob)
  shadedRect(ctx, 18, 42, 5, 14, pal.dark);
  shadedRect(ctx, 25, 42, 5, 14, pal.dark);
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(17, 56, 7, 5);
  ctx.fillRect(24, 56, 8, 5);
  ctx.fillStyle = pal.accent;
  ctx.fillRect(17, 59, 7, 2);
  ctx.fillRect(24, 59, 8, 2);

  // torso
  shadedRect(ctx, 17, 24 + dy, 14, 19, pal.main);
  // sash / trim
  ctx.fillStyle = pal.accent;
  ctx.fillRect(17, 38 + dy, 14, 3);
  ctx.fillRect(22, 24 + dy, 3, 14);

  // shoulders
  shadedRect(ctx, 14, 24 + dy, 4, 7, pal.main);
  shadedRect(ctx, 30, 24 + dy, 4, 7, pal.main);

  // arms
  shadedRect(ctx, 31, 29 + dy, 4, 11, pal.skin);
  shadedRect(ctx, 14, 29 + dy, 3, 10, pal.skin);

  // neck + head
  ctx.fillStyle = pal.skin;
  ctx.fillRect(21, 21 + dy, 6, 4);
  shadedRect(ctx, 18, 10 + dy, 12, 12, pal.skin, 'rgba(0,0,0,0.14)');

  // hair: cap plus a few forward spikes
  ctx.fillStyle = pal.hair;
  ctx.fillRect(17, 7 + dy, 14, 6);
  ctx.fillRect(16, 10 + dy, 3, 8);
  ctx.fillRect(29, 10 + dy, 3, 6);
  ctx.fillRect(30, 8 + dy, 4, 3);
  ctx.fillRect(14, 12 + dy, 2, 7);

  // eye, facing right
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(26, 16 + dy, 2, 2);
  ctx.fillRect(22, 16 + dy, 2, 2);

  // a hint of a weapon held in the front hand
  ctx.fillStyle = '#c9d6ea';
  ctx.fillRect(34, 22 + dy, 2, 18);
  ctx.fillStyle = pal.accent;
  ctx.fillRect(33, 38 + dy, 4, 3);

  addOutline(ctx, W, H);
  return canvas;
}

/** Two-frame idle loop for one party member. */
export function makePartyIdle(pal: PartyPalette): HTMLCanvasElement[] {
  return [drawPartyFrame(pal, 0), drawPartyFrame(pal, 1)];
}

export const PARTY_PALETTES: Record<string, PartyPalette> = {
  blue: { main: '#3f6fd6', accent: '#ffd76a', hair: '#f2d98a', skin: '#f0c49b', dark: '#25335c' },
  white: { main: '#c7d4e8', accent: '#c2496e', hair: '#6a4b33', skin: '#e3bc98', dark: '#4e5c76' },
  red: { main: '#b8473f', accent: '#f2c14e', hair: '#2b2b33', skin: '#e2b489', dark: '#3a2a2e' },
};

/**
 * A 128x160 boss silhouette: hulking, robed, with a glowing core and horns.
 * @param breath 0 or 1 — the idle frame; frame 1 swells the torso slightly.
 */
export function drawBossFrame(breath: 0 | 1): HTMLCanvasElement {
  const W = 128;
  const H = 160;
  const [canvas, ctx] = makeCanvas(W, H);
  const s = breath === 0 ? 0 : 1;

  const bodyDark = '#4a3f70';
  const bodyMid = '#6d5da0';
  const bodyLit = '#9584d6';
  const bone = '#cfc7e6';

  // robe skirt (wide trapezoid)
  ctx.fillStyle = bodyDark;
  ctx.beginPath();
  ctx.moveTo(44, 78);
  ctx.lineTo(84, 78);
  ctx.lineTo(102, 152);
  ctx.lineTo(26, 152);
  ctx.closePath();
  ctx.fill();

  // robe folds
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  for (let i = 0; i < 4; i++) {
    const x = 36 + i * 16;
    ctx.fillRect(x, 96, 3, 56);
  }

  // torso
  ctx.fillStyle = bodyMid;
  ctx.fillRect(46, 52 - s, 36, 30 + s);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(46, 52 - s, 11, 30 + s);

  // pauldrons
  ctx.fillStyle = bodyLit;
  ctx.beginPath();
  ctx.moveTo(30, 62);
  ctx.lineTo(50, 50 - s);
  ctx.lineTo(50, 74);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(98, 62);
  ctx.lineTo(78, 50 - s);
  ctx.lineTo(78, 74);
  ctx.closePath();
  ctx.fill();

  // arms
  ctx.fillStyle = bodyDark;
  ctx.fillRect(28, 66, 12, 40);
  ctx.fillRect(88, 66, 12, 40);
  ctx.fillStyle = bone;
  ctx.fillRect(26, 102, 16, 8);
  ctx.fillRect(86, 102, 16, 8);

  // glowing core — this is what the bloom pass is here for
  const core = ctx.createRadialGradient(64, 68, 1, 64, 68, 16);
  core.addColorStop(0, 'rgba(180,255,220,1)');
  core.addColorStop(0.45, 'rgba(90,230,180,0.85)');
  core.addColorStop(1, 'rgba(60,200,150,0)');
  ctx.fillStyle = core;
  ctx.fillRect(48, 52, 32, 32);

  // head + helm
  ctx.fillStyle = bodyLit;
  ctx.fillRect(52, 22 - s, 24, 28);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(52, 22 - s, 8, 28);

  // horns
  ctx.fillStyle = bone;
  ctx.beginPath();
  ctx.moveTo(52, 26 - s);
  ctx.lineTo(30, 2);
  ctx.lineTo(46, 30 - s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(76, 26 - s);
  ctx.lineTo(98, 2);
  ctx.lineTo(82, 30 - s);
  ctx.closePath();
  ctx.fill();

  // eyes
  ctx.fillStyle = '#9cf5cd';
  ctx.fillRect(56, 34 - s, 6, 4);
  ctx.fillRect(68, 34 - s, 6, 4);
  ctx.fillStyle = 'rgba(182,255,217,0.35)';
  ctx.fillRect(54, 32 - s, 10, 8);
  ctx.fillRect(66, 32 - s, 10, 8);

  addOutline(ctx, W, H);
  return canvas;
}

/** Two-frame idle loop for the boss. */
export function makeBossIdle(): HTMLCanvasElement[] {
  return [drawBossFrame(0), drawBossFrame(1)];
}
