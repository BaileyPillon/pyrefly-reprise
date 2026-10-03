/**
 * Lady Ginnem's unsent glow on the cutscene stage (presentation plan A-9; FFX only, Chapter IX's post scene,
 * where she stands on stage until Yuna sends her): the same two layers the battle draws
 * (`scenes/cavern-stolen-fayth-glow.ts`), in the DOM. A cool halo plate behind her painting that breathes, and a
 * shell of motes born on the body's edge. Both read the painting's own edge (`engine/fx/unsentGlow.ts`), so they
 * lie on her outline at every window size and follow her drift.
 *
 * It answers to the same switches as the battle's (`engine/fx/unsentGlowPlan.ts`: LIVING PAINTINGS, tiers, REDUCE
 * MOTION, `?fxsub=-glow`); with the look off the painting keeps its baked rim glow and the stage's CSS glow,
 * which is how every unsent already looked. Only a figure whose `CutsceneFigure.aura` is set gets it.
 *
 * Game case: FFX only (Lady Ginnem). The module is plumbing another unsent could ask for; none does, and a
 * FFX-2 unsent would need its own sourced reading first (rule 14).
 */

import { artUrl } from '../../engine/PaintedArt.ts';
import { GLOW_MOTES, loadUnsentArt, type UnsentArt } from '../../engine/fx/unsentGlow.ts';
import { glowPlan, haloLevel, liveGlowSwitches } from '../../engine/fx/unsentGlowPlan.ts';
import { eyeCandy } from '../../engine/fx/EyeCandy.ts';
import { lcg } from '../../engine/fx/unsentOutline.ts';

interface Mote {
  /** Painting pixels. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  /** Painting pixels across. */
  size: number;
  tint: string;
}

const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;

export interface AuraHandle {
  stop(): void;
}

/** Attach the glow to the figure element `el` (which holds the painting at `art`). Returns a handle that stops it. */
export function attachUnsentAura(el: HTMLElement, art: string): AuraHandle {
  const doc = el.ownerDocument;
  let stopped = false;
  let raf = 0;
  const wrap = doc.createElement('div');
  wrap.className = 'cutscene__aura';
  const halo = doc.createElement('canvas');
  halo.className = 'cutscene__aura-halo';
  const motes = doc.createElement('canvas');
  motes.className = 'cutscene__aura-motes';
  wrap.append(halo, motes);
  el.prepend(wrap);

  const handle: AuraHandle = {
    stop(): void {
      stopped = true;
      if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
      wrap.remove();
    },
  };
  if (typeof requestAnimationFrame !== 'function') return handle;

  const rand = lcg(77);
  const live: Mote[] = [];
  let data: UnsentArt | null = null;
  let t = 0;
  let last = 0;
  let carry = 0;
  void loadUnsentArt(artUrl(art)).then((a) => {
    data = a;
    if (a) {
      // The plate covers the painting grown by the margin; the wrapper is the painting's box.
      const mx = (a.margin / a.w) * 100;
      const my = (a.margin / a.h) * 100;
      halo.style.cssText = `left:${-mx}%;top:${-my}%;width:${100 + 2 * mx}%;height:${100 + 2 * my}%`;
      motes.style.cssText = halo.style.cssText;
      halo.width = a.glow.width;
      halo.height = a.glow.height;
      halo.getContext('2d')?.drawImage(a.glow, 0, 0);
    }
  });

  const draw = (now: number): void => {
    if (stopped) return;
    raf = requestAnimationFrame(draw);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (!el.isConnected) return;
    const a = data;
    const sw = liveGlowSwitches();
    const still = sw.reduceMotion || doc.documentElement.hasAttribute('data-reduce-motion');
    const plan = glowPlan({ ...sw, reduceMotion: still });
    const shown = !!a && plan.halo && el.classList.contains('is-on');
    wrap.style.display = shown ? '' : 'none';
    if (!a || !shown) {
      live.length = 0;
      return;
    }
    const step = eyeCandy.frozen ? 0 : dt;
    t += step;
    halo.style.opacity = String(0.5 * haloLevel(t, plan)); // the stage's CSS drop-shadow glow is under it too
    const flip = el.classList.contains('is-flipped');
    halo.style.transform = flip ? 'scaleX(-1)' : '';

    // Size the mote canvas to what it is shown at, so a dot is a dot at every window size.
    const k = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.max(2, Math.round(motes.clientWidth * k));
    const ch = Math.max(2, Math.round(motes.clientHeight * k));
    if (motes.width !== cw || motes.height !== ch) {
      motes.width = cw;
      motes.height = ch;
    }
    const ctx = motes.getContext('2d');
    if (!ctx) return;
    // Painting pixel to mote-canvas pixel (the canvas is the painting grown by the margin).
    const sx = cw / (a.w + 2 * a.margin);
    const sy = ch / (a.h + 2 * a.margin);

    carry += plan.moteRate * step;
    while (carry >= 1) {
      carry -= 1;
      const o = a.outline[Math.floor(rand() * a.outline.length)]!;
      const out = (6 + rand() * 18) * (a.h / 1164);
      live.push({
        x: o.u * a.w,
        y: o.v * a.h,
        vx: o.nx * out,
        vy: o.ny * out - (14 + rand() * 40) * (a.h / 1164),
        age: 0,
        life: 2.4 + rand() * 1.8,
        size: (5 + rand() * 6) * (a.h / 1164),
        tint: hex(GLOW_MOTES[Math.floor(rand() * GLOW_MOTES.length)] ?? 0xffffff),
      });
    }
    ctx.clearRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = live.length - 1; i >= 0; i--) {
      const m = live[i]!;
      m.age += step;
      if (m.age >= m.life) {
        live.splice(i, 1);
        continue;
      }
      m.x += m.vx * step;
      m.y += m.vy * step + Math.sin(m.age * 1.7 + m.x * 0.01) * 3 * step * (a.h / 1164);
      const f = Math.pow(Math.sin((Math.PI * m.age) / m.life), 0.6) * (0.62 + 0.38 * Math.sin(m.age * 4.6 + m.x * 0.03));
      const px = ((flip ? a.w - m.x : m.x) + a.margin) * sx;
      const py = (m.y + a.margin) * sy;
      const r = Math.max(1.2, m.size * sy * 0.9);
      const g = ctx.createRadialGradient(px, py, 0, px, py, r * 2.6);
      g.addColorStop(0, `rgba(255,255,255,${(0.95 * f).toFixed(3)})`);
      g.addColorStop(0.28, hexA(m.tint, 0.55 * f));
      g.addColorStop(1, hexA(m.tint, 0));
      ctx.fillStyle = g;
      ctx.fillRect(px - r * 2.6, py - r * 2.6, r * 5.2, r * 5.2);
    }
    ctx.globalCompositeOperation = 'source-over';
  };
  raf = requestAnimationFrame(draw);
  return handle;
}

function hexA(h: string, a: number): string {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`;
}
