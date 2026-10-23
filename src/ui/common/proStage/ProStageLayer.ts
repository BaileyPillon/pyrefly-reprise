/**
 * THE PRO STAGING LAYER (lane "pro-staging"; the switch, the pieces and the game case are in `engine/pro/staging/StagingSwitch.ts`). The DOM half of the `StagingPort` the presenter talks to: it is mounted once
 * in the battle screen's root, only while the staging is on in a demo chapter, draws the held breath of a boss's big blow (`BreathView.ts`), and (the other pieces, `EndingView.ts`, `OpeningView.ts`) the
 * victory freeze, the defeat card that keeps the scene and the openings.
 *
 * It runs on the BATTLE SCREEN's own `update(dt)`, not on a timer of its own: that is only called while the battle is on top, so the pause screen freezes every layer here with the field (a pause must not
 * burn a staged move's seconds), while a hit-stop (which holds the field's clock, never this one) lets the flash and the ring read during the stop.
 *
 * Nothing here blocks the presenter and nothing here throws into it: every cue is wrapped, a layer that cannot draw costs the picture and never the fight.
 */
import './proStage.css';
import { breathExpired, breathFrame, MENU_EASE_MS, tellLength, type BreathMarks, type Rect } from '../../../engine/pro/staging/BreathPlan.ts';
import type { BreathCue, EndingCue, OpeningCue, StagingPort } from '../../../engine/pro/staging/StagingPort.ts';
import type { DemoGame } from '../../../engine/motion/DemoGate.ts';
import { LookTuning } from './LookTuning.ts';
import type { OdFrame } from '../../../engine/pro/staging/OpeningPlan.ts';
import { BreathView, type BreathGeom } from './BreathView.ts';
import { EndingView } from './EndingView.ts';
import { OpeningView } from './OpeningView.ts';

export interface ProStageOptions {
  /** The battle screen's root (the layer is its first child, the top layer a late child). */
  root: HTMLElement;
  game: DemoGame;
  /** A combatant's rectangle on screen, CSS pixels in the root's frame (`PaintedStage.projectRect`). */
  rectOf(id: string): Rect | null;
  /** A combatant's display name (the engine's), for the title and the openings. */
  nameOf?(id: string): string | undefined;
  /** A point on a combatant, CSS pixels (`BattleStage.project`). */
  pointOf(id: string, anchor: 'head' | 'chest' | 'feet'): { x: number; y: number } | null;
}

export class ProStageLayer implements StagingPort {
  /** Under the HUD (z 0) and over it (z 30). */
  readonly under: HTMLElement;
  readonly top: HTMLElement;
  private readonly breathView: BreathView;
  private readonly endingView: EndingView;
  private readonly openingView: OpeningView;
  private clock = 0;
  /** Captures only: the clock is held (`scrubBreath`). */
  private frozen = false;
  private marks: BreathMarks | null = null;
  private subject: { attacker: string; party: readonly string[]; move: string } | null = null;
  private drift = true;
  private disposed = false;
  private readonly look: LookTuning;
  private readonly geoms = new Map<'breath' | 'opening', { at: number; geom: BreathGeom }>();
  private odDrawn = false;
  /** FFX-2 (D-357): is a command menu open right now? Asked each frame; `menuHold` eases toward it so the wash, the HUD sink, the flood and the flash step aside for the menu and come back after it. */
  private menuProbe: (() => boolean) | null = null;
  private menuHold = 0;
  private lastClock = 0;
  /** For checks and the debug API: what the last frame drew. */
  readonly stats = { frames: 0, cues: 0, drawn: 0, updateMs: 0, updateMaxMs: 0, lastFrame: null as ReturnType<typeof breathFrame> | null };

  constructor(private readonly o: ProStageOptions) {
    const doc = o.root.ownerDocument;
    this.look = new LookTuning(o.game);
    this.under = doc.createElement('div');
    this.under.className = 'pst';
    this.under.dataset['game'] = o.game;
    this.under.setAttribute('aria-hidden', 'true'); // pictures only: the words that matter (the HUD's, the defeat card's) are the screen's own
    this.top = doc.createElement('div');
    this.top.className = 'pst-top';
    this.top.dataset['game'] = o.game;
    this.top.setAttribute('aria-hidden', 'true');
    o.root.prepend(this.under);
    o.root.appendChild(this.top);
    this.breathView = new BreathView(this.under);
    this.endingView = new EndingView(this.top, o);
    this.openingView = new OpeningView(this.top, o);
  }

  // ------------------------------------------------------------------ the port

  breath(cue: BreathCue): void {
    if (this.disposed) return;
    this.stats.cues++;
    try {
      this.drift = !cue.calm;
      if (cue.kind === 'lift') {
        if (this.marks && this.marks.liftAt === null) this.marks.liftAt = this.clock;
        return;
      }
      if (cue.kind === 'mark') {
        this.marks = { markAt: this.clock, tellAt: null, tellMs: 1000, blowAt: null, liftAt: null, game: cue.game, flood: cue.move === 'mega-flare', tame: cue.tame };
        this.subject = { attacker: cue.attacker, party: cue.party, move: cue.move };
        this.breathView.setName(cue.name);
        this.look.arm(cue.move, true, 'mark');
        return;
      }
      if (cue.kind === 'tell') {
        if (!this.marks || this.marks.liftAt !== null || this.marks.blowAt !== null) {
          this.marks = { markAt: this.clock, tellAt: null, tellMs: 1000, blowAt: null, liftAt: null, game: cue.game, flood: cue.move === 'mega-flare', tame: cue.tame };
          this.breathView.setName(cue.name);
        }
        this.subject = { attacker: cue.attacker, party: cue.party, move: cue.move };
        this.marks.tellAt = this.clock;
        this.marks.tellMs = tellLength(cue.msToBlow);
        this.marks.tame = cue.tame;
        if (cue.menu === true) this.menuHold = 1; // a menu already open as the tell begins: the wash never starts
        this.marks.calm = cue.calm;
        this.look.arm(cue.move, true, 'tell');
        this.root().dataset['pst'] = '';
        return;
      }
      if (cue.kind === 'blow' && this.marks) {
        if (this.marks.tellAt === null) {
          // the blow came with no lead-in told (a move whose effect had begun already): the tell is a beat of its own, ending now
          this.marks.tellAt = this.clock - 400;
          this.marks.tellMs = 400;
        }
        this.marks.blowAt = this.clock;
        this.root().dataset['pst'] = '';
      }
    } catch (e) {
      console.warn('[pro-staging] breath cue failed', e);
    }
  }

  ending(cue: EndingCue): void {
    if (this.disposed) return;
    this.stats.cues++;
    try {
      this.endingView.cue(cue);
    } catch (e) {
      console.warn('[pro-staging] ending cue failed', e);
    }
  }

  opening(cue: OpeningCue): void {
    if (this.disposed) return;
    this.stats.cues++;
    try {
      this.openingView.cue(cue);
    } catch (e) {
      console.warn('[pro-staging] opening cue failed', e);
    }
  }

  clear(): void {
    this.marks = null;
    this.subject = null;
    this.menuProbe = null;
    this.menuHold = 0;
    this.look.arm('mega-flare', false);
    this.settle();
    this.breathView.reset();
    this.endingView.clear();
    this.openingView.clear();
  }

  // ------------------------------------------------------------------- the clock

  /** One frame of the BATTLE SCREEN's clock (`dt` seconds, the real frame time: a hit-stop does not hold it). */
  update(dt: number): void {
    if (this.disposed) return;
    const t0 = performance.now();
    this.step(dt);
    const ms = performance.now() - t0;
    this.stats.updateMs = this.stats.updateMs * 0.9 + ms * 0.1; // the layer's own CPU cost per frame (an average over the last ten), for the cost report
    this.stats.updateMaxMs = Math.max(this.stats.updateMaxMs * 0.995, ms);
  }

  private step(dt: number): void {
    if (!this.frozen) this.clock += Math.max(0, dt) * 1000;
    this.stats.frames++;
    const dMs = Math.max(0, this.clock - this.lastClock);
    this.lastClock = this.clock;
    const menuOpen = this.menuProbe !== null && this.safeMenu();
    this.menuHold = Math.min(1, Math.max(0, this.menuHold + (menuOpen ? dMs : -dMs) / MENU_EASE_MS));
    this.endingView.update(this.clock);
    this.openingView.update(this.clock);
    const m = this.marks;
    let hud = this.endingView.hud;
    if (m && breathExpired(this.clock, m)) {
      this.marks = null;
      this.subject = null;
      this.look.arm('mega-flare', false);
      this.breathView.reset();
    } else if (m) {
      const f = breathFrame(this.clock, m, this.menuHold);
      this.stats.lastFrame = f;
      this.breathView.draw(f, this.readGeom(), this.o.game, this.drift, { tame: m.tame });
      hud = Math.min(hud, f.hud);
      if (!f.alive) {
        this.marks = null;
        this.look.arm('mega-flare', false);
        this.breathView.reset();
      }
    }
    // an Overdrive's opening (FFX): the same wash and windows, lighter, around the lit caster (never while a held breath is telling: a marker that only waits for its move, name and ring, leaves the canvas free)
    const od = this.openingView.frame;
    if (od?.alive && (this.marks === null || this.marks.tellAt === null)) {
      const actor = this.openingView.actorId;
      if (actor) {
        this.breathView.draw(odToBreath(od), this.readGeom({ attacker: actor, party: [], companions: [] }), this.o.game, false, { tame: this.openingView.tame, mark: false });
        hud = Math.min(hud, 1 - (1 - 1 / 6) * od.light);
        this.odDrawn = true;
      }
    } else if (this.odDrawn) {
      this.odDrawn = false;
      if (this.marks === null) this.breathView.reset();
      else this.breathView.clearLight(); // a marker waits: keep its name and ring, give the canvas back
    }
    // the HUD's sink: the pieces ask for it, the lowest strength wins; with none the HUD is left to its own opacity
    if (hud < 0.999) {
      const r = this.root();
      r.dataset['pst'] = '';
      r.style.setProperty('--pst-hud', hud.toFixed(3));
    } else if (this.marks === null || this.marks.tellAt === null) {
      this.settle(); // nothing wants the HUD sunk (a marker that only waits for its turn does not): give it back, never leave a stale partial value on it
    } else if (this.root().dataset['pst'] !== undefined) {
      this.root().style.setProperty('--pst-hud', '1.000'); // a tell is running but a menu holds the sink off: the HUD is at full strength, said plainly
    }
  }

  /**
   * Captures only (`__pyrefly.stagingScrub`): pose the held breath at `t` ms into a tell of `tellMs` (a blow at `t >= tellMs`, a lift `lift` ms ago) and HOLD the layer's clock there, so a frame is the same every time.
   * `release: true` lets the clock run again.
   */
  scrubBreath(o: { game: DemoGame; move: 'total-annihilation' | 'mega-flare'; name: string; attacker: string; party: readonly string[]; companions?: readonly string[]; t: number; tellMs: number; lift?: number; release?: boolean; tame?: boolean }): void {
    this.frozen = o.release !== true;
    const now = this.clock;
    this.companions = o.companions ?? [];
    this.subject = { attacker: o.attacker, party: o.party, move: o.move };
    this.breathView.setName(o.name);
    this.drift = true;
    this.marks = {
      markAt: now - o.t - 2000,
      tellAt: o.t < 0 ? null : now - o.t,
      tellMs: o.tellMs,
      blowAt: o.t >= o.tellMs ? now - (o.t - o.tellMs) : null,
      liftAt: o.lift === undefined ? null : now - o.lift,
      game: o.game,
      flood: o.move === 'mega-flare',
      tame: o.tame === true,
    };
    this.look.arm(o.move, true);
    this.root().dataset['pst'] = '';
    this.geoms.clear();
    this.update(0);
  }

  /** Captures only (`__pyrefly.stagingAdvance`): hold the layer's clock and move it forward exactly `ms` (a recorder's frame step); `release()` lets it run again. */
  advance(ms: number): void {
    this.frozen = true;
    this.clock += Math.max(0, ms);
    this.step(0);
  }

  /** Captures only: let the clock run again after `advance` or `scrubBreath`. */
  release(): void {
    this.frozen = false;
  }

  /** Is a staged move alive (marked, telling, or not yet lifted)? */
  get alive(): boolean {
    return this.marks !== null;
  }

  /** The marks, for the debug API and checks. */
  snapshot(): { marks: BreathMarks | null; clock: number; frame: ReturnType<typeof breathFrame> | null } {
    return { marks: this.marks, clock: Math.round(this.clock), frame: this.stats.lastFrame };
  }

  dispose(): void {
    this.disposed = true;
    this.clear();
    this.breathView.dispose();
    this.endingView.dispose();
    this.openingView.dispose();
    this.under.remove();
    this.top.remove();
  }

  // ------------------------------------------------------------------- helpers

  private root(): HTMLElement {
    return this.o.root;
  }

  /** The rectangles, read every frame or so (a directed camera, `pro-camera`, may be moving during a tell and the pools must stay on the figures; a rect costs one projection each, a few microseconds). */
  private readGeom(over?: { attacker: string; party: readonly string[]; companions: readonly string[] }): BreathGeom {
    const kind = over === undefined ? 'breath' : 'opening';
    const hit = this.geoms.get(kind);
    if (hit && this.clock - hit.at < 12) return hit.geom;
    const s = over ?? this.subject;
    const w = this.under.clientWidth || this.o.root.clientWidth || 1600;
    const h = this.under.clientHeight || this.o.root.clientHeight || 900;
    const attacker = s ? this.o.rectOf(s.attacker) : null;
    const companions: Rect[] = [];
    // Chapter I's Seymour stands on his mount: whoever fights beside the attacker on the foe's side keeps colour too (the screen names them through `party` for the party only; the foe's others are asked here)
    const party: Rect[] = [];
    for (const id of s?.party ?? []) {
      const r = this.o.rectOf(id);
      if (r) party.push(r);
    }
    for (const id of over ? over.companions : this.companionIds()) {
      const r = this.o.rectOf(id);
      if (r) companions.push(r);
    }
    const chest = s ? this.o.pointOf(s.attacker, 'chest') : null;
    const feet = s ? this.o.pointOf(s.attacker, 'feet') : null;
    const geom: BreathGeom = { w, h, attacker, chest, feet, companions, party };
    this.geoms.set(kind, { at: this.clock, geom });
    return geom;
  }

  setMenuProbe(probe: () => boolean): void {
    this.menuProbe = probe;
  }

  private safeMenu(): boolean {
    try {
      return this.menuProbe?.() === true;
    } catch {
      return false; // a probe that throws costs the menu rule's check, never the frame
    }
  }

  /** The foe-side figures that keep their colour with the attacker; set by the presenter's cue (`setCompanions`). */
  private companions: readonly string[] = [];
  setCompanions(ids: readonly string[]): void {
    this.companions = ids;
  }
  private companionIds(): readonly string[] {
    return this.companions;
  }

  /** The HUD comes back to its own opacity. */
  private settle(): void {
    const r = this.root();
    if (r.dataset['pst'] === undefined) return; // idle: nothing to give back, and no write to the DOM on a frame where nothing is staged
    delete r.dataset['pst'];
    r.style.removeProperty('--pst-hud');
  }
}

/** An Overdrive's opening on the held breath's canvas: the arena lightens toward ivory (60 percent of the breath's drain), the caster's chest glows, the strike's pop is the flash. */
function odToBreath(f: OdFrame): ReturnType<typeof breathFrame> {
  return { name: 0, drain: 0.6 * f.light, hud: 1 - (1 - 1 / 6) * f.light, ring: 0, ringScale: 1, inflow: 0, core: 0.65 * f.light, flash: f.flash, flood: 0, alive: f.alive };
}
