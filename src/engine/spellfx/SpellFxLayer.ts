/**
 * The spell effects on the battle field (B1 option B, Bailey 2026-09-26): which
 * effect an action draws, one running copy per target, the frame's draw list,
 * and the GPU batch that puts it on screen after the post chain.
 *
 * Game case: both, two skins (`FxDrawList.bit`, `castMark`). The stage owns one
 * layer and routes `VfxPort.land` and `VfxPort.impact` through it; anything
 * that resolves to `bloom`, and everything at the `low` quality tier, keeps
 * today's `ImpactFlash` bloom.
 *
 * The NEW EFFECTS (motion pass, lane "fx"; `FxSwitch.ts`, off by default): in a demo chapter with them on, a copy started now is FRESH (`RunningFx.fresh`): it runs the spec of `SpellFxFresh.ts`
 * where there is one, its quads take the painted finish, and the frame-time guard thins it when frames get long (`SpellFxFreshLayer.ts`). With the switch off nothing here differs.
 */

import type { WebGLRenderer } from 'three';
import { FxBatch } from './FxBatch.ts';
import { FxDrawList } from './FxDrawList.ts';
import { ensureAtlasExtra } from './FxAtlas.ts';
import { CopySeeds, FreshWatch, StartClock, canTravelFx, configureList, resolveFx, shownFx, specForFx, tagCopy } from './SpellFxFreshLayer.ts';
import type { LandOpts } from './LandOpts.ts';
export type { LandOpts } from './LandOpts.ts';
import { fxChapter, fxNewOn, setFxChapter } from './FxSwitch.ts';
import { FLIGHT_LEAD_MS, FLIGHT_MIN_MS, FlightLayer, type FlightKind, type FlightStats } from './FlightFx.ts'; // SKILL TRAVEL (r38-motion): a spell, skill or shot crossing the field
import { drawnOnStatus, lightKindOf } from './BossFx.ts';
import { groupTarget } from './SpellFxGroup.ts';
import { targetFromRect } from './effects-shared.ts';
import { DEFAULT_FLASH_PARAMS, PEAK_BUDGET, QUALITY_DENSITY, type FlashParams, type FxQuality } from './SpellFxParams.ts';
import { resolveAbilityFx } from './SpellFxLookup.ts';
import type { FxGame, SpellFxId } from './SpellFxRegistry.ts';
import { RunningFx, specOf, type FreshFxId } from './SpellFxTimeline.ts';
import { notifyLand, spellTaps } from '../fx/spellTaps.ts';

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
  /**
   * A blow is about to land in a drawn effect `ms` effect-milliseconds from now (the target's
   * mark). Optional; FF7 alone uses it, for its hit flash, knock-back, cast light, shake and
   * flash frame (`app/screens/battleFf7Fx.ts`).
   */
  onLand?(fx: SpellFxId, target: string, ms: number, o: LandOpts): void;
  /**
   * Where the effects may draw this frame, CSS px relative to the canvas; null = the whole frame. Read every frame.
   * FF7 only: its effects stay under the translucent message window, which stays on top as in FF7 (repair item 10).
   */
  clip?(): { x: number; y: number; w: number; h: number } | null;
  /** The new effects: the weapon a combatant swings (`SparkWeapon.ts`), for the hit sparks; unset or null = the generic hit. */
  weaponOf?(id: string): string | null;
  /** The new effects: the running chapter's id, named to `FxSwitch` while the layer lives (they play in Chapters I and IV only). */
  chapterId?: string;
  /** The new effects: the frame-time guard asks for the 3D scene a little smaller (0.9, then 0.8; 1 gives it back at the end). */
  scaleCut?(factor: number): void;
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
  /** Where a new copy's clock starts (a special that has played this battle skips part of its lead-in). */
  private readonly starts = new StartClock();
  /** CPU milliseconds the last frame's list and upload took, and a running mean. */
  private cpuMs = 0;
  private cpuMean = 0;
  /** Debug: a tier forced by `__pyrefly.trigger('spellfx:quality:<tier>')`; null follows the settings. */
  qualityOverride: FxQuality | null = null;
  /** Debug: flash rules forced by `spellfx:flash:<reduced|default>`, until the setting exists. */
  flashOverride: Readonly<FlashParams> | null = null;

  /** The shots in the air (SKILL TRAVEL), drawn in this layer's batch after the effects. */
  private readonly flights: FlightLayer;
  /** The new effects' frame-time guard (`FxPerfGuard.ts`), fed once per drawn frame from `render`. */
  private readonly watch = new FreshWatch();

  constructor(opts: SpellFxLayerOptions) {
    this.opts = opts;
    if (opts.chapterId !== undefined) setFxChapter(opts.chapterId);
    this.flights = new FlightLayer(opts.game, (id) => opts.rectOf(id));
  }

  /**
   * Would SKILL TRAVEL draw a shot for this ability now (`VfxPort.canTravel`)? Not at the `low` tier (LOW EFFECTS,
   * REDUCE MOTION), not in FF7, and not for a special that draws its own effect (D-233: Spiral Cut, Mega Flare).
   */
  canFly(abilityId: string | undefined, from: string): boolean {
    if (this.quality === 'low' || this.opts.game === 'ff7') return false;
    return canTravelFx(abilityId, this.opts.game, from);
  }

  /**
   * SKILL TRAVEL (`VfxPort.travel`): send a shot from one figure to another. `o.ms` is the longest flight at normal
   * speed; the flight lands `FLIGHT_LEAD_MS` before the effect's first mark when that is sooner (never under the
   * kind's own minimum), so it fits inside the wait the spell already has. The layer's clock already runs at the
   * playback speed's inverse. Draws nothing, and says so (`ms` 0), where `canFly` says no and when a figure is not
   * on the field.
   */
  fly(from: string, to: string, o: { abilityId?: string; kind: FlightKind; ms: number }): { ms: number; landed: Promise<void> } {
    const none = { ms: 0, landed: Promise.resolve() };
    if (!this.canFly(o.abilityId, from) || !this.opts.rectOf(from) || !this.opts.rectOf(to)) return none;
    const fx = shownFx(resolveAbilityFx(o.abilityId, this.opts.game, undefined, false, from));
    const spec = specForFx(fx);
    const mark = spec ? ((spec.marks(this.opts.game)[0] ?? 0) - spec.startAt) * 1000 : 0; // how long the effect itself waits for its first blow
    // An effect with no mark to hide behind (the bare impact bloom: Drain, Demi, Flare) flies the shortest crossing that reads, and adds just that.
    const ms = Math.round(mark > 0 ? Math.max(Math.min(FLIGHT_MIN_MS[o.kind], o.ms), Math.min(o.ms, mark - FLIGHT_LEAD_MS)) : Math.min(FLIGHT_MIN_MS[o.kind], o.ms));
    return { ms, landed: this.flights.launch(from, to, o.kind === 'beam' ? 'dark' : fx, o.kind, ms) };
  }

  /** Debug and the capture script: the shots launched and landed, and when. */
  flightStats(): FlightStats {
    return this.flights.stats();
  }

  get quality(): FxQuality {
    return this.qualityOverride ?? this.opts.quality?.() ?? 'full';
  }

  /** Which effect this action draws here; `bloom` when the tier or the lookup says so. */
  resolve(o: LandOpts): SpellFxId {
    if (this.quality === 'low') return 'bloom';
    return resolveFx(o, this.opts.game);
  }

  /**
   * A blow is about to land on `target`: start its effect if it has none yet
   * for this action, and say how many milliseconds until hit `hitIndex` lands
   * in it. 0 = nothing to wait for (the bloom plays, or the mark has passed).
   */
  land(target: string, o: LandOpts): number {
    const action = o.action ?? -1;
    if (o.deco) return this.decorate(target, o); // a charge, an aura, a dress change: started, never waited for
    for (const [id, a] of this.covered) if (a !== action || id === target) this.covered.delete(id);
    const fx = this.resolve(o);
    if (fx === 'bloom' || (o.status === true && !drawnOnStatus(fx))) return 0; // a status event starts only what no damage event starts
    const spec = specForFx(fx);
    if (!spec) return 0;
    const run = spec.group ? this.landGroup(fx as FreshFxId, target, o, action) : this.landEach(fx as FreshFxId, target, o, action);
    if (!run) return 0;
    if (o.crit) run.bloom = CRIT_BLOOM;
    this.covered.set(target, action);
    this.lastMark.set(`${target}|${action}`, { run, k: o.hitIndex ?? 0 });
    const ms = run.msToMark(o.hitIndex ?? 0);
    notifyLand({ fx: lightKindOf(fx) as SpellFxId, game: this.opts.game, abilityId: o.abilityId, ms, rect: this.opts.rectOf(target), view: this.opts.view() }); // eye-candy A8, and the demo looks' light
    // FF7: the landing is announced when the effect's own clock reaches the mark (`update`), so the hit flash and
    // the numeral land with the drawn strike even when frames run slow (repair item 6). Elsewhere, at once.
    if (this.opts.game === 'ff7' && ms > 0) this.lands.push({ run, k: o.hitIndex ?? 0, fx, target, o });
    else this.opts.onLand?.(fx, target, ms, o);
    return ms;
  }

  private decoSerial = -1000;
  /** Each running copy's own painted-finish seed (stable for the copy's life, `SpellFxFreshLayer.CopySeeds`). */
  private readonly seeds = new CopySeeds();

  /** The new effects' decoration (`LandOpts.deco`): start the copy, under a private action number unless the caller names the action (FFX-2's pre-rolled boss moves; the blows then find the copy); nothing waits for it. */
  private decorate(target: string, o: LandOpts): number {
    const fx = this.resolve(o);
    const spec = fx === 'bloom' ? undefined : specForFx(fx);
    if (!spec) return 0;
    const action = o.action ?? --this.decoSerial;
    if (spec.group) this.landGroup(fx as FreshFxId, target, o, action);
    else this.landEach(fx as FreshFxId, target, o, action);
    return 0;
  }

  /** FF7's landings not yet drawn: fired from `update` when their effect's clock passes the mark. */
  private lands: Array<{ run: RunningFx; k: number; fx: SpellFxId; target: string; o: LandOpts }> = [];

  /** The mark each target's latest blow landed on, by target and action: which running copy and which of its marks (`markIn`). */
  private readonly lastMark = new Map<string, { run: RunningFx; k: number }>();

  /**
   * Milliseconds (effect time) until the drawn effect reaches the mark of the blow last landed on `target` in `action`,
   * by the effect's own frame clock; 0 once it has, or when there is none. SKILL TRAVEL waits on it (every game but FF7,
   * whose `pendingLand` does the same), so a held numeral lands with the drawn strike and not with a wall-clock estimate
   * that a slow frame outruns.
   */
  markIn(target: string, action: number): number {
    const m = this.lastMark.get(`${target}|${action}`);
    const mark = m && !m.run.done ? m.run.spec.marks(this.opts.game)[m.k] : undefined;
    return m && mark !== undefined ? Math.max(0, Math.round((mark - m.run.t) * 1000)) : 0;
  }

  /** Milliseconds (effect time) until the landing on `target` in `action` is drawn; 0 when it has or none waits. */
  pendingLand(target: string, action: number): number {
    const w = this.lands.find((l) => l.target === target && (l.o.action ?? -1) === action);
    return w ? Math.max(1, w.run.msToMark(w.k)) : 0;
  }

  /** Is the new set in force for a copy started now? (Its atlas tiles are drawn here too, in case the switch flipped after `prepare`.) */
  private fresh(): boolean {
    if (fxNewOn()) ensureAtlasExtra();
    return fxNewOn();
  }

  private landEach(fx: FreshFxId, target: string, o: LandOpts, action: number): RunningFx | undefined {
    const fresh = this.fresh();
    const spec = specOf(fx, fresh);
    let run = spec.perHit ? undefined : this.running.find((r) => r.targetId === target && r.action === action && r.id === fx);
    if (run) return run;
    const all = !spec.perHit && o.targets?.includes(target) ? o.targets : [target];
    const onField = all.filter((id) => this.opts.rectOf(id));
    if (!onField.includes(target)) return undefined;
    const dens = QUALITY_DENSITY[this.quality] * Math.min(1, 1.7 / onField.length);
    const startAt = this.starts.startFor(fx, spec);
    const stagger = fresh ? (spec.staggerFor?.(this.opts.game) ?? 0) : 0;
    let n = 0;
    for (const id of onField) {
      if (id !== target && this.running.some((r) => r.targetId === id && r.action === action && r.id === fx)) continue;
      const r = new RunningFx(fx, id, this.opts.game, dens, action, startAt - stagger * n++, fresh);
      tagCopy(r, o, this.opts.weaponOf, this.opts.rectOf);
      this.running.push(r);
      if (id === target) run = r;
    }
    return run;
  }

  /** One copy for the whole action, on the caster, landing on the targets' centre (Mega Flare). */
  private landGroup(fx: FreshFxId, target: string, o: LandOpts, action: number): RunningFx | undefined {
    // One copy per action: a target the action-start did not list (a party-wide
    // spell whose targets resolve in the engine) joins the copy already playing.
    const found = this.running.find((r) => r.action === action && r.id === fx && r.groupIds.length > 0);
    if (found) {
      if (!found.groupIds.includes(target) && this.opts.rectOf(target)) found.groupIds = [...found.groupIds, target];
      return found;
    }
    const group = (o.targets?.includes(target) ? o.targets : [target]).filter((id) => this.opts.rectOf(id));
    if (!group.length) return undefined;
    const fresh = this.fresh();
    const r = new RunningFx(fx, o.sourceId ?? '', this.opts.game, QUALITY_DENSITY[this.quality], action, this.starts.startFor(fx, specOf(fx, fresh)), fresh);
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
  play(id: string, target: string, holdAt?: number, group: readonly string[] = [], variant = ''): boolean {
    if (!specForFx(id as SpellFxId) || !this.opts.rectOf(target)) return false;
    const r = new RunningFx(id as FreshFxId, target, this.opts.game, QUALITY_DENSITY[this.quality === 'low' ? 'full' : this.quality], -2, undefined, this.fresh());
    r.variant = variant;
    if (id === 'hit') tagCopy(r, { sourceId: group[0] }, () => variant || null, this.opts.rectOf); // the first of `group` is the striker: the way the blow goes
    r.groupIds = id === 'hit' ? [] : group.filter((g) => this.opts.rectOf(g));
    if (holdAt !== undefined && Number.isFinite(holdAt)) {
      r.t = holdAt;
      r.held = true;
    }
    this.running.push(r);
    // eye-candy A8: a previewed big effect flares like a landed one (debug trigger only); decoration (the charge, the aura, the dress change) throws no light, as in a real fight
    if (id !== 'gather' && id !== 'odaura' && id !== 'dress') notifyLand({ fx: lightKindOf(id) as SpellFxId, game: this.opts.game, abilityId: undefined, ms: r.msToMark(0), rect: this.opts.rectOf(target), view: this.opts.view() });
    return true;
  }

  clear(): void {
    this.running = [];
    this.lands = [];
    this.covered.clear();
    this.lastMark.clear();
    this.flights.clear();
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
      const rect = r.groupIds.length ? null : this.opts.rectOf(r.targetId);
      const target = r.groupIds.length ? groupTarget(r, (id) => this.opts.rectOf(id), k) : rect ? targetFromRect(rect, k) : null;
      if (target) r.target = target;
    }
    this.running = this.running.filter((r) => !r.done);
    for (const [key, m] of this.lastMark) if (m.run.done) this.lastMark.delete(key);
    this.flights.advance(step);
    if (this.lands.length) {
      const due = this.lands.filter((l) => l.run.done || !this.running.includes(l.run) || l.run.msToMark(l.k) <= 0);
      this.lands = this.lands.filter((l) => !due.includes(l));
      for (const l of due) this.opts.onLand?.(l.fx, l.target, 0, l.o);
    }
  }

  /** This frame's quads, or null when nothing is playing. */
  drawList(): FxDrawList | null {
    const live = this.running.filter((r) => r.target && r.t >= 0);
    if (!live.length && !this.flights.active) return null;
    const flash = this.flashOverride ?? this.opts.flash?.() ?? DEFAULT_FLASH_PARAMS;
    const out = new FxDrawList(this.opts.game, 1, flash);
    const budget = PEAK_BUDGET[this.quality === 'phone' ? 'phone' : 'full'];
    const share = this.watch.guard.share;
    for (const r of live) {
      if (out.count >= budget) break;
      configureList(out, r, share, this.quality === 'phone' ? 0.6 : 1, this.seeds.of(r));
      out.bloomScale = r.bloom;
      out.begin();
      r.spec.draw(out, r.t, r.target!);
    }
    out.plain(QUALITY_DENSITY[this.quality], fxNewOn()); // the shots in flight take the finish too
    out.begin();
    this.flights.draw(out); // SKILL TRAVEL: the shots in the air, over the effects
    if (out.items.length > budget) out.items.length = budget;
    return out;
  }

  /**
   * Build the atlas (about 110 ms of pixel work) and the batch now, at battle
   * load; the first frame drawn after it compiles the shaders. Without this the
   * first spell of a battle hitched by 150 ms (measured, `docs/screenshots/spellfx-b/`).
   */
  prepare(): void {
    if (fxNewOn()) ensureAtlasExtra(); // the painted finish's four tiles, drawn now (about 20 ms) and not mid-fight
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
    this.watch.frame(t0, list !== null && this.running.some((r) => r.fresh && r.t >= 0), this.opts.scaleCut);
    if (!list && !this.batch) return;
    this.batch ??= new FxBatch();
    const view = this.opts.view();
    this.batch.set(list, view.w, view.h);
    const clip = list ? this.opts.clip?.() : null;
    if (clip) {
      renderer.setScissor(clip.x, view.h - clip.y - clip.h, clip.w, clip.h);
      renderer.setScissorTest(true);
    }
    if (list && spellTaps.beforeDraw) spellTaps.beforeDraw(renderer, this.batch, view); // eye-candy A1b: the halo under the quads
    this.batch.render(renderer);
    if (clip) renderer.setScissorTest(false);
    if (list) {
      this.cpuMs = performance.now() - t0;
      this.cpuMean = this.cpuMean ? this.cpuMean * 0.95 + this.cpuMs * 0.05 : this.cpuMs;
    }
  }

  /** For `__pyrefly` and the capture script. */
  snapshot(): { quality: FxQuality; running: Array<{ id: string; target: string; t: number; fresh: boolean; variant: string }>; quads: number; cpuMs: number; cpuMeanMs: number; flights: FlightStats; fx: { new: boolean; guard: ReturnType<FreshWatch['guard']['stats']> } } {
    return {
      fx: { new: fxNewOn(), guard: this.watch.guard.stats() },
      quality: this.quality,
      running: this.running.map((r) => ({ id: r.id, target: r.targetId, t: Math.round(r.t * 1000) / 1000, fresh: r.fresh, variant: r.variant })),
      quads: this.lastCount,
      cpuMs: Math.round(this.cpuMs * 1000) / 1000,
      cpuMeanMs: Math.round(this.cpuMean * 1000) / 1000,
      flights: this.flights.stats(),
    };
  }

  dispose(): void {
    this.watch.end(this.opts.scaleCut); // the scene's size goes back with the battle
    if (this.opts.chapterId !== undefined && fxChapter() === this.opts.chapterId) setFxChapter(undefined);
    this.flights.clear();
    this.running = [];
    this.batch?.dispose();
    this.batch = null;
  }
}

export { groupTarget } from './SpellFxGroup.ts';
