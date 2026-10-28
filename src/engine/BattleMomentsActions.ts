/**
 * The per-turn shots: a turn starts, an action opens (the push in on the attacker), the first blow lands (the impact cut and the attack roll).
 *
 * `BattleMoments` was one 700-line class. It is now a short chain of classes, one responsibility each, every layer calling only the layers below it:
 * `BattleMomentsBase` -> `BattleMomentsOpening` -> `BattleMomentsActions` -> `BattleMomentsHeld` -> `BattleMoments` (import that one from `BattleMoments.ts`).
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 */

import type { CombatantId } from '../battle/common/types.ts';
import { punchMode } from './feel/FeelSwitch.ts'; // the motion program's `?punch=`: today's 0.11 moment punch, or the 2 to 3 percent settle (`feel/PunchCurve.ts`)
import { momentPunch } from './feel/PunchCurve.ts';
import type { ShotAction, ShotActionInfo } from './ShotDirector.ts';
import { MOMENT_TIMING, MOMENT_PUSH, ATTACK_ROLL_DEG } from './BattleMomentsConfig.ts';
import { BattleMomentsOpening } from './BattleMomentsOpening.ts';

export class BattleMomentsActions extends BattleMomentsOpening {
  // ---------------------------------------------------------------- per turn

  /** A new turn begins (`actorId`: whose, when the presenter says): fall back to the neutral framing if a shot is still up. */
  async turnStart(actorId?: CombatantId): Promise<void> {
    const asked = this.ask((d) => d.turnStart?.({ ...this.shotCtx(), actor: actorId === undefined ? undefined : this.subject(actorId) }));
    if (asked instanceof Promise ? await asked : asked === true) {
      this.onActionRig = false; // the director brought the frame back: no shot of ours is up
      return;
    }
    return this.settle();
  }

  /**
   * Open an action: push in on the attacker.
   *
   * `pose` is the painted pose the beat picked, which is also the shot's
   * grammar — an `attack` kicks the horizon over by the spec's -4deg and cuts
   * away fast, a `cast` holds on the caster long enough to see the spell wind
   * up before the impact cut takes the frame to the target.
   */
  async actionOpen(actorId: CombatantId, pose: string, targets: readonly CombatantId[] = [], info?: ShotActionInfo): Promise<void> {
    this.actions++;
    this.onActionRig = true;
    // A-13: the roll lands on the attack's first hit (`impact`), not the swing.
    this.rollOwed = pose === 'attack';
    this.shots.focus = this.shots.enemy(actorId) ?? targets.map((t) => this.shots.enemy(t)).find((t) => t !== null) ?? null;
    const action: ShotAction = { ...info, kind: pose };
    this.open = { actor: this.subject(actorId), action };
    const asked = this.ask((d) => d.actionOpen?.({ ...this.shotCtx(), actor: this.subject(actorId), targets: targets.map((t) => this.subject(t)), action, castHold: () => this.deps.sleep(MOMENT_TIMING.castHold) }));
    if (asked instanceof Promise ? await asked : asked === true) return; // the director has the push in on the attacker, and the cast's hold
    if (this.skipping) {
      this.cut(this.shots.fit(this.rigFor(actorId), 0).rig);
      return;
    }
    const shot = this.shots.fit(this.rigFor(actorId), MOMENT_PUSH.action);
    void this.move(shot.rig, MOMENT_TIMING.actionIn);
    void this.cam.push?.(shot.push, this.ms(MOMENT_TIMING.actionIn * 2));
    if (pose === 'cast') await this.deps.sleep(MOMENT_TIMING.castHold);
  }

  /**
   * The impact cut. FFX hard-cuts to whoever is being hit — it does not pan —
   * so this snaps, and only on the **first** hit of a multi-hit action, or the
   * frame would strobe through a twelve-hit Attack Reels.
   */
  impact(targetId: CombatantId, opts: { hitIndex?: number; heavy?: boolean; element?: string; lethal?: boolean } = {}): void {
    const taken = this.ask((d) => d.impact?.({ ...this.shotCtx(), actor: this.open?.actor, action: this.open?.action, target: this.subject(targetId), hitIndex: opts.hitIndex ?? 0, heavy: opts.heavy === true, element: opts.element, lethal: opts.lethal }));
    if (taken === true) {
      this.rollOwed = false; // the roll is the hit's camera move, and the director took it
      return;
    }
    if (this.skipping) {
      this.rollOwed = false;
      return;
    }
    if ((opts.hitIndex ?? 0) !== 0) return;
    this.shots.focus = this.shots.focus ?? this.shots.enemy(targetId);
    const rig = this.shots.fit(this.rigFor(targetId), MOMENT_PUSH.action).rig;
    if (rig && rig !== this.cam.rigName) {
      this.cut(rig);
      this.onActionRig = true;
    }
    const punch = momentPunch(punchMode(), this.deps.stage.fx?.enabled() === true); // today 0.11; `?punch=new` leaves it to the spectacle's kick while that is on
    if (opts.heavy && punch > 0) void this.cam.punch(punch, this.ms(460));
    this.rollOnHit();
  }

  /**
   * A-13, the spec's "-4deg roll on every attack" (`presentation-ink-and-gold.md`
   * "Motion & camera"; both games): kick the horizon over on the attack's first
   * hit and let it fall back level, at the playback speed. Never awaited, so it
   * adds no time to the action; none under reduce-motion.
   */
  private rollOnHit(): void {
    if (!this.rollOwed) return;
    this.rollOwed = false;
    if (this.reducedMotion) return;
    void this.cam.roll?.(ATTACK_ROLL_DEG, this.ms(MOMENT_TIMING.returnOut));
  }
}
