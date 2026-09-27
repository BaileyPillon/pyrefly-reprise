/**
 * The spell effects on the battle field (B1 option B, Bailey 2026-09-26): which
 * effect an action draws, one running copy per target, the frame's draw list,
 * and the GPU batch that puts it on screen after the post chain.
 *
 * Game case: both, two skins (`FxDrawList.bit`, `castMark`). The stage owns one
 * layer and routes `VfxPort.land` and `VfxPort.impact` through it; anything
 * that resolves to `bloom`, and everything at the `low` quality tier, keeps
 * today's `ImpactFlash` bloom.
 */

import type { WebGLRenderer } from 'three';
import { FxBatch } from './FxBatch.ts';
import { FxDrawList } from './FxDrawList.ts';
import { targetFromRect, type FxTarget } from './effects-shared.ts';
import { DEFAULT_FLASH_PARAMS, PEAK_BUDGET, QUALITY_DENSITY, type FlashParams, type FxQuality } from './SpellFxParams.ts';
import { resolveAbilityFx } from './SpellFxLookup.ts';
import type { FxGame, SpellFxId } from './SpellFxRegistry.ts';
import { FX_SPECS, RunningFx, type DrawnFxId } from './SpellFxTimeline.ts';

export interface SpellFxLayerOptions {
  game: FxGame;
  /** A combatant's painted rectangle in CSS pixels, relative to the canvas; null when it is not on the field. */
  rectOf(id: string): { x: number; y: number; w: number; h: number } | null;
  /** The canvas's CSS size. */
  view(): { w: number; h: number };
  /** Read every frame, so a settings change applies at once. */
  quality?(): FxQuality;
  /** Read every frame; the REDUCE FLASHES setting will supply these (accessibility batch). */
  flash?(): Readonly<FlashParams>;
  /**
   * How fast the effect clock runs, read every frame: the playback speed's
   * inverse (`SpellFxSpecials.SPEED_RATE`), so a spell lands with its numeral
   * under held fast-forward. Unset = real time.
   */
  rate?(): number;
}

/** What `VfxPort.land` passes down. */
export interface LandOpts {
  abilityId?: string;
  element?: string;
  heal?: boolean;
  hitIndex?: number;
  /** Everyone the action targets, so a multi-target spell starts on all of them at once. */
  targets?: readonly string[];
  /** The presenter's action counter. */
  action?: number;
  /** Whoever cast it: a group effect (Mega Flare) is drawn from them. */
  sourceId?: string;
  /** This hit is a critical: the bloom over the figure is 1.3x, as the impact bloom's was. */
  crit?: boolean;
}

/** The impact bloom's crit size (`BattlePresenterStage.impactAt`), kept where the drawn effect replaces it. */
export const CRIT_BLOOM = 1.3;

export class SpellFxLayer {
  private readonly opts: SpellFxLayerOptions;
  private running: RunningFx[] = [];
  private batch: FxBatch | null = null;
  private warmed = false;
  /** Targets whose next `impact` the effect already covers (no bloom on top). */
  private readonly covered = new Map<string, number>();
  private lastCount = 0;
  /** Effects with a repeat rule that have already played in this battle (`FxSpec.repeatStartAt`). */
  private readonly played = new Set<DrawnFxId>();
  /** CPU milliseconds the last frame's list and upload took, and a running mean. */
  private cpuMs = 0;
  private cpuMean = 0;
  /** Debug: a tier forced by `__pyrefly.trigger('spellfx:quality:<tier>')`; null follows the settings. */
  qualityOverride: FxQuality | null = null;
  /** Debug: flash rules forced by `spellfx:flash:<reduced|default>`, until the setting exists. */
  flashOverride: Readonly<FlashParams> | null = null;

  constructor(opts: SpellFxLayerOptions) {
    this.opts = opts;
  }

  get quality(): FxQuality {
    return this.qualityOverride ?? this.opts.quality?.() ?? 'full';
  }

  /** Which effect this action draws here; `bloom` when the tier or the lookup says so. */
  resolve(o: LandOpts): SpellFxId {
    if (this.quality === 'low') return 'bloom';
    return resolveAbilityFx(o.abilityId, this.opts.game, o.element, o.heal === true);
  }

  /**
   * A blow is about to land on `target`: start its effect if it has none yet
   * for this action, and say how many milliseconds until hit `hitIndex` lands
   * in it. 0 = nothing to wait for (the bloom plays, or the mark has passed).
   */
  land(target: string, o: LandOpts): number {
    const action = o.action ?? -1;
    for (const [id, a] of this.covered) if (a !== action || id === target) this.covered.delete(id);
    const fx = this.resolve(o);
    if (fx === 'bloom') return 0;
    const spec = FX_SPECS[fx];
    const run = spec.group ? this.landGroup(fx, target, o, action) : this.landEach(fx, target, o, action);
    if (!run) return 0;
    if (o.crit) run.bloom = CRIT_BLOOM;
    this.covered.set(target, action);
    return run.msToMark(o.hitIndex ?? 0);
  }

  /** Where a new copy's clock starts: a special that has played this battle skips part of its lead-in. */
  private startFor(fx: DrawnFxId): number {
    const spec = FX_SPECS[fx];
    if (spec.repeatStartAt === undefined) return spec.startAt;
    if (this.played.has(fx)) return spec.repeatStartAt;
    this.played.add(fx);
    return spec.startAt;
  }

  private landEach(fx: DrawnFxId, target: string, o: LandOpts, action: number): RunningFx | undefined {
    const spec = FX_SPECS[fx];
    let run = spec.perHit ? undefined : this.running.find((r) => r.targetId === target && r.action === action && r.id === fx);
    if (run) return run;
    const all = !spec.perHit && o.targets?.includes(target) ? o.targets : [target];
    const onField = all.filter((id) => this.opts.rectOf(id));
    if (!onField.includes(target)) return undefined;
    const dens = QUALITY_DENSITY[this.quality] * Math.min(1, 1.7 / onField.length);
    const startAt = this.startFor(fx);
    for (const id of onField) {
      if (id !== target && this.running.some((r) => r.targetId === id && r.action === action && r.id === fx)) continue;
      const r = new RunningFx(fx, id, this.opts.game, dens, action, startAt);
      this.running.push(r);
      if (id === target) run = r;
    }
    return run;
  }

  /** One copy for the whole action, on the caster, landing on the targets' centre (Mega Flare). */
  private landGroup(fx: DrawnFxId, target: string, o: LandOpts, action: number): RunningFx | undefined {
    // One copy per action: a target the action-start did not list (a party-wide
    // spell whose targets resolve in the engine) joins the copy already playing.
    const found = this.running.find((r) => r.action === action && r.id === fx && r.groupIds.length > 0);
    if (found) {
      if (!found.groupIds.includes(target) && this.opts.rectOf(target)) found.groupIds = [...found.groupIds, target];
      return found;
    }
    const group = (o.targets?.includes(target) ? o.targets : [target]).filter((id) => this.opts.rectOf(id));
    if (!group.length) return undefined;
    const r = new RunningFx(fx, o.sourceId ?? '', this.opts.game, QUALITY_DENSITY[this.quality], action, this.startFor(fx));
    r.groupIds = group;
    this.running.push(r);
    return r;
  }

  /** True when the effect already carries this target's hit, so the bloom should not play over it. */
  covers(target: string): boolean {
    return this.covered.has(target);
  }

  /**
   * Debug and capture: play one effect on a target now, whatever the action,
   * or hold it at local time `holdAt` (seconds) until {@link clear}. A group
   * effect (Mega Flare) takes its targets as `group`, drawn from `target`.
   */
  play(id: string, target: string, holdAt?: number, group: readonly string[] = []): boolean {
    if (!Object.hasOwn(FX_SPECS, id) || !this.opts.rectOf(target)) return false;
    const r = new RunningFx(id as DrawnFxId, target, this.opts.game, QUALITY_DENSITY[this.quality === 'low' ? 'full' : this.quality], -2);
    r.groupIds = group.filter((g) => this.opts.rectOf(g));
    if (holdAt !== undefined && Number.isFinite(holdAt)) {
      r.t = holdAt;
      r.held = true;
    }
    this.running.push(r);
    return true;
  }

  clear(): void {
    this.running = [];
    this.covered.clear();
  }

  private targetOf(id: string, k: number): FxTarget | null {
    const rect = this.opts.rectOf(id);
    return rect ? targetFromRect(rect, k) : null;
  }

  /** The effect clock's rate this frame (the playback speed). */
  private get rate(): number {
    const r = this.opts.rate?.() ?? 1;
    return Number.isFinite(r) && r > 0 ? r : 1;
  }

  /** @param dt seconds */
  update(dt: number): void {
    const view = this.opts.view();
    const k = Math.max(0.45, Math.min(1.5, Math.min(view.w / 1600, view.h / 900)));
    const step = dt * this.rate;
    for (const r of this.running) {
      r.advance(step);
      const target = r.groupIds.length ? groupTarget(r, (id) => this.opts.rectOf(id), k) : this.targetOf(r.targetId, k);
      if (target) r.target = target;
    }
    this.running = this.running.filter((r) => !r.done);
  }

  /** This frame's quads, or null when nothing is playing. */
  drawList(): FxDrawList | null {
    const live = this.running.filter((r) => r.target && r.t >= 0);
    if (!live.length) return null;
    const flash = this.flashOverride ?? this.opts.flash?.() ?? DEFAULT_FLASH_PARAMS;
    const out = new FxDrawList(this.opts.game, 1, flash);
    const budget = PEAK_BUDGET[this.quality === 'phone' ? 'phone' : 'full'];
    for (const r of live) {
      if (out.count >= budget) break;
      out.dens = r.dens;
      out.bloomScale = r.bloom;
      out.begin();
      r.spec.draw(out, r.t, r.target!);
    }
    if (out.items.length > budget) out.items.length = budget;
    return out;
  }

  /**
   * Build the atlas (about 110 ms of pixel work) and the batch now, at battle
   * load; the first frame drawn after it compiles the shaders. Without this the
   * first spell of a battle hitched by 150 ms (measured, `docs/screenshots/spellfx-b/`).
   */
  prepare(): void {
    this.batch ??= new FxBatch();
  }

  /** Build the frame and draw it over the finished frame. Hooked to `Renderer.addOverlay`. */
  render(renderer: WebGLRenderer): void {
    if (this.batch && !this.warmed) {
      this.batch.warm(renderer);
      this.warmed = true;
    }
    const t0 = performance.now();
    const list = this.drawList();
    this.lastCount = list?.count ?? 0;
    if (!list && !this.batch) return;
    this.batch ??= new FxBatch();
    const view = this.opts.view();
    this.batch.set(list, view.w, view.h);
    this.batch.render(renderer);
    if (list) {
      this.cpuMs = performance.now() - t0;
      this.cpuMean = this.cpuMean ? this.cpuMean * 0.95 + this.cpuMs * 0.05 : this.cpuMs;
    }
  }

  /** For `__pyrefly` and the capture script. */
  snapshot(): { quality: FxQuality; running: Array<{ id: string; target: string; t: number }>; quads: number; cpuMs: number; cpuMeanMs: number } {
    return {
      quality: this.quality,
      running: this.running.map((r) => ({ id: r.id, target: r.targetId, t: Math.round(r.t * 1000) / 1000 })),
      quads: this.lastCount,
      cpuMs: Math.round(this.cpuMs * 1000) / 1000,
      cpuMeanMs: Math.round(this.cpuMean * 1000) / 1000,
    };
  }

  dispose(): void {
    this.running = [];
    this.batch?.dispose();
    this.batch = null;
  }
}

type Rect = { x: number; y: number; w: number; h: number };

/**
 * A group effect's frame: the caster's rectangle with the targets' centre as
 * `party` (the middle of their rectangles, three quarters down, the mock's
 * party point). Without the caster on the field it is drawn from above the
 * targets, a boss's height up.
 */
export function groupTarget(r: RunningFx, rectOf: (id: string) => Rect | null, k: number): FxTarget | null {
  const rects = r.groupIds.map(rectOf).filter((x): x is Rect => x !== null);
  if (!rects.length) return null;
  const party = {
    x: rects.reduce((s, q) => s + q.x + q.w / 2, 0) / rects.length,
    y: rects.reduce((s, q) => s + q.y + q.h * 0.75, 0) / rects.length,
  };
  const src = r.targetId ? rectOf(r.targetId) : null;
  const h = 560 * k;
  const from = src ?? { x: party.x - h * 0.375, y: party.y - h * 1.6, w: h * 0.75, h };
  return { ...targetFromRect(from, k), party };
}
