/**
 * A RIG'S SMEAR WINDOW (conference demo, motion pass, lane "core", step 2; `motion/SmearSwitch.ts` has the switch; both games, shared plumbing; no `three` import).
 *
 * A painting set cuts a big pose change inside a smear (`motion/SmearDirector.ts`); a rig has no pose swap to cut, but it has the same problem: a key that changes every part's IMAGE (both demo
 * bosses' keys do) flips them at progress 0.5 of the move, and the cross-fade that hides the flip (`RigFade.ts`, 40 ms for a whole-figure change) shows two figures for a few frames
 * (PR-0478). Under the smear the flip is a CUT (`fadeMs` 0: "a smear frame is meant to snap", `rigTypes.ts` v2.1) and a streak covers it: the window is centred on the flip, on the move's own
 * clock, and the render is the same shader block as the painting set's (the parts share the actor's uniform cells, and a patch carries the streak into each part's own uv, `RigMaterial.ts`).
 * This replaces the port of anim-proto-3's `RigSmear.ts` (a canvas-drawn blurred copy of a part's image): the parts already wear the painted shader, so the blur and the painted streak are
 * the shader's, with no canvas and no extra texture.
 *
 * It logs every window it plans to `SmearLog.ts` (`kind: 'rig'`), where the continuity harness reads it.
 */
import type { ActorSmear, SmearFrame } from '../motion/ActorSmear.ts';
import { applySmear, type SmearCells, type SmearPlane } from '../motion/SmearApply.ts';
import { noteSmear } from '../motion/SmearLog.ts';
import { FLASH_PEAK, rigSmearPlan, type SmearPlan } from '../motion/SmearPlan.ts';
import { smearStyleNow } from '../motion/SmearSwitch.ts';

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const FLASH_COLOUR = 0xfff3d9;

/** What the window needs of the actor: its flash (and whether REDUCE FLASHES is on). */
export interface RigSmearHost {
  flash(colour: number, ms: number, peak: number): void;
  softFlash?: () => boolean;
}

export interface RigSmearBegin {
  name: string;
  from: string;
  to: string;
  /** The share of the figure's mesh area whose image the move changes. */
  share: number;
  /** The key move's length, paced ms. */
  moveMs: number;
  state: ActorSmear;
  worldHeight: number;
}

export class RigSmearWindow {
  private plan: SmearPlan | null = null;
  private moveMs = 0;
  private flashed = false;
  private written = false;
  private readonly frame: SmearFrame = { amount: 0, dirX: 1, dirY: 0, style: 'paint', length: 0 };
  private readonly dir = { x: 1, y: 0 };

  constructor(private readonly host: RigSmearHost) {}

  /** A key move begins (any window before it is over). True when its flip is to be a cut inside a smear; the style is the page's, in a demo chapter only. */
  begin(o: RigSmearBegin): boolean {
    this.end(o.state);
    const style = smearStyleNow();
    if (style === 'off') return false;
    const plan = rigSmearPlan({ from: o.from, to: o.to, share: o.share, frameMs: o.state.frameMs, style });
    if (!plan || !(o.moveMs > 0)) return false;
    const d = o.state.direction(o.worldHeight, this.dir);
    o.state.begin(plan, d.x, d.y);
    this.plan = plan;
    this.moveMs = o.moveMs;
    this.flashed = false;
    noteSmear({ at: now() + 0.5 * o.moveMs - plan.cutMs / 2, actor: o.name, from: o.from, to: o.to, style: plan.style, cutMs: plan.cutMs, overlap: null, anchorDistance: null, speed: 0, strength: plan.strength, flash: plan.flash, kind: 'rig' });
    return true;
  }

  /** The window is over. */
  end(state: ActorSmear): void {
    if (this.plan) state.end();
    this.plan = null;
  }

  get active(): boolean {
    return this.plan !== null;
  }

  /** Every frame: `progress` (0 to 1) of the key move in flight (`busy`), onto the shared cells; `plane` is the idle plane the parts are mapped onto. */
  step(progress: number, busy: boolean, state: ActorSmear, carrierCells: Record<string, { value: unknown }>, idlePlane: unknown): void {
    const cells = carrierCells as unknown as SmearCells;
    const plane = idlePlane as SmearPlane;
    if (this.plan && !busy) this.end(state);
    const plan = this.plan;
    if (!plan) {
      if (this.written) {
        this.frame.amount = 0;
        applySmear(this.frame, [plane], cells, 0);
        this.written = false;
      }
      return;
    }
    const start = 0.5 * this.moveMs - plan.cutMs / 2;
    const u = (progress * this.moveMs - start) / plan.cutMs;
    state.sample(u < 0 || u > 1 ? 0 : u, this.frame);
    if (!this.flashed && plan.flash && u >= 0.25) {
      this.flashed = true;
      if (this.host.softFlash?.() !== true) this.host.flash(FLASH_COLOUR, plan.cutMs * 1.5, FLASH_PEAK); // REDUCE FLASHES: the smear's flash stays out
    }
    applySmear(this.frame, [plane], cells, 0);
    this.written = true;
  }
}
