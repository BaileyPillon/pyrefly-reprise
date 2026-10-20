/**
 * The doll's throw (pass 3 of the animation prototype, `?anim=proto&style=P3`; FFX Lulu: the moogle doll; erasable TS, no `three`, no DOM): Lulu's attack is a doll THROWN at the target, not a lunge. Pass 2 found the
 * presenter's house lunge carrying her about 4 world units one way while the hit effect landed on the target the other: the figure never met its own blow. Here she stands where she is, the doll leaves her hand,
 * flies to where the target is on SCREEN and lands there on the clip's contact mark, the game's frame 20 (`research/re-ffx-party-motion-timing.md` section 2: ATTACK2, hit signal 20 of 60, end signal 54), so the
 * target's own hit effect (the presenter's `damage` beat, held to the lunge's apex which the clip's contact is scheduled on) goes off on the doll. It rebounds, and flies back to the hand by the follow-through.
 *
 * FFX only: Lulu's ATTACK2 is a stand-still strike with a hit signal; her run-in set (ATTACK1) carries no signal in any of its clips, so a run-in is not her normal attack ([I] in the note). The path of the doll
 * between the hand and the target is NOT read from the game (the motion data was read for frame counts only): the leave frame, the arc, the rebound and the return are ours.
 *
 * The doll is a bone of the rig (`doll`), carried by the hand's `fist` landmark (`AnimCarry.ts`); the throw moves the carry's joint (the carry's `move` hook), so the doll is a part of the same mesh, in the same plane,
 * drawn in the same order. The aim is in painting px of the master, found by the actor through the camera (`RigActor.paintOf`), so it stays on the target whatever the camera does (a push, a cut).
 */

/** A point in painting px. */
export interface P2 {
  x: number;
  y: number;
}

/** What a throw is made of. Times are ms of the STRIKE clip (its start is the swing's start; its `contact` mark is the game's frame 20). */
export interface DollSpec {
  /** When the doll leaves the hand (after the swing's start); it flies from then to the contact mark. */
  departMs: number;
  /** How long it takes to come back to the hand after the contact. */
  returnMs: number;
  /** The arc's height, a fraction of the distance between the hand and the target (upward on screen). */
  arc: number;
  /** How far it rebounds off the target, a fraction of the distance (back toward the hand and up). */
  rebound: number;
  /** Whole turns it spins on the way there, and again on the way back. */
  turns: number;
}

/** Where the doll is, and how far it has turned, while it is away from the hand. */
export interface ThrowAt {
  x: number;
  y: number;
  /** Radians added to the doll bone's rotation. */
  rot: number;
}

const smooth = (u: number): number => u * u * (3 - 2 * u);
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

export class DollThrow {
  /** Where the target is, in painting px; null while there is none (no throw is made). */
  aim: P2 | null = null;

  readonly spec: DollSpec;

  constructor(spec: DollSpec) {
    this.spec = spec;
  }

  /** True from the doll's leaving to its return: the doll is not the hand's (the point spring that bobs it is held meanwhile). */
  active(t: number, contact: number): boolean {
    return this.aim !== null && t >= this.spec.departMs && t < contact + this.spec.returnMs;
  }

  /**
   * The doll's place at clip time `t` given where the hand carries it (`hand`) and the contact mark `contact`, into `out`; false while it rides the hand. The flight leaves the hand (wherever the swinging arm has it)
   * and is on the target exactly at `contact`; the return leaves the rebound and is on the hand (wherever it is then) exactly `returnMs` later.
   */
  at(hand: P2, t: number, contact: number, out: ThrowAt): boolean {
    const aim = this.aim;
    const s = this.spec;
    if (!aim || !this.active(t, contact)) return false;
    const dx = aim.x - hand.x;
    const dy = aim.y - hand.y;
    const dist = Math.hypot(dx, dy);
    if (t <= contact) {
      const p = clamp01((t - s.departMs) / Math.max(1, contact - s.departMs));
      const e = Math.pow(p, 1.35); // leaves the swinging hand quickly and arrives on the blow
      out.x = hand.x + dx * e;
      out.y = hand.y + dy * e - s.arc * dist * 4 * p * (1 - p);
      out.rot = Math.PI * 2 * s.turns * p;
      return true;
    }
    const q = clamp01((t - contact) / Math.max(1, s.returnMs));
    // off the target, back along the way it came and up (the rebound), then home to the hand
    const back = Math.sin(Math.PI * Math.min(1, q / 0.35)) * (q < 0.35 ? 1 : 0);
    const ux = dist > 1e-6 ? -dx / dist : 0;
    const uy = dist > 1e-6 ? -dy / dist : 0;
    const bx = aim.x + (ux * 0.5 * s.rebound * dist) * back;
    const by = aim.y + (uy * 0.5 * s.rebound * dist - s.rebound * dist * 0.6) * back;
    const home = smooth(clamp01((q - 0.12) / 0.88));
    out.x = bx + (hand.x - bx) * home;
    out.y = by + (hand.y - by) * home - s.arc * dist * 2.4 * home * (1 - home);
    out.rot = Math.PI * 2 * s.turns * (1 + home);
    return true;
  }
}
