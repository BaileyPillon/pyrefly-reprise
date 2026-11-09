/**
 * **Belgemine's Magus Sisters** (the hidden Belgemine's Challenge chapter, the eighth duel, `lmyt01_07`; **FFX only**): three bodies in one battle, Mindy `m291`, Sandy `m289` and Cindy `m290`, each with its own script
 * (`research/re-ffx-belgemine-aeon-duels.md` section 3.12, "RE 3.12"; pinned to the note's harness output by `tests/unit/chapters/belgemine-ai.test.ts`). Constants and sources in `./belgemine-rules.ts`. Not the Dark Sisters
 * (`./dark-aeons.ts`) and not the possessed ones (`./possessed-sisters.ts`): other files, other scripts.
 *
 * ```
 * Mindy   draw mod 6 on one living target, after +10 a turn.  HP at a quarter or more: 0 Flare, 1 Thundara, 2 Fira, 3 Blizzara, 4 Watera, 5 Passado.   Under a quarter: 0 Ultima (the front line), 1 Thundaga, 2 Firaga, 3 Blizzaga, 4 Waterga, 5 Passado
 * Sandy   draw mod 4: 0 Razzia, else Attack, on one living target; +10
 * Cindy   first call: Summon.   Then, in order, the first that applies:
 *           1. all three gauges 100: Delta Attack on the front line, then all three gauges 0 (no gauge added to hers)
 *           2. the Mighty Guard counter (starts at 4, +1 a turn, fires at 7 and starts again from 0): Mighty Guard on the three, +5
 *           3. all three Sisters under half HP: draw mod 4, 0 White Wind on the three, +5
 *           4. draw mod 4 = 0: draw mod 6: 0 Holy, 1 Drain, 2 Osmose, 3 Demi (front line), 4 Dispel (front line), 5 Camisade; +10
 *           5. otherwise a buff, +10: Shell on a Sister who lacks it, else Protect on one who lacks it, else (both up) Cura on a random living Sister one time in three and Regen otherwise
 * a hit that took HP adds 5 to the Sister hit, while she can counter; a Sister who falls has her gauge written 0 (so the Delta Attack is over for good)
 * ```
 *
 * Cindy's picks over "the Sisters" are `findMatchingChr` over the living, targetable monsters (Belgemine is neither the first nor the second), a draw only with two or more. A Sister who falls while another stands is, in the game,
 * hidden from the gauge row (flag 295); that is presentation only here. The battle ends when all three are down.
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, isAlive, targetable, tryActor } from '../state.ts';
import { setGauge } from '../overdrive.ts';
import { gameMod, pickActor } from './game-rolls.ts';
import { counterAllowed } from './hit-gates.ts';
import { type HitEvent } from './hit-script.ts';
import { registerScriptHooks } from './hooks.ts';
import { type AiContext, num, registerAiScript, use } from './types.ts';
import {
  BELG_FLAGS,
  BELG_IDS,
  BELG_ROWS as R,
  BELG_SCRIPTS,
  BELG_SPELLS as S,
  GAUGE_FULL,
  SISTERS,
  gain,
  gaugeOf,
  summonFirst,
  victimRow,
} from './belgemine-rules.ts';

/** The three bodies in the game's actor order (21 Mindy, 22 Sandy, 23 Cindy). */
const SISTER_IDS = [BELG_IDS.mindy, BELG_IDS.sandy, BELG_IDS.cindy] as const;

/** The Sisters that are in this battle. */
function sisters(ctx: Ctx): FFXCombatant[] {
  return SISTER_IDS.map((id) => tryActor(ctx, id)).filter((c): c is FFXCombatant => c !== undefined);
}

/** `findMatchingChr(AllMonsters, ...)`'s pool: the living, targetable Sisters. */
const standing = (ctx: Ctx): FFXCombatant[] => sisters(ctx).filter((c) => isAlive(c) && targetable(c));

// ---------------------------------------------------------------------------
// Mindy (m291) and Sandy (m289)
// ---------------------------------------------------------------------------

const MINDY_TABLE = [S.flare, S.thundara, S.fira, S.blizzara, S.watera, R.passado] as const;
const MINDY_TABLE_LOW = [S.ultima, S.thundaga, S.firaga, S.blizzaga, S.waterga, R.passado] as const;

/** One Mindy turn (RE 3.12): a draw mod 6 over one of two tables, by whether her HP is under a quarter. */
export function mindyAi(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  const low = self.hp < Math.floor(self.stats.maxHp / 4);
  const draw = gameMod(ctx, 6);
  const row = (low ? MINDY_TABLE_LOW : MINDY_TABLE)[draw] ?? R.passado;
  const command = row === S.ultima ? use(ai, row, []) : victimRow(ai, row);
  gain(ctx, self, SISTERS.perTurn, 'attacking');
  return command;
}

/** One Sandy turn (RE 3.12): Razzia one time in four, Attack otherwise. */
export function sandyAi(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  const razzia = gameMod(ctx, 4) === 0;
  const command = victimRow(ai, razzia ? R.razzia : R.attackB);
  gain(ctx, self, SISTERS.perTurn, 'attacking');
  return command;
}

// ---------------------------------------------------------------------------
// Cindy (m290)
// ---------------------------------------------------------------------------

/** The Sisters in the group a "monster group" move names (the living ones). */
const groupIds = (ctx: Ctx): string[] => standing(ctx).map((c) => c.id);

/** A Sister lacking `status` (a draw only with two or more), or `undefined`. */
function lacking(ctx: Ctx, status: 'shell' | 'protect'): FFXCombatant | undefined {
  return pickActor(ctx, standing(ctx).filter((c) => !has(c, status)));
}

/** One Cindy turn (RE 3.12). */
export function cindyAi(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  const first = summonFirst(ai, R.summonSisters);
  if (first !== undefined) return first;

  const all = sisters(ctx);
  // 1. The joint attack: every Sister's gauge at 100. The command is queued, then all three gauges are written 0.
  if (all.length === 3 && all.every((c) => gaugeOf(c) >= GAUGE_FULL)) {
    for (const c of all) setGauge(ctx, c, 0, 'delta-attack');
    return use(ai, R.deltaAttack, []);
  }

  // 2. Mighty Guard: the counter starts at 4 and fires when it reaches 7.
  const count = num(memory, BELG_FLAGS.guardCount, SISTERS.guardStart) + 1;
  if (count >= SISTERS.guardAt) {
    memory[BELG_FLAGS.guardCount] = 0;
    gain(ctx, self, SISTERS.perSmallTurn, 'attacking');
    return use(ai, R.mightyGuard, groupIds(ctx));
  }
  memory[BELG_FLAGS.guardCount] = count;

  // 3. White Wind: all three under half HP, then one draw in four.
  if (all.length === 3 && all.every((c) => c.hp < Math.floor(c.stats.maxHp / 2)) && gameMod(ctx, 4) === 0) {
    gain(ctx, self, SISTERS.perSmallTurn, 'attacking');
    return use(ai, R.whiteWind, groupIds(ctx));
  }

  // 4. One draw in four, a spell or Camisade.
  if (gameMod(ctx, 4) === 0) {
    const pick = gameMod(ctx, 6);
    let command: Command;
    switch (pick) {
      case 0: command = victimRow(ai, S.holy); break;
      case 1: command = victimRow(ai, S.drain); break;
      case 2: command = victimRow(ai, S.osmose); break;
      case 3: command = use(ai, S.demi, []); break;
      case 4: command = victimRow(ai, S.dispel); break; // the front line is one character in this chapter (Yuna alone), so a group Dispel and a single one read the same
      default: command = victimRow(ai, R.camisade); break;
    }
    gain(ctx, self, SISTERS.perTurn, 'attacking');
    return command;
  }

  // 5. A buff: Shell on one who lacks it, else Protect on one who lacks it, else Cura (one in three) or Regen on a random living Sister.
  let command: Command;
  const noShell = lacking(ctx, 'shell');
  if (noShell !== undefined) command = use(ai, S.shell, [noShell.id]);
  else {
    const noProtect = lacking(ctx, 'protect');
    if (noProtect !== undefined) command = use(ai, S.protect, [noProtect.id]);
    else {
      const cura = gameMod(ctx, 3) === 0;
      const who = pickActor(ctx, standing(ctx));
      command = use(ai, cura ? S.cura : S.regen, who === undefined ? [] : [who.id]);
    }
  }
  gain(ctx, self, SISTERS.perTurn, 'attacking');
  return command;
}

// ---------------------------------------------------------------------------
// The hit hook (all three: m289, m290 and m291 f3)
// ---------------------------------------------------------------------------

/** A Sister's `onHit`: +5 for a hit that took HP, while she can counter. */
function sisterHit({ ctx, target, lastDamage }: HitEvent): void {
  if (counterAllowed(ctx, target) && lastDamage > 0) gain(ctx, target, SISTERS.perHit, 'targeted');
}

registerAiScript(BELG_SCRIPTS.mindy, mindyAi);
registerAiScript(BELG_SCRIPTS.sandy, sandyAi);
registerAiScript(BELG_SCRIPTS.cindy, cindyAi);
// Each Sister's hooks in one registration (a second one under the same id would replace the first): the hit, and the death handler, which writes her gauge 0 first (m289 to m291 f6 @0x335, @0x4df, @0x63b), so a fallen Sister can never again count toward the Delta Attack.
for (const id of [BELG_SCRIPTS.mindy, BELG_SCRIPTS.sandy, BELG_SCRIPTS.cindy]) {
  registerScriptHooks(id, {
    onHit: (ctx, self, used, report) => sisterHit({ ctx, target: self, attacker: used.user, def: used.def, lastDamage: report.lastDamage, affectsHp: report.affectsHp }),
    onDeath: (ctx, self) => setGauge(ctx, self, 0, 'ko'),
  });
}
