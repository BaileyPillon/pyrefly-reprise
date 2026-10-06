import { figOf, stillActor, subjectId, type Actor, type Fig, type Pose } from './geometry.ts';
import { battleCanvas, fieldOf, hudPanels } from './hudPanels.ts';
import type { Plate } from './plate.ts';
import { pushAt, searchPush, type PushPlan } from './pushIn.ts';
import { searchShot, shotScore, type ShotKind } from './shotSearch.ts';
import type { RigWatch } from './rigWatch.ts';
import { DECISIONS_KEPT, RETRY_S, stepPending, type Decision, type Gate, type Pending } from './shotPending.ts';

/**
 * The MAX mix (D-316), the two HELD SHOTS (BATTLE SPECTACLE), each a cut to a held shot and a cut back
 * (D-291: no move, no orbit, no roll, no shake; the HUD stays laid out on the master):
 *
 * - OVERDRIVE SHOT (FFX only, EC-1001-07; B's hero shot): while the Overdrive input is up, a
 *   three-quarter shot of the actor at about half the frame height; the cut back when the input ends.
 * - DRESSPHERE SHOT (FFX-2 only, research 6.1): on a spherechange, a held close shot of the girl, at
 *   least 1.6 s and until she is quiet again (at most 3 s); never fired while a girl's menu is open, and
 *   handed back the frame a menu opens. Round 19 (PR-0313, PR-0314): the presenter holds the next decision until the shot
 *   has run its 1.6 s (`holdMs`, `shotHold.ts`: the next menu or enemy action begins right after a burst, so the shot could
 *   not be predicted to hold, it is made to), it is not cut to while anyone else is acting, and it is handed back at the
 *   first action-start of anyone but its subject (an enemy's hit landed inside it with the enemy off camera).
 *
 * D-346 (morning ask 11): where the DRESSPHERE SHOT finds no clean frame, and on the upright phone (where the full shot is closed),
 * a small push-in on the girl from the battle camera plays instead (`pushIn.ts`), holding the same minimum and handed back the same ways.
 *
 * Round 21 (PR-0314, stalled over three reviews; FFX-2 only): the shot was decided on one frame, so any closed gate on it was final and
 * untraced. A change now WAITS up to 0.6 s for a clean moment (1.0 s while an enemy's action in flight holds it, B3; `shotPending.ts`), starts at the change's first frame (`HeldIn.begun`,
 * from the twirl slot) instead of after the new outfit has loaded, and every outcome is recorded with its gate (`decisions`). The rules
 * (no menu, nobody else acting, the strict framing) are as they were.
 *
 * Both shots are checked before they are cut to (the judges' must-fix list): the subject whole in the
 * part of the frame the viewport shows (the phone's slice included) and clear of the HUD as laid out
 * (the Overdrive input slab counts); every other figure either whole and clear or wholly out of frame
 * (Yuna under the turn rail, Kimahri under the party panel, Yuna cropped on the phone). Candidates vary
 * the size, the place on screen and the turn; when none passes there is no shot (the master holds).
 * REDUCE MOTION keeps both (`gates.ts`, the approved page's `ON · CUT`): a held shot is already one static cut to the
 * shot and one cut back, never a move, a zoom or a drift (`MaxMix` also holds the lens shift for as long as it is up),
 * held for its normal length, and an FFX-2 shot still never opens, and never stays, while a girl's menu is open.
 */

export type { ShotKind } from './shotSearch.ts';
export { shotScore } from './shotSearch.ts';

interface Held {
  kind: ShotKind;
  pose: Pose;
  since: number;
  who: Actor;
  /** A push-in fallback (`pushIn.ts`): the pose is moved along it each frame; absent for the cuts. */
  push?: PushPlan;
  /** The canvas's place when the push began; a push is handed back if the slice moves under it (the phone's HUD slides). */
  canvasKey?: string;
}

const OD_INPUT = '.ffx-mg.ffx-mg--open';
const QUIET = new Set(['idle', 'hurt', 'ko', 'critical', 'sleep', 'victory', 'ready', 'defend']);

/** What the mix hands the shots each frame. */
export interface HeldIn {
  actors: readonly Actor[];
  master: Pose | null;
  lens: [number, number];
  odOn: boolean;
  /** DRESSPHERE SHOT plays (its switches; on a phone too, where only the push-in fallback is used). */
  scOn: boolean;
  menu: boolean;
  ready: boolean;
  /** The upright phone: a slice the HUD slides, so the full shot is closed and the push-in fallback is the only dressphere shot (`pushIn.ts`). */
  phone?: boolean;
  /** REDUCE MOTION: a push-in is one static cut to its end framing. */
  rm?: boolean;
  /** The painted plate, for the push-in's edge gate; read only when a push-in is searched for. */
  plate?: () => Plate | null;
  /** Round 21: a change is still loading or its twirl keys are playing: a held dressphere shot is not handed back for quiet while it is (at most 3 s). */
  twirling?: boolean;
  /** Round 21: party figures whose dressphere change began this frame (the twirl slot saw their outfit start to load), so the shot need not wait for the load. */
  begun?: readonly Actor[];
}

/** Where the canvas sits (viewport px): a push-in framed for one slice is handed back when the slice moves. */
function canvasKey(): string {
  const r = battleCanvas()?.getBoundingClientRect();
  return r ? `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}` : '';
}

export class HeldShots {
  held: Held | null = null;
  private time = 0;
  private triedInput = false;
  private inputSince = -1;
  /** The best candidate of the last try (checks only). */
  lastTry = '';
  private readonly subjects = new Map<Actor, string>();
  readonly stats = { od: 0, sc: 0, push: 0, slideBacks: 0, skipped: 0, handBacks: 0, actionBacks: 0, writes: 0, searchMs: 0 };
  /** The last {@link DECISIONS_KEPT} outcomes of a dressphere change, newest last (checks only): which gate ended each. */
  readonly decisions: Decision[] = [];
  private pending: Pending<Actor> | null = null;
  /** When each girl's last change was seen (the load-end subject change of a change already started is not a second one). */
  private readonly seen = new Map<Actor, number>();
  /** Seconds a dressphere shot holds at least (D-316). */
  static readonly MIN_HOLD = 1.6;

  constructor(private readonly game: 'ffx' | 'ffx2', private readonly rigs: RigWatch) {}

  /** Every frame, after the rig placed the camera. Returns the shot held this frame, or null (the master). */
  update(dt: number, o: HeldIn): Held | null {
    this.time += dt;
    const party = o.actors.filter((a) => a.facing >= 0 && a.visible);
    // A spherechange: a party figure's painted subject changed this frame.
    const changed: Actor[] = [];
    for (const a of party) {
      const s = subjectId(a);
      const was = this.subjects.get(a);
      if (was && was !== s) changed.push(a);
      this.subjects.set(a, s);
    }
    const h = this.held;
    // FFX: the Overdrive input's hero shot, for as long as the input is up (one try per input: a framing
    // that does not pass leaves the master on screen for that input).
    const input = this.game === 'ffx' && typeof document !== 'undefined' && document.querySelector(OD_INPUT) !== null;
    if (!input) {
      this.triedInput = false;
      this.inputSince = -1;
    } else if (this.inputSince < 0) this.inputSince = this.time;
    // The input slab slides in: the shot is framed once it has landed (0.3 s), against where it sits.
    const settled = input && this.time - this.inputSince >= 0.3;
    if (h?.kind === 'od' && (!input || !o.odOn)) this.handBack();
    else if (!h && settled && !this.triedInput && o.odOn && o.master && o.ready) {
      const hero = party.find((a) => a.lifeState === 'ready') ?? null;
      if (hero) {
        this.triedInput = true;
        this.cut('od', hero, o.actors, o.master, o.lens, o);
      }
    }
    // A menu opening hands a spherechange shot back at once (never a cut while a girl is choosing).
    if (this.held?.kind === 'sc' && (o.menu || !o.scOn)) this.handBack();
    // Anyone but the subject starting an action (a lunge, a cast, a hit in flight) ends the shot: the actor and the target
    // must both be readable (R19-FN-01).
    if (this.held?.kind === 'sc' && this.actingElsewhere(o.actors, this.held.who)) {
      this.stats.actionBacks++;
      this.handBack();
    }
    if (this.held?.kind === 'sc') {
      const age = this.time - this.held.since;
      const quiet = QUIET.has(this.held.who.pose ?? 'idle') && o.twirling !== true;
      if ((quiet && age >= 1.6) || age >= 3) this.handBack();
    }
    // A push-in (the fallback) moves the camera along its plan; a slice that moves under it (the phone's HUD slides) ends it.
    const pi = this.held;
    if (pi?.push) {
      if (canvasKey() !== pi.canvasKey) {
        this.stats.slideBacks++;
        this.handBack();
      } else pi.pose = pushAt(pi.push, this.time - pi.since, o.rm === true);
    }
    if (this.game === 'ffx2') {
      // A change starts waiting for its shot the frame its outfit starts to load (or, with no twirl slot, the frame the new subject lands).
      const first = o.begun?.find((a) => a.visible && a.facing >= 0 && !this.recent(a)) ?? changed.find((a) => !this.recent(a));
      if (first && !this.held) {
        this.pending = { who: first, since: this.time, nextTry: this.time, searches: 0, last: null, foe: false };
        this.seen.set(first, this.time);
      } else if (first) this.seen.set(first, this.time);
      if (this.pending) this.tickPending(o);
    }
    if (this.held) {
      this.rigs.write(this.held.pose);
      this.stats.writes++;
    }
    return this.held;
  }

  /**
   * How many ms of a held dressphere shot are still to run (0 with none up): the presenter waits that long after the burst, so the
   * next menu or enemy action begins after the shot, not inside it (`shotHold.ts`, PR-0313 and PR-0314).
   */
  holdMs(): number {
    const h = this.held;
    return h?.kind === 'sc' ? Math.max(0, (HeldShots.MIN_HOLD - (this.time - h.since)) * 1000) : 0;
  }

  /** Does anyone other than `who` act now (an action's first frames: a lunge, run, cast or strike in flight)? */
  private actingElsewhere(actors: readonly Actor[], who: Actor): boolean {
    return actors.some((a) => a !== who && a.visible && (a.lifeState === 'act' || (a.facing < 0 && !stillActor(a))));
  }

  /** Is an enemy mid-action now (a cast, a lunge, a strike in flight)? B3's longer wait is for these only. */
  private foeActing(actors: readonly Actor[]): boolean {
    return actors.some((a) => a.visible && a.facing < 0 && (a.lifeState === 'act' || !stillActor(a)));
  }

  private handBack(): void {
    this.held = null;
    this.stats.handBacks++;
  }

  /** Cut to the best passing framing of `who`, or stay on the master when none passes. */
  private cut(kind: ShotKind, who: Actor, actors: readonly Actor[], master: Pose, lens: [number, number], o: HeldIn): 'full' | 'push' | 'placeholder' | 'no-frame' {
    const canvas = battleCanvas();
    if (!canvas) return 'no-frame';
    const panels = hudPanels(canvas);
    // The Overdrive input slab itself, as laid out (the hero must stand clear of it: the judges' frame put
    // Tidus's head behind it).
    const slab = kind === 'od' ? document.querySelector<HTMLElement>(OD_INPUT) : null;
    if (slab) {
      const r = slab.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) panels.push({ l: r.left, r: r.right, t: r.top, b: r.bottom });
    }
    const field = fieldOf(canvas, panels);
    const vis = actors.filter((a) => a.visible);
    const figs: Fig[] = vis.map(figOf);
    const subject = vis.indexOf(who);
    if (subject < 0) return 'no-frame';
    // A dressphere with no painting yet (Yuna's Thief is a placeholder mannequin, round 19 PR-0311) is never framed in close-up:
    // the master holds.
    if (kind === 'sc' && who.isPlaceholder === true) return 'placeholder';
    const g = figs[subject]!;
    const aspect = field.W / field.H;
    // The visible slice's centre, in canvas fractions (the phone shows a slice of a wider field).
    const vx = (u: number): number => (field.view.l + u * (field.view.r - field.view.l) - lens[0]) / field.W;
    const vy = (v: number): number => (field.view.t + v * (field.view.b - field.view.t) - lens[1]) / field.H;
    // Tried in order of preference; the first framing that passes is the shot (one search per beat). The upright phone has no full shot (a
    // framing for one slice crops its subject in the next): the push-in fallback only.
    const t0 = performance.now();
    const full = !(kind === 'sc' && o.phone === true);
    const found = full ? searchShot({ kind, master, g, facing: who.facing, aspect, figs, subject, field, lens, at: { x: vx, y: vy }, refine: kind === 'sc' }).best : null;
    const best = found;
    if (found) this.lastTry = `${kind} ${who.name} ${found.note}`;
    // FFX-2: where the full shot found no clean frame, a small push-in on the girl from the battle camera (`pushIn.ts`).
    if (kind === 'sc' && !best?.ok) {
      // The change's name plate sits 14 px over the girl's head by design and follows her through the camera (`followFlourish`),
      // so wherever the push puts her it is above her face again: it is not a panel her face can be under.
      const plates = [...document.querySelectorAll<HTMLElement>('.ffx2sf__plate')].map((e) => e.getBoundingClientRect());
      const clear = panels.filter((p) => !plates.some((r) => Math.abs(p.l - r.left) < 3 && Math.abs(p.r - r.right) < 3 && Math.abs(p.t - r.top) < 3 && Math.abs(p.b - r.bottom) < 3));
      const r = searchPush({ master, subject, figs, field: fieldOf(canvas, clear), lens, aspect, plate: o.plate?.() ?? null, rule: shotScore });
      this.lastTry = (full ? `${this.lastTry} | ` : '') + r.note;
      if (r.plan) {
        this.stats.searchMs = Math.round((performance.now() - t0) * 10) / 10;
        this.held = { kind, pose: pushAt(r.plan, 0, o.rm === true), since: this.time, who, push: r.plan, canvasKey: canvasKey() };
        this.stats.push++;
        return 'push';
      }
    }
    this.stats.searchMs = Math.round((performance.now() - t0) * 10) / 10;
    if (!best?.ok) {
      if (kind === 'od') this.stats.skipped++; // a dressphere change counts its own skips (`tickPending`)
      return 'no-frame';
    }
    this.held = { kind, pose: best.pose, since: this.time, who };
    this.stats[kind]++;
    return 'full';
  }

  /** Was this girl's change started within the last 3 s (the twirl slot's start and the load-end subject change are one change)? */
  private recent(a: Actor): boolean {
    return this.time - (this.seen.get(a) ?? -99) < 3;
  }

  /** One frame of a change that is waiting for its shot (`shotPending.ts`). */
  private tickPending(o: HeldIn): void {
    const p = this.pending!;
    if (this.held) {
      this.pending = null; // a shot is already up
      return;
    }
    const acting = this.actingElsewhere(o.actors, p.who);
    const foeActing = acting && this.foeActing(o.actors);
    const step = stepPending(p, { time: this.time, scOn: o.scOn, menu: o.menu, ready: o.ready, master: !!o.master, acting, foeActing });
    if (step.kind === 'wait') {
      p.last = step.gate;
      p.foe = step.gate === 'acting' && foeActing; // B3: an enemy's action in flight gets the longer wait
      return;
    }
    if (step.kind === 'drop') return this.finish('skipped', step.gate);
    p.searches++;
    p.nextTry = this.time + RETRY_S;
    const r = this.cut('sc', p.who, o.actors, o.master!, o.lens, o);
    if (r === 'full' || r === 'push') return this.finish(r, null);
    if (r === 'placeholder') return this.finish('skipped', 'placeholder');
    p.last = 'no-frame';
  }

  /** End a waiting change: record it, count a skip, and say why in `lastTry`. */
  private finish(outcome: Decision['outcome'], gate: Gate | null): void {
    const p = this.pending;
    this.pending = null;
    if (!p) return;
    const WHY: Record<Gate, string> = {
      off: 'the shot is switched off',
      menu: 'a command menu is open',
      'not-ready': 'the framing is not ready',
      acting: 'another actor is acting',
      placeholder: 'placeholder art',
      'no-frame': 'no clean frame',
      expired: 'no clean moment',
    };
    if (outcome === 'skipped') {
      this.stats.skipped++;
      // `lastTry` keeps the framing search's own note for a "no clean frame"; the other gates say what they were.
      if (gate !== 'no-frame') this.lastTry = `sc ${p.who.name} skipped: ${WHY[gate ?? 'expired']}`;
    }
    this.decisions.push({ at: Math.round(this.time * 100) / 100, who: p.who.name, outcome, gate, waitedMs: Math.round((this.time - p.since) * 1000), searches: p.searches, note: this.lastTry.slice(0, 200) });
    if (this.decisions.length > DECISIONS_KEPT) this.decisions.shift();
  }

  /** The figures the shot is about (for the depth-of-field band). */
  subjectFigs(): Fig[] {
    return this.held ? [figOf(this.held.who)] : [];
  }
}
