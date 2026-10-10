/**
 * **The two act changes of the Macalania fight**: Seymour summons Anima, and Anima falls (re-parity,
 * `research/re-ffx-ai-seymour.md` sections 3.5 and 3.6; **FFX only**).
 *
 * The summon is Seymour's `onHit` / `postPoison` row 4 and Anima's arrival is the `onTargeted` of the command he
 * forces at her; both run in one go here (`./macalania-seymour.ts` calls {@link summonAnima}). The return is her
 * `onDeath`, polled by {@link runMacalaniaPhaseHooks} after every action, because a part's death has no hook of its
 * own in this engine.
 */

import type { FFXCombatant, StatusId } from '../../common/types.ts';
import { type Ctx, has, isAlive, rtOf, tryActor } from '../state.ts';
import { healOutsideChain, koActor } from '../hp.ts';
import { revealEnemy } from '../forms.ts';
import { removeStatus } from '../statuses.ts';
import { onRevived } from '../turnQueue.ts';
import {
  ACT_THREE_MAGIC,
  ANIMA_ID,
  GUARDIAN_IDS,
  MAC_ACT,
  MAC_ANIMA_ARRIVAL,
  MAC_ANIMA_SUMMONED,
  MAC_HAS_POTIONS,
  SEYMOUR_ID,
  SEYMOUR_SUMMON_HP,
  macalaniaAct,
} from './macalania-rules.ts';

/** What the summon row clears from him: Poison and the Magic, Armor and Mental Breaks and Slow. */
const CLEARED_AT_SUMMON: readonly StatusId[] = ['poison', 'magic-break', 'armor-break', 'mental-break', 'slow'];

/**
 * **The summon.** Row 4 of his `onHit`, in the script's order: the mode becomes "Anima is out"; the five statuses
 * above come off; he becomes untargetable and drops out of the turn queue (the script switches off his Targetable,
 * VisibleOnCTB and GetsTurns); his Magic is 32; **both Guardians' HP is written 0 (they die)**; his max HP and HP are
 * 6,000 (the `heal` event is that write, so the HUD's bar follows it); the Talk command is removed from Tidus, Yuna
 * and Wakka (`./macalania-talk.ts` reads the act); and a forced "Special 1" at Anima is her arrival.
 *
 * His HP may be 0 here: the script lets a lethal hit through (his `onHit` runs before the death check) and this
 * is what stops the death. No cap, no floor: the HD build's "cannot be killed before he summons" is this script.
 */
export function summonAnima(ctx: Ctx, seymour: FFXCombatant): void {
  ctx.state.flags[MAC_ANIMA_SUMMONED] = true;
  ctx.state.flags[MAC_ACT] = 2;
  ctx.emit({ type: 'message', text: 'Seymour summons Anima', kind: 'telegraph' });

  for (const status of CLEARED_AT_SUMMON) if (has(seymour, status)) removeStatus(ctx, seymour, status, 'cured');
  seymour.flags.untargetable = true;
  rtOf(ctx, SEYMOUR_ID).ordersOnly = true;
  seymour.stats.mag = ACT_THREE_MAGIC;

  for (const id of GUARDIAN_IDS) {
    const g = tryActor(ctx, id);
    if (g && isAlive(g)) koActor(ctx, g, SEYMOUR_ID);
  }

  seymour.stats.maxHp = SEYMOUR_SUMMON_HP;
  const missing = SEYMOUR_SUMMON_HP - seymour.hp;
  if (missing > 0) healOutsideChain(ctx, seymour, missing, 'seymour-restored', SEYMOUR_ID);

  arriveAnima(ctx);
}

/**
 * **Anima's arrival** (her `onTargeted` for the forced Special 1): she gets turns, a place on the CTB bar and a
 * target mark; **her counter becomes 0 and each active party member's counter goes up by 1**, so she acts first
 * even when someone stood at 0; Seymour gets no more turns; her arrival flag is 128 (her first turn queues the
 * Summon Anima marker and carries on into her cycle). The chapter's line about it plays here: the engine emits the
 * reveal and then the `script-trigger`, and the presenter holds her entrance until the line is spoken.
 */
function arriveAnima(ctx: Ctx): void {
  const anima = tryActor(ctx, ANIMA_ID);
  if (!anima) return;
  ctx.state.flags[MAC_ANIMA_ARRIVAL] = 128;
  revealEnemy(ctx, anima, undefined, 1);
  ctx.emit({ type: 'script-trigger', name: 'mac-anima-summon', payload: { script: 'mac-anima-summon' } });
}

/**
 * **Anima falls**: row of her `onDeath`. She is removed; Seymour is **re-initialised** (`btlResetParam`, the exe's
 * 0x7a89c0: the character record is rebuilt from the monster table and revived), so he comes back at full HP with
 * **no status of any kind** (the Shell of his first turn included; the script does not cast it again), his counter at
 * `tick speed x 3` like any revive; then the script makes him visible, targetable and a turn-taker again and writes
 * his Magic 32. His spell cycle and the rest of what the script remembers are untouched.
 */
export function dismissAnima(ctx: Ctx, seymour: FFXCombatant): void {
  ctx.state.flags[MAC_ACT] = 3;
  ctx.emit({ type: 'message', text: 'Seymour dismisses Anima', kind: 'telegraph' });

  const anima = tryActor(ctx, ANIMA_ID);
  if (anima) {
    anima.removed = true;
    anima.flags.hidden = true;
  }

  for (const status of Object.keys(seymour.statuses) as StatusId[]) removeStatus(ctx, seymour, status, 'cured');
  seymour.stats.maxHp = SEYMOUR_SUMMON_HP;
  seymour.hp = SEYMOUR_SUMMON_HP;
  seymour.stats.mag = ACT_THREE_MAGIC;
  seymour.flags.untargetable = false;
  rtOf(ctx, SEYMOUR_ID).ordersOnly = false;
  onRevived(ctx, SEYMOUR_ID);
}

/** `macalania.hasPotions.<id>` mirrors "never stolen from", so the tactic can read it. */
function mirrorPotionSupply(ctx: Ctx): void {
  for (const id of GUARDIAN_IDS) {
    if (tryActor(ctx, id)) ctx.state.flags[`${MAC_HAS_POTIONS}${id}`] = rtOf(ctx, id).stealCount === 0;
  }
}

/**
 * Anima's death, evaluated after every action (called from `engine-end.ts#afterAction`): once she is no longer
 * on the field in act two, Seymour returns. A no-op in every other battle.
 */
export function runMacalaniaPhaseHooks(ctx: Ctx): void {
  const seymour = tryActor(ctx, SEYMOUR_ID);
  if (!seymour || ctx.state.flags[MAC_ACT] === undefined) return;
  mirrorPotionSupply(ctx);
  if (macalaniaAct(ctx) !== 2) return;
  const anima = tryActor(ctx, ANIMA_ID);
  if (!anima || !isAlive(anima)) dismissAnima(ctx, seymour);
}
