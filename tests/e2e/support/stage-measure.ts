/**
 * Shared plumbing for the two measuring-stick specs, `hud-collision.spec.ts`
 * (CHK-008) and `enemy-visibility.spec.ts` (CHK-011), promoted from the round
 * scratch harnesses by batch t1-b5 of the thresholds program (2026-09-26).
 *
 * The painted actors are WebGL quads with no DOM box, so every measurement
 * reads them from `window.__pyrefly.targeting()` (`PaintedStage.projectRect`,
 * CSS px in the canvas frame, which fills the viewport), and the HUD panels from
 * the DOM through their own transform (the Ink & Gold skew).
 *
 * **Report, not gate, by default.** These specs are the measuring stick for
 * the visual and interface batches, so a run writes a JSON report per test to
 * `CHK_REPORT_DIR` (default `test-results/chk-measure`) and passes as long as
 * the measurement itself ran. `CHK_STRICT=1` turns the CHECKS.md pass rule
 * into a failing assertion. Both games: shared plumbing (CHK-020).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import type { Page } from '@playwright/test';

import { CHAPTERS } from '../../../src/data/encounters.ts';
import { LOCKED_CHAPTER_IDS } from '../../../src/app/screens/frontend/comingChapters.ts';

import './pyrefly-window.ts';

export const STRICT = process.env['CHK_STRICT'] === '1';
export const REPORT_DIR = process.env['CHK_REPORT_DIR'] ?? join('test-results', 'chk-measure');

/** Every listed chapter (the registry minus the COMING cards), or `CHK_CHAPTERS=a,b`. */
export function listedChapters(): { id: string; game: string }[] {
  const only = (process.env['CHK_CHAPTERS'] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return CHAPTERS.filter((c) => !LOCKED_CHAPTER_IDS.has(c.id))
    .filter((c) => only.length === 0 || only.includes(c.id))
    .map((c) => ({ id: c.id, game: c.game }));
}

export interface Pt {
  x: number;
  y: number;
}
export type Quad = Pt[];

export interface Actor {
  id: string;
  side: string;
  alive: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Fraction not covered by a nearer combatant. */
  visible: number;
  /** Fraction both uncovered and inside the viewport. */
  visibleInFrame: number;
  dim: number;
  occludedBy: string[];
}

/** Boot, mark the coaching seen (it would own the first menu), pin the seed and enter the fight. */
export async function enterBattle(page: Page, chapterId: string, seed = 1): Promise<void> {
  await page.goto('./');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120_000 });
  await page.evaluate(
    ([id, s]) => {
      const api = window.__pyrefly!;
      api.markCoachSeen();
      api.setSeed(s as number);
      void api.gotoChapter(id as never, { skipCutscenes: true, skipPrep: true });
    },
    [chapterId, seed] as const,
  );
  await waitMenu(page, 180_000);
}

export async function waitMenu(page: Page, timeout = 60_000): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => {
        const s = window.__pyrefly!.snapshotState() as { screenState?: { playback?: { awaitingMenu?: boolean } } };
        return s.screenState?.playback?.awaitingMenu === true && document.querySelector('.ig-cmd-stack .ig-cmd') !== null;
      },
      null,
      { timeout },
    );
  } catch {
    return false;
  }
  await settle(page, 30);
  return true;
}

export async function settle(page: Page, frames: number): Promise<void> {
  await page.evaluate(async (n: number) => {
    for (let i = 0; i < n; i++) await window.__pyrefly!.frame();
  }, frames);
}

export const screenName = (page: Page): Promise<string | null> => page.evaluate(() => window.__pyrefly?.screen() ?? null);

/** Staged actors with their side and life, from `targeting()` and the engine state. */
export function readActors(page: Page): Promise<Actor[]> {
  return page.evaluate(() => {
    const t = window.__pyrefly!.targeting();
    const st = window.__pyrefly!.battleState() as unknown as { combatants?: Record<string, { side: string; alive: boolean; hp: number }> } | null;
    const cs = st?.combatants ?? {};
    const out: Actor[] = [];
    for (const [id, r] of Object.entries(t?.rects ?? {})) {
      const c = cs[id];
      out.push({
        id, side: c?.side ?? 'unknown', alive: c ? c.alive !== false && c.hp > 0 : true,
        x: r.x, y: r.y, w: r.w, h: r.h, visible: r.visible, visibleInFrame: r.visibleInFrame, dim: r.dim, occludedBy: [...r.occludedBy],
      });
    }
    return out;
  });
}

/** Links and alive enemy ids: a change means a new form or a new link to measure. */
export function rosterSignature(page: Page): Promise<string> {
  return page.evaluate(() => {
    const s = window.__pyrefly!.snapshotState() as { screenState?: { links?: number } };
    const st = window.__pyrefly!.battleState() as unknown as { combatants?: Record<string, { side: string; alive: boolean; hp: number }> } | null;
    const alive = Object.entries(st?.combatants ?? {})
      .filter(([, c]) => c.side === 'enemy' && c.alive !== false && c.hp > 0)
      .map(([id]) => id)
      .sort();
    return `${s.screenState?.links ?? 1}|${alive.join(',')}`;
  });
}

export function writeReport(name: string, data: unknown): string {
  mkdirSync(REPORT_DIR, { recursive: true });
  const file = join(REPORT_DIR, `${name}.json`);
  writeFileSync(file, `${JSON.stringify(data, null, 1)}\n`);
  return file;
}

/** Overlap area of two axis-aligned boxes. */
export function boxOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * Area of a convex quad clipped to an axis-aligned box (Sutherland-Hodgman),
 * so a skewed Ink & Gold slab is measured as painted, not as its bounding box.
 */
export function quadBoxOverlap(q: Quad, b: { x: number; y: number; w: number; h: number }): number {
  let poly: Pt[] = q.slice();
  const edges: Array<(p: Pt) => number> = [(p) => p.x - b.x, (p) => b.x + b.w - p.x, (p) => p.y - b.y, (p) => b.y + b.h - p.y];
  for (const inside of edges) {
    const next: Pt[] = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]!;
      const r = poly[(i + 1) % poly.length]!;
      const dp = inside(p);
      const dr = inside(r);
      if (dp >= 0) next.push(p);
      if (dp >= 0 !== dr >= 0) {
        const t = dp / (dp - dr);
        next.push({ x: p.x + (r.x - p.x) * t, y: p.y + (r.y - p.y) * t });
      }
    }
    poly = next;
    if (poly.length < 3) return 0;
  }
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const r = poly[(i + 1) % poly.length]!;
    area += p.x * r.y - r.x * p.y;
  }
  return Math.abs(area) / 2;
}
