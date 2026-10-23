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
import { breathExpired, breathFrame, leanFraction, tellLength, type BreathMarks, type Rect } from '../../../engine/pro/staging/BreathPlan.ts';
import type { BreathCue, EndingCue, OpeningCue, StagingPort } from '../../../engine/pro/staging/StagingPort.ts';
import type { DemoGame } from '../../../engine/motion/DemoGate.ts';
import { lookState, setLookTweak } from '../../../engine/look/LookState.ts';
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

/** The look's tweaks the held breath turns while a staged move is alive (`engine/look/LookState.setLookTweak`; the previous value comes back with the lift). */
const LOOK_TWEAKS: ReadonlyArray<{ name: string; mark?: number; tell: number; game?: DemoGame; move?: 'mega-flare' }> = [
  { name: 'bold.rim', mark: 1.7, tell: 2.4 }, // the figures' rim light: the boss wears a rim from the wind-up, and the party and the boss are lit by the same light the wash is made of
  { name: 'flare.white', tell: 0, game: 'ffx2', move: 'mega-flare' }, // Mega Flare's engine white-out would cover the party: the flood is this layer's, with a window around them
];

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
  private saved = new Map<string, number | undefined>();
  private rectAt = 0;
  private geom: BreathGeom | null = null;
  private odDrawn = false;
  /** For checks and the debug API: what the last frame drew. */
  readonly stats = { frames: 0, cues: 0, drawn: 0, updateMs: 0, updateMaxMs: 0, lastFrame: null as ReturnType<typeof breathFrame> | null };

  constructor(private readonly o: ProStageOptions) {
    const doc = o.root.ownerDocument;
    this.under = doc.createElement('div');
    this.under.className = 'pst';
    this.under.dataset['game'] = o.game;
    this.top = doc.createElement('div');
    this.top.className = 'pst-top';
    this.top.dataset['game'] = o.game;
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
        this.armLook(cue.move, true, 'mark');
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
        this.marks.menu = cue.menu === true;
        this.armLook(cue.move, true, cue.menu === true ? 'mark' : 'tell'); // a menu open: the rim only, Mega Flare's engine white-out stays as it was
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
    this.armLook('mega-flare', false);
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
    this.endingView.update(this.clock);
    this.openingView.update(this.clock);
    const m = this.marks;
    let hud = this.endingView.hud;
    if (m && breathExpired(this.clock, m)) {
      this.marks = null;
      this.subject = null;
      this.armLook('mega-flare', false);
      this.breathView.reset();
    } else if (m) {
      const f = breathFrame(this.clock, m);
      this.stats.lastFrame = f;
      this.breathView.draw(f, this.readGeom(), this.o.game, this.drift);
      hud = Math.min(hud, f.hud);
      if (!f.alive) {
        this.marks = null;
        this.armLook('mega-flare', false);
        this.breathView.reset();
      }
    }
    // an Overdrive's opening (FFX): the same wash and windows, lighter, around the lit caster (never while a held breath has the canvas)
    const od = this.openingView.frame;
    if (od?.alive && this.marks === null) {
      const actor = this.openingView.actorId;
      if (actor) {
        this.breathView.draw(odToBreath(od), this.readGeom({ attacker: actor, party: [], companions: [] }), this.o.game, false);
        hud = Math.min(hud, 1 - (1 - 1 / 6) * od.light);
        this.odDrawn = true;
      }
    } else if (this.odDrawn) {
      this.odDrawn = false;
      if (this.marks === null) this.breathView.reset();
    }
    // the HUD's sink: the pieces ask for it, the lowest strength wins; with none the HUD is left to its own opacity
    if (hud < 0.999) {
      const r = this.root();
      r.dataset['pst'] = '';
      r.style.setProperty('--pst-hud', hud.toFixed(3));
    } else if (this.marks === null) {
      this.settle();
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
    this.armLook(o.move, true);
    this.root().dataset['pst'] = '';
    this.geom = null;
    this.update(0);
  }

  /** The camera's lean for a tell, as a fraction of the subject distance (the presenter applies it through the camera port). */
  lean(): number {
    return leanFraction(this.o.game);
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

  /** The rectangles this frame, read at 12 Hz (the figures hardly move in a tell, and a rect costs a projection each). */
  private readGeom(over?: { attacker: string; party: readonly string[]; companions: readonly string[] }): BreathGeom {
    const kind = over === undefined ? 'breath' : 'opening';
    if (this.geom && kind === this.geomKey && this.clock - this.rectAt < 80) return this.geom;
    this.rectAt = this.clock;
    this.geomKey = kind;
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
    this.geom = { w, h, attacker, chest, feet, companions, party };
    return this.geom;
  }

  /** The foe-side figures that keep their colour with the attacker; set by the presenter's cue (`setCompanions`). */
  private companions: readonly string[] = [];
  setCompanions(ids: readonly string[]): void {
    this.companions = ids;
  }
  private geomKey: 'breath' | 'opening' = 'breath';
  private companionIds(): readonly string[] {
    return this.companions;
  }

  /** The look's tweaks for the move: on at the tell, back with the lift. */
  private armLook(move: string, on: boolean, stage: 'mark' | 'tell' = 'tell'): void {
    try {
      for (const t of LOOK_TWEAKS) {
        if (on) {
          if (t.game !== undefined && t.game !== this.o.game) continue;
          if (t.move !== undefined && t.move !== move) continue;
          const value = stage === 'mark' ? t.mark : t.tell;
          if (value === undefined) continue;
          if (!this.saved.has(t.name)) this.saved.set(t.name, lookState.tweaks[t.name]);
          setLookTweak(t.name, value);
        } else if (this.saved.has(t.name)) {
          setLookTweak(t.name, this.saved.get(t.name) ?? null);
          this.saved.delete(t.name);
        }
      }
    } catch {
      /* the look is optional: a missing one costs the rim, never the move */
    }
  }

  /** The HUD comes back to its own opacity. */
  private settle(): void {
    const r = this.root();
    delete r.dataset['pst'];
    r.style.removeProperty('--pst-hud');
  }
}

/** An Overdrive's opening on the held breath's canvas: the arena lightens toward ivory (half the breath's drain), the caster's chest glows, the strike's pop is the flash. */
function odToBreath(f: OdFrame): ReturnType<typeof breathFrame> {
  return { name: 0, drain: 0.5 * f.light, hud: 1 - (1 - 1 / 6) * f.light, ring: 0, ringScale: 1, inflow: 0, core: 0.55 * f.light, flash: f.flash, flood: 0, alive: f.alive };
}
