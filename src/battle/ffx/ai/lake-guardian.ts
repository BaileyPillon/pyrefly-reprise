/**
 * **The Guado Guardians of frozen Lake Macalania** (FFX only; the hidden Wendigo chapter, number 49): the monster file `m213` as the game's own bytecode runs it in this formation (`maca02_01`, battle 21,757,953;
 * `research/re-ffx-wendigo-lake-macalania.md` section 4.4, "RE 4.4"). **Not the Temple's Guardians** (`m141`, `./macalania-guardian.ts`): a different record and a different script. Both Guardians run this one script; the
 * first is the game's actor 20, the second actor 22. The first branch of every handler of the game's script tests the battle id; the other battles (the chase fights, the Temple) are not this chapter's.
 *
 * ## The turn (RE 4.4), first match wins, while Wendigo (actor 21) is alive
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | Wendigo is blind (Darkness) | **Eye Drops** on Wendigo (an item row; once this Guardian has been stolen from it cannot: GameFAQs, the script has no test, see below) |
 * | 2 | Wendigo's arms are up (the stance) | **Berserk** on a random living party member who is not Berserk already (the file only: in no guide) |
 * | 3 | Wendigo is Berserk | `mod 4` is 0: **Auto-Potion on Wendigo** (+1,000), or Blizzara on a random member once stolen from; 1 to 3: Blizzara or Thundara (`mod 2`) on a random member. Overall 37.5 percent Thundara, 37.5 Blizzara, 25 Auto-Potion; stolen from: 62.5 Blizzara, 37.5 Thundara |
 * | 4 | otherwise | **Berserk** on Wendigo (it lands) |
 *
 * With Wendigo dead: Blizzara or Thundara (`mod 2`) on a random living member.
 *
 * ## When it is hit (RE 4.4 `onHit`) and when it dies (`onDeath`)
 *
 * Hit: nothing if counters are not allowed (a reaction in progress, or it cannot act), if it is asleep, if it **has been stolen from**, or if the hit was a Berserk cast; otherwise **if the hit took HP: Auto-Potion on
 * itself (+1,000)**, a free reply. Death (a KO of any cause but Petrify, which is no death here): **the first Guardian casts Protect on Wendigo, the second Shell, if Wendigo lives**, a command of the dying monster
 * (`ownerMayBeDead`, `./hooks.ts`).
 *
 * ## The deviations and open readings, said (rule 6: none of them is a number)
 *
 * - **Eye Drops after a Steal** (RE 8): GameFAQs says a Steal stops them and the file's branch has no steal test (the test is on the Auto-Potion branches); GameFAQs wins what the files do not settle, so a stolen-from
 *   Guardian that finds Wendigo blind **spends its turn on nothing** (the engine passes). The engine's own rule for a monster's item after a Steal is unread.
 * - **A Provoked Guardian** (forced-action word 0x3047, Thundara in the game) throws the engine's one generic Attack (STR 1), as every monster's forced turn does here (`forced-turn.ts`): the word only decides whether
 *   there is one.
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, isAlive, tryActor } from '../state.ts';
import { counterAllowed } from './hit-gates.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import { queueReaction, registerScriptHooks, type HitReport, type UsedCommand } from './hooks.ts';
import { gameMod } from './game-rolls.ts';
import {
  GUARDIAN_BRANCH_MODULUS,
  GUARDIAN_SPELL_MODULUS,
  WD_GUARDIAN_A_ID,
  WD_GUARDIAN_SCRIPT,
  WD_ID,
  WD_ROWS,
  armsUp,
  randomCalmMember,
  randomLivingMember,
  stolenFrom,
} from './wendigo-rules.ts';

/** Blizzara on a random living member (coin 0) or Thundara (coin 1): the pick first, the coin after, as the script draws them. */
function spellOn(ai: AiContext): Command | null {
  const victim = randomLivingMember(ai.ctx);
  const coin = gameMod(ai.ctx, GUARDIAN_SPELL_MODULUS);
  return victim === undefined ? null : use(ai, coin === 0 ? WD_ROWS.blizzara : WD_ROWS.thundara, [victim.id]);
}

/** One Guardian turn (RE 4.4). */
export function lakeGuardianTurn(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  const wendigo = tryActor(ctx, WD_ID);
  if (wendigo === undefined || !isAlive(wendigo)) return spellOn(ai);

  if (has(wendigo, 'darkness')) return stolenFrom(ctx, self) ? null : use(ai, WD_ROWS.eyeDrops, [wendigo.id]);

  if (armsUp(ctx)) {
    const victim = randomCalmMember(ctx);
    return victim === undefined ? null : use(ai, WD_ROWS.berserk, [victim.id]);
  }

  if (has(wendigo, 'berserk')) {
    if (gameMod(ctx, GUARDIAN_BRANCH_MODULUS) === 0) {
      if (stolenFrom(ctx, self)) {
        const victim = randomLivingMember(ctx);
        return victim === undefined ? null : use(ai, WD_ROWS.blizzara, [victim.id]);
      }
      return use(ai, WD_ROWS.autoPotion, [wendigo.id]);
    }
    return spellOn(ai);
  }

  return use(ai, WD_ROWS.berserk, [wendigo.id]);
}

/** The Guardian hears it was hit (RE 4.4): +1,000 HP on itself unless stolen from, asleep, or the hit was a Berserk cast. */
function guardianOnHit(ctx: Ctx, self: FFXCombatant, used: UsedCommand, report: HitReport): void {
  if (self.hp <= 0 || !counterAllowed(ctx, self)) return; // isCounterattackAllowed(): it can act (not asleep, Threatened, ...) and the hit is not a reaction
  if (has(self, 'sleep') || stolenFrom(ctx, self)) return;
  if (used.def.id === WD_ROWS.berserk) return;
  if (report.lastDamage <= 0) return;
  queueReaction(ctx, self.id, { kind: 'ability', id: WD_ROWS.autoPotion, targets: [self.id] }, { byId: used.user.id });
}

/** The Guardian dies (RE 4.4): the first casts Protect on Wendigo, the second Shell, if Wendigo lives. */
function guardianOnDeath(ctx: Ctx, self: FFXCombatant): void {
  const wendigo = tryActor(ctx, WD_ID);
  if (wendigo === undefined || !isAlive(wendigo)) return;
  const row = self.id === WD_GUARDIAN_A_ID ? WD_ROWS.protect : WD_ROWS.shell;
  queueReaction(ctx, self.id, { kind: 'ability', id: row, targets: [wendigo.id] }, { forced: true, ownerMayBeDead: true, byId: wendigo.id });
}

registerAiScript(WD_GUARDIAN_SCRIPT, lakeGuardianTurn);
registerScriptHooks(WD_GUARDIAN_SCRIPT, { onHit: guardianOnHit, onDeath: guardianOnDeath });
