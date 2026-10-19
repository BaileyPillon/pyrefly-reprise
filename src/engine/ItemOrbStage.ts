/**
 * The stage's half of the item gesture (`BattlePresenterItem.ts`; presentation only): where the user's hand is, which stance has no flask in it, and the light: FFX's orb tossed from the hand to the ally (or the glow that
 * rises around the user), FFX-2's small white-blue spark tossed to the ally (or only a burst on the user). `PaintedStage` owns one and answers `BattleStage.itemStance`, `VfxPort.itemToss` and `VfxPort.itemGlow` through it.
 * FFX-2's ATB can overlap two actions, so the light is a small pool (at most {@link POOL}): a new gesture takes a free one, else the oldest is cut.
 *
 * The hand, for every kind of figure the party has:
 * - a figure drawn from a RIG (Lulu and Kimahri with the rig switch on) follows the rig's own `fist` landmark, which is the hand of the pose the rig is in or moving to (`RigActor.landmark`, local to the
 *   figure, plus its position), and takes its rig's `item` key (the arm raised, no flask in any part);
 * - a figure drawn from paintings (everyone else, and Lulu and Kimahri with the rig off) is read off the painting it stands in through the live plane (`PaintedActor.paintPoint`, so the mirror, the bob and the lunge come
 *   with it) at the point `ItemGestureTable.ts` holds for that character, and stands in a pose with no flask in it.
 *
 * Game case: both, one look each (the chapter's deps say which: `'orb'` for an FFX chapter, `'spark'` for an FFX-2 chapter; FF7 never asks). The hand table is FFX's party; an FFX-2 figure (a dressphere painting) has no measured hand
 * and the spark starts from the generic chest-height spot.
 */
import { Vector3, type Object3D } from 'three';
import type { PaintedActor } from './PaintedActor.ts';
import type { CombatantId } from '../battle/common/types.ts';
import { ItemOrbFx, type P3 } from './fx/ItemOrbFx.ts';
import { itemHandOf, RIG_ITEM_POSE } from './ItemGestureTable.ts';

/** A figure on the field, as this needs it: the actor and the art id the stage built it from. */
export interface OrbFigure {
  actor: PaintedActor;
  artId: string;
}

/** The rig's hand in the actor's local space, or null for a figure with no rig (or a rig with no `fist`, or one not built yet). */
function rigFist(actor: PaintedActor): { x: number; y: number } | null {
  const lm = (actor as unknown as { landmark?: (name: string) => { x: number; y: number } | null }).landmark;
  if (typeof lm !== 'function') return null;
  try {
    return lm.call(actor, 'fist');
  } catch {
    return null; // a rig that is not ready: the painting's anchor stands in
  }
}

/** At most this many gestures play at once (FFX-2's ATB overlaps two actions; FFX's CTB plays one). */
export const POOL = 3;

export class ItemOrbStage {
  private readonly fxs: ItemOrbFx[] = [];
  private last: ItemOrbFx | null = null;
  private cut = 0;
  private readonly handV = new Vector3();
  private readonly aimV = new Vector3();
  private readonly sumV = new Vector3();

  constructor(
    private readonly scene: Object3D,
    private readonly figure: (id: CombatantId) => OrbFigure | undefined,
    /** The effect clock's rate against a real second (the pacing option and the playback speed), as the spell effects take it. */
    private readonly rate: () => number,
  ) {}

  /** The pose a figure holds for an item use, with no flask in it; undefined for a combatant that is not on the field. */
  stance(id: CombatantId): string | undefined {
    const f = this.figure(id);
    if (!f) return undefined;
    return rigFist(f.actor) ? RIG_ITEM_POSE : itemHandOf(f.artId).pose;
  }

  /** Where the hand is now, in the world (live: the figure bobs, a rig moves its arm). */
  handOf(f: OrbFigure): P3 {
    const fist = rigFist(f.actor);
    if (fist) return this.handV.set(f.actor.position.x + fist.x, f.actor.position.y + fist.y, f.actor.position.z + 0.1);
    const h = itemHandOf(f.artId);
    return f.actor.paintPoint(h.u, h.t, this.handV);
  }

  /** The middle of these figures' bodies (one figure: its middle), or null when none of them is on the field. */
  private middleOf(ids: readonly CombatantId[]): P3 | null {
    let n = 0;
    this.sumV.set(0, 0, 0);
    for (const id of ids) {
      const f = this.figure(id);
      if (!f) continue;
      this.sumV.add(f.actor.centerPoint(this.aimV));
      n++;
    }
    return n > 0 ? this.sumV.multiplyScalar(1 / n) : null;
  }

  /** A free light (made on first use), else the oldest one, cut. */
  private take(): ItemOrbFx {
    let fx = this.fxs.find((x) => !x.active);
    if (!fx && this.fxs.length < POOL) this.fxs.push((fx = new ItemOrbFx()));
    if (!fx) fx = this.fxs[this.cut++ % this.fxs.length]!;
    this.last = fx;
    return fx;
  }

  /** An orb (FFX) or a spark (FFX-2) forms over `from`'s hand, is tossed to the middle of `to` and bursts on it. */
  toss(from: CombatantId, to: readonly CombatantId[], o: { formMs: number; flightMs: number; tone: 'heal' | 'foe'; style?: 'orb' | 'spark' }): void {
    const f = this.figure(from);
    if (!f || this.middleOf(to) === null) return;
    const hand = new Vector3();
    const aim = new Vector3();
    this.take().toss({
      hand: () => hand.copy(this.handOf(f) as Vector3),
      target: () => aim.copy((this.middleOf(to) ?? this.handOf(f)) as Vector3),
      formMs: o.formMs,
      flightMs: o.flightMs,
      tone: o.tone,
      ...(o.style ? { style: o.style } : {}),
      unit: f.actor.height / 1.8,
    });
  }

  /** FFX: a small glow at `at`'s hand, then glow particles rise around the figure. FFX-2 (`style: 'spark'`): only a white-blue burst on the figure. */
  glow(at: CombatantId, o: { formMs: number; style?: 'orb' | 'spark' }): void {
    const f = this.figure(at);
    if (!f) return;
    const unit = f.actor.height / 1.8;
    if (o.style === 'spark') {
      const mid = new Vector3();
      this.take().sparkle({ at: () => mid.copy(f.actor.centerPoint(this.aimV)), formMs: o.formMs, unit });
      return;
    }
    const hand = new Vector3();
    const feet = new Vector3();
    this.take().glow({
      hand: () => hand.copy(this.handOf(f) as Vector3),
      feet: () => feet.set(f.actor.position.x, f.actor.position.y, f.actor.position.z),
      height: f.actor.height,
      formMs: o.formMs,
      tone: 'heal',
      unit,
    });
  }

  /** What the light that started last is doing, for the debug snapshot and the tests. */
  get state(): { phase: string; at: P3 } {
    return { phase: this.last?.phase ?? 'rest', at: this.last?.orbAt ?? { x: 0, y: 0, z: 0 } };
  }

  /** How many lights are in play right now. */
  get playing(): number {
    return this.fxs.filter((x) => x.active).length;
  }

  /** Advance by `dt` seconds of the field clock. */
  update(dt: number): void {
    const d = dt * this.rate();
    for (const fx of this.fxs) fx.update(d, this.scene);
  }

  /** Put the light away (the figure left, the screen is leaving). */
  hide(): void {
    for (const fx of this.fxs) fx.hide();
  }

  dispose(): void {
    for (const fx of this.fxs) fx.dispose();
    this.fxs.length = 0;
  }
}
