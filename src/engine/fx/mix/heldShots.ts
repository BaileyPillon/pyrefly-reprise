import { Vector3, type PerspectiveCamera } from 'three';
import { measure, type Field } from './clearance.ts';
import { cameraAt, figBox, figOf, subjectId, type Actor, type Box, type Fig, type Pose } from './geometry.ts';
import { battleCanvas, fieldOf, hudPanels } from './hudPanels.ts';
import { closeShot, heroShot } from './masters.ts';
import type { RigWatch } from './rigWatch.ts';

/**
 * The MAX mix (D-316), the two HELD SHOTS (BATTLE SPECTACLE), each a cut to a held shot and a cut back
 * (D-291: no move, no orbit, no roll, no shake; the HUD stays laid out on the master):
 *
 * - OVERDRIVE SHOT (FFX only, EC-1001-07; B's hero shot): while the Overdrive input is up, a
 *   three-quarter shot of the actor at about half the frame height; the cut back when the input ends.
 * - DRESSPHERE SHOT (FFX-2 only, research 6.1): on a spherechange, a held close shot of the girl, at
 *   least 1.6 s and until she is quiet again (at most 3 s); never fired while a girl's menu is open, and
 *   handed back the frame a menu opens (Active ATB: the gauges run, so the player sees the master).
 *
 * Both shots are checked before they are cut to (the judges' must-fix list): the subject whole in the
 * part of the frame the viewport shows (the phone's slice included) and clear of the HUD as laid out
 * (the Overdrive input slab counts); every other figure either whole and clear or wholly out of frame
 * (Yuna under the turn rail, Kimahri under the party panel, Yuna cropped on the phone). Candidates vary
 * the size, the place on screen and the turn; when none passes there is no shot (the master holds).
 * REDUCE MOTION: no held shots (`gates.ts`).
 */

export type ShotKind = 'od' | 'sc';

interface Held {
  kind: ShotKind;
  pose: Pose;
  since: number;
  who: Actor;
}

const OD_INPUT = '.ffx-mg.ffx-mg--open';
const QUIET = new Set(['idle', 'hurt', 'ko', 'critical', 'sleep', 'victory', 'ready', 'defend']);

/**
 * Score a candidate shot: the subject whole and clear of the HUD; every other PARTY member either whole
 * and clear, or wholly out of the shot (VP-1001-26; Yuna under the turn rail, Kimahri under the party
 * panel, Yuna cut at the phone's edge). Enemies may sit at the shot's edges: it is about the actor.
 */
export function shotScore(subject: number, boxes: readonly Box[], f: Field, figs: readonly Fig[] = []): { ok: boolean; score: number } {
  let score = 0;
  let ok = true;
  boxes.forEach((b0, i) => {
    if (i !== subject && figs[i]?.enemy) return;
    // A margin: the painting turns toward the new camera once the shot is up, so its drawn box widens.
    const mx = (b0.r - b0.l) * (i === subject ? 0.1 : 0.05);
    const my = (b0.b - b0.t) * 0.04;
    const b = { l: b0.l - mx, r: b0.r + mx, t: b0.t - my, b: b0.b + my };
    const m = measure(b, f, figs[i]?.mask);
    if (i === subject) {
      const bad = Math.max(0, 0.98 - m.inView) + Math.max(0, m.underHud - 0.04);
      if (bad > 1e-6) ok = false;
      score -= bad * 10;
    } else {
      const whole = Math.max(0, 0.97 - m.inView) + Math.max(0, m.underHud - 0.08);
      const out = Math.max(0, m.inView - 0.03);
      const bad = Math.min(whole, out);
      if (bad > 0.02) ok = false;
      score -= bad * 4;
    }
  });
  return { ok, score };
}

export class HeldShots {
  held: Held | null = null;
  private time = 0;
  private triedInput = false;
  private inputSince = -1;
  /** The best candidate of the last try (checks only). */
  lastTry = '';
  private readonly subjects = new Map<Actor, string>();
  readonly stats = { od: 0, sc: 0, skipped: 0, handBacks: 0, writes: 0, searchMs: 0 };

  constructor(private readonly game: 'ffx' | 'ffx2', private readonly rigs: RigWatch) {}

  /** Every frame, after the rig placed the camera. Returns the shot held this frame, or null (the master). */
  update(dt: number, o: { actors: readonly Actor[]; master: Pose | null; lens: [number, number]; odOn: boolean; scOn: boolean; menu: boolean; ready: boolean }): Held | null {
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
        this.cut('od', hero, o.actors, o.master, o.lens);
      }
    }
    // A menu opening hands a spherechange shot back at once (never a cut while a girl is choosing).
    if (this.held?.kind === 'sc' && (o.menu || !o.scOn)) this.handBack();
    if (this.held?.kind === 'sc') {
      const age = this.time - this.held.since;
      const quiet = QUIET.has(this.held.who.pose ?? 'idle');
      if ((quiet && age >= 1.6) || age >= 3) this.handBack();
    }
    if (!this.held && this.game === 'ffx2' && o.scOn && !o.menu && o.master && o.ready && changed.length) this.cut('sc', changed[0]!, o.actors, o.master, o.lens);
    if (this.held) {
      this.rigs.write(this.held.pose);
      this.stats.writes++;
    }
    return this.held;
  }

  private handBack(): void {
    this.held = null;
    this.stats.handBacks++;
  }

  /** Cut to the best passing framing of `who`, or stay on the master when none passes. */
  private cut(kind: ShotKind, who: Actor, actors: readonly Actor[], master: Pose, lens: [number, number]): void {
    const canvas = battleCanvas();
    if (!canvas) return;
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
    if (subject < 0) return;
    const g = figs[subject]!;
    const aspect = field.W / field.H;
    // The visible slice's centre, in canvas fractions (the phone shows a slice of a wider field).
    const vx = (u: number): number => (field.view.l + u * (field.view.r - field.view.l) - lens[0]) / field.W;
    const vy = (v: number): number => (field.view.t + v * (field.view.b - field.view.t) - lens[1]) / field.H;
    let best: { pose: Pose; score: number; ok: boolean } | null = null;
    // Candidates: the size (about half the frame for the hero, 60 % for the close shot), the place on
    // screen (low in the frame, clear of the input slab and the panels) and, for the hero, the turn.
    // The close shot widens and slides too (a neighbour half in frame, or under the guide card, fails it).
    const fracs = kind === 'od' ? [0.5, 0.45, 0.4, 0.55, 0.6, 0.66, 0.72] : [0.6, 0.52, 0.45, 0.68, 0.4];
    const xs = kind === 'od' ? [0.52, 0.45, 0.6, 0.38, 0.68, 0.3] : [0.5, 0.42, 0.58, 0.35, 0.65];
    const ys = kind === 'od' ? [0.62, 0.68, 0.72, 0.56] : [0.5, 0.45, 0.55, 0.6];
    // The turn toward the actor's face first (B's 28 degrees), then the other side too: a member standing
    // beside the hero swings out of the shot instead of under the party rows.
    const turns = kind === 'od' ? [28, 16, 40, 52, 4, -12, -24] : [0];
    // Tried in order of preference; the first framing that passes is the shot (one search per beat).
    const t0 = performance.now();
    search: for (const turn of turns)
      for (const frac of fracs)
        for (const x of xs)
          for (const y of ys) {
            const pose = kind === 'od' ? heroShot(master, g, who.facing, aspect, frac, [vx(x), vy(y)], turn) : closeShot(master, g, aspect, frac, [vx(x), vy(y)]);
            const cam = cameraAt(pose, aspect);
            const boxes = figs.map((f) => {
              const b = figBox(f, cam, field.W, field.H);
              return { l: b.l + lens[0], r: b.r + lens[0], t: b.t + lens[1], b: b.b + lens[1] };
            });
            const s = shotScore(subject, boxes, field, figs);
            if (!best || s.score > best.score || s.ok) {
              best = { pose, score: s.score, ok: s.ok };
              this.lastTry = `${kind} f${frac} x${x} y${y} t${turn} ` + boxes.map((b, i) => `${figs[i]!.id}:${measure(b, field, figs[i]!.mask).inView.toFixed(2)}/${measure(b, field, figs[i]!.mask).underHud.toFixed(2)}`).join(' ');
            }
            if (s.ok) break search;
          }
    this.stats.searchMs = Math.round((performance.now() - t0) * 10) / 10;
    if (!best?.ok) {
      this.stats.skipped++;
      return;
    }
    this.held = { kind, pose: best.pose, since: this.time, who };
    this.stats[kind]++;
  }

  /** The figures the shot is about (for the depth-of-field band). */
  subjectFigs(): Fig[] {
    return this.held ? [figOf(this.held.who)] : [];
  }
}

/**
 * FFX-2: today's spherechange flourish (`ui/ffx2/SpherechangeFlourish.ts`: the light column, the motes, the
 * ring and the name plate) is anchored once, where the girl stands as the light starts; the close shot cuts in a
 * moment later, so the light and the plate would play over whoever stands there in the shot. While one is up it
 * follows its girl through the camera on screen (in the master that is where it already is). Its own anchors:
 * the head point and the feet, in viewport CSS px (`PaintedStage.project`).
 */
export function followFlourish(actors: readonly Actor[], cam: PerspectiveCamera, canvas: HTMLElement | null): void {
  if (!canvas || typeof document === 'undefined') return;
  const els = document.querySelectorAll<HTMLElement>('.ffx2sf[data-who]');
  if (!els.length) return;
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return;
  cam.updateMatrixWorld();
  const px = (v: Vector3): { x: number; y: number } => {
    v.project(cam);
    return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
  };
  for (const el of els) {
    const a = actors.find((x) => x.name === el.dataset['who']) as (Actor & { headPoint?: (out: Vector3) => unknown }) | undefined;
    if (!a?.headPoint) continue;
    const hv = new Vector3();
    a.headPoint(hv);
    const head = px(hv);
    const feet = px(a.position.clone());
    const scale = parseFloat(el.style.getPropertyValue('--sf-scale')) || 1;
    el.style.setProperty('--sf-x', `${head.x}px`);
    el.style.setProperty('--sf-head', `${head.y}px`);
    el.style.setProperty('--sf-feet', `${feet.y}px`);
    el.style.setProperty('--sf-body', `${Math.max(Math.abs(feet.y - head.y), 24 * scale)}px`);
  }
}

