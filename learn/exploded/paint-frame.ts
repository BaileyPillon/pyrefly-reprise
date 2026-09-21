/**
 * The picture itself: one finished battle frame, drawn as eight sheets in a
 * CSS 3D stack (`docs/concepts/atlas/c-scene-exploded/`'s `c1` and `c2`).
 *
 * At `explode` 0 the sheets are coincident and it reads as a single finished
 * frame; by the burst they stand apart in depth, front-lit as glass, and the
 * nearest ones cast the longest shadows. Every position is a number from
 * `./frame.ts`, which copied it from the approved frames — nothing here is
 * derived from a piece's abstract `size` (the defect sites A and B both hit).
 *
 * The three paintings and the two portraits are the **real** files under
 * `public/art/`, fetched through `artUrl`: that tree is gitignored and never
 * imported (AGENTS.md hard rule 8). The HUD is DOM chrome, as it is in the
 * game, and its numbers come from `./engine-run.ts` — a real seed-1 turn.
 */

import { escapeHtml } from '../shared/text.ts';
import { artUrl } from '../shared/urls.ts';
import {
  BACKDROP_ART,
  BOSS,
  DAMAGE_AT,
  IMPACT,
  PARTY,
  PLANES,
  POOL,
  SLASH_PATH,
  SPARK_ORIGIN,
  planeZ,
} from './frame.ts';
import type { PlaneDef } from './frame.ts';
import type { FrameRun } from './engine-run.ts';

/** What the painter hands this module for one repaint. */
export interface FrameContext {
  readonly run: FrameRun;
  readonly gap: number;
  /** True once the sheets have come apart far enough to read as separate glass planes. */
  readonly apart: boolean;
  /** Layer ids whose component is currently shown. */
  readonly visibleLayers: ReadonlySet<string>;
  readonly selectedLayerId: string | null;
}

/** `mulberry32`, the same small PRNG the approved frame seeded its dust with. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Dust inside the light shafts, and drifting pyreflies. Ported from
 * `build.mjs`'s `motes()` with its own seed, so the page draws exactly the
 * scatter the approved frame shows rather than a new one on every load.
 */
function motesSvg(): string {
  const r = rng(20260921);
  let s = '';
  for (let i = 0; i < 90; i += 1) {
    const y = r() * 760;
    const x = 330 + r() * 330 + (y / 760) * (r() - 0.6) * 220;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.8 + r() * 1.8).toFixed(1)}" fill="rgba(255,244,220,${(0.35 + r() * 0.55).toFixed(2)})"/>`;
  }
  // Pyrefly colours: green / white / pink (docs/ENGINE-API.md § Particles).
  const cols = ['190,255,210', '255,255,255', '255,190,225'];
  for (let i = 0; i < 34; i += 1) {
    const x = r() * 1440;
    const y = 120 + r() * 640;
    const c = cols[i % 3] ?? cols[0];
    const rad = 2 + r() * 3;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(rad * 2.6).toFixed(1)}" fill="rgba(${c},0.10)"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rad.toFixed(1)}" fill="rgba(${c},0.85)"/>`;
  }
  return `<svg class="pyc-motes" viewBox="0 0 1440 810">${s}</svg>`;
}

/** The spark burst at the point of impact (`build.mjs`'s `sparks()`, seeded with the damage number). */
function sparksSvg(): string {
  const r = rng(954);
  let s = '';
  for (let i = 0; i < 22; i += 1) {
    const a = r() * Math.PI * 2;
    const d0 = 40 + r() * 50;
    const d1 = d0 + 30 + r() * 110;
    s += `<line x1="${(SPARK_ORIGIN.x + Math.cos(a) * d0).toFixed(0)}" y1="${(SPARK_ORIGIN.y + Math.sin(a) * d0).toFixed(0)}" x2="${(SPARK_ORIGIN.x + Math.cos(a) * d1).toFixed(0)}" y2="${(SPARK_ORIGIN.y + Math.sin(a) * d1).toFixed(0)}" stroke="rgba(255,236,190,${(0.5 + r() * 0.5).toFixed(2)})" stroke-width="${(1.5 + r() * 2.5).toFixed(1)}" stroke-linecap="round"/>`;
  }
  return s;
}

function backdropImg(extra = ''): string {
  return `<img class="pyc-bg${extra}" src="${escapeHtml(artUrl(`${BACKDROP_ART}.png`))}" alt="">`;
}

function billboardHtml(bb: typeof BOSS, extraClass = ''): string {
  return (
    `<div class="pyc-shadow" style="left:${bb.shadow.left}px;top:${bb.shadow.top}px;width:${bb.shadow.width}px"></div>` +
    `<img class="pyc-bb${bb.back === true ? ' pyc-bb--back' : ''}${extraClass}" src="${escapeHtml(artUrl(`${bb.art}.png`))}" alt=""` +
    ` style="left:${bb.left}px;top:${bb.top}px;height:${bb.height}px">`
  );
}

/** The FFX turn list: a portrait tile per forecast turn, the boss as a blood-red glyph (`c.css` `.hud-ctb`). */
function turnListHtml(run: FrameRun): string {
  return `<div class="pyc-ctb">${run.order
    .map((row, i) =>
      row.isParty
        ? `<span class="${i === 0 ? 'pyc-cur' : ''}"><img src="${escapeHtml(artUrl(`portraits/${row.actorId}.png`))}" alt=""></span>`
        : `<span class="pyc-foe">${escapeHtml(row.name.slice(0, 1))}</span>`,
    )
    .join('')}</div>`;
}

function partyStatusHtml(run: FrameRun): string {
  return `<div class="pyc-stats">${run.party
    .map(
      (row) =>
        `<div class="pyc-stat${row.acting ? ' pyc-stat--act' : ''}">` +
        `<span class="pyc-stat__f"><img src="${escapeHtml(artUrl(`portraits/${row.id}.png`))}" alt=""></span>` +
        `<span class="pyc-stat__n">${escapeHtml(row.name)}</span>` +
        `<span class="pyc-stat__v">${row.hp}<small>/${row.maxHp}</small></span>` +
        `<span class="pyc-stat__v pyc-stat__mp">${row.mp}</span>` +
        `<span class="pyc-stat__od"><i style="width:${row.overdrive}%"></i></span></div>`,
    )
    .join('')}</div>`;
}

function hudHtml(run: FrameRun): string {
  return (
    `<div class="pyc-banner"><b>${escapeHtml(run.actorName)}</b><i>${escapeHtml(run.commandLabel)}</i></div>` +
    turnListHtml(run) +
    `<div class="pyc-dmg" style="left:${DAMAGE_AT.left}px;top:${DAMAGE_AT.top}px">${run.damage}</div>` +
    partyStatusHtml(run) +
    `<div class="pyc-grain"></div>`
  );
}

function planeContent(plane: PlaneDef, run: FrameRun): string {
  switch (plane.key) {
    case 'backdrop':
      return backdropImg();
    case 'band-far':
      return backdropImg(' pyc-bg--far');
    case 'band-near':
      return backdropImg(' pyc-bg--near');
    case 'light':
      return `<div class="pyc-shaft pyc-shaft--1"></div><div class="pyc-shaft pyc-shaft--2"></div><div class="pyc-shaft pyc-shaft--3"></div>${motesSvg()}<div class="pyc-grade"></div>`;
    case 'boss':
      return billboardHtml(BOSS, ' pyc-bb--boss');
    case 'party':
      return (
        `<div class="pyc-pool" style="left:${POOL.left}px;top:${POOL.top}px;width:${POOL.width}px"></div>` +
        PARTY.map((bb) => billboardHtml(bb)).join('')
      );
    case 'effects':
      return (
        `<div class="pyc-flash" style="left:${IMPACT.left}px;top:${IMPACT.top}px;width:${IMPACT.size}px;height:${IMPACT.size}px"></div>` +
        `<svg class="pyc-fx" viewBox="0 0 1440 810"><defs>` +
        `<linearGradient id="pyc-arc" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="rgba(160,210,255,0)"/><stop offset=".55" stop-color="rgba(190,225,255,.75)"/><stop offset="1" stop-color="#fff"/></linearGradient>` +
        `<filter id="pyc-soft"><feGaussianBlur stdDeviation="3"/></filter></defs>` +
        `<path d="${SLASH_PATH}" fill="none" stroke="url(#pyc-arc)" stroke-width="26" stroke-linecap="round" filter="url(#pyc-soft)" opacity=".8"/>` +
        `<path d="${SLASH_PATH}" fill="none" stroke="url(#pyc-arc)" stroke-width="7" stroke-linecap="round"/>${sparksSvg()}</svg>`
      );
    case 'hud':
      return hudHtml(run);
    default:
      return '';
  }
}

function planeHtml(plane: PlaneDef, ctx: FrameContext): string {
  const z = planeZ(plane, ctx.gap);
  const selected = ctx.selectedLayerId === plane.layerId;
  const classes = [
    'pyc-pl',
    plane.solid === true ? 'pyc-pl--solid' : '',
    selected ? 'pyc-pl--sel' : '',
  ]
    .filter((c) => c.length > 0)
    .join(' ');
  const mark = plane.side === 'L' ? '<i class="pyc-mk pyc-mk--b"></i>' : '<i class="pyc-mk"></i>';
  const label = plane.label !== undefined ? ` aria-label="${escapeHtml(`${plane.num ?? ''} ${plane.label}`.trim())}"` : '';
  const focusable = plane.label !== undefined ? ' tabindex="0"' : '';
  return (
    `<div class="${classes}" data-plane="${plane.key}" data-piece-id="layer-${plane.layerId}" data-system-id="${plane.layerId}"` +
    `${focusable}${label} style="transform:translateZ(${z}px)">` +
    `<div class="pyc-clip">${planeContent(plane, ctx.run)}</div>${mark}</div>`
  );
}

/** Every visible sheet of the frame, back to front, inside the 1440x810 game-frame box. */
export function paintFrame(ctx: FrameContext): string {
  return PLANES.filter((plane) => ctx.visibleLayers.has(plane.layerId))
    .map((plane) => planeHtml(plane, ctx))
    .join('');
}
