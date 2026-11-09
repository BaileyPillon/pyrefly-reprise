/**
 * **Belgemine's first four aeons** at the Remiem Temple: Valefor, Ifrit, Ixion and Shiva (the hidden Belgemine's Challenge chapter; **FFX only**). Each is a monster file the game shares with Chapter XIV's Isaaru (`m254`,
 * `m284`) or other fights (`m285`, `m286`), which tests the battle id and writes its own numbers and behaviour for each (`research/re-ffx-belgemine-aeon-duels.md` section 3, "RE 3.n"; the Remiem branches only: the three field
 * duels are out of this build, BD1). Every turn below is the script's, draw for draw, and `tests/unit/chapters/belgemine-ai.test.ts` pins it to the note's harness output. The constants and their sources are `./belgemine-rules.ts`;
 * Bahamut, Yojimbo and Anima are `./belgemine-b.ts`, the Sisters `./belgemine-sisters.ts`.
 *
 * ```
 * every aeon, first turn       Summon, aimed at Belgemine; nothing else changes (the CTB opening is the setup hook's)
 * Valefor (RE 3.5)             gauge 100: Energy Blast on the front line, gauge 0
 *                              else gauge >= 30 and a magical hit since last turn: Energy Ray on the front line, +10
 *                              else one living target; draw mod 3: 0 Sonic Wings, else Attack; +10
 *                              (the flag is cleared at the end of every turn; hit by a magical command: +15 and the flag, any other allowed hit +5)
 * Ifrit (RE 3.6)               MAG 35; gauge 100: MAG 48, Hellfire on the front line, gauge 0
 *                              else a physical hit since last turn: Meteor Strike on one, else Attack on one; +7 (an allowed hit +3, a physical one raises the flag)
 * Ixion (RE 3.7)               Defense 40, Magic Defense 40, Evasion 10; gauge 100: Thor's Hammer on the front line, gauge 0
 *                              else draw mod 4: 0 brace (Defense and Magic Defense 255, no action), 1 evade (Evasion 255, no action), 2 Aerospark, 3 Attack; +5 for the last two
 *                              (his second call also queues an Attack, +5; the later command replaces it, RE 8 U1)
 *                              an allowed hit adds 25 when it is the type he is guarding against (a magical hit while braced, a physical one while evading), else 5
 * Shiva (RE 3.8)               gauge 100: Diamond Dust on the front line, gauge 0
 *                              under half HP: draw mod 4: 0 Blizzaga on herself (+20), 1 Heavenly Strike, 2 Blizzara, 3 Attack (+10)
 *                              else draw mod 4: 0 Heavenly Strike, 1 Blizzara, else Attack (+10); a hit that took HP adds 5 (no gate)
 * ```
 *
 * A pick of "one" is `findMatchingChr` over the front line (a draw only with two or more standing), made after the script's own draw. Gauges move at **decision time**, as Grothia's do. The front line is Yuna and her party or
 * the aeon alone while one holds the field (`game-rolls.ts#frontLine`), so with no aeon out the Attack falls on Yuna, as the game's does.
 */

import type { Command } from '../../common/types.ts';
import { setGauge } from '../overdrive.ts';
import { rtOf } from '../state.ts';
import { gameMod, randomLiving } from './game-rolls.ts';
import { counterAllowed } from './hit-gates.ts';
import { type HitEvent, damageTypeOf, registerHitScript } from './hit-script.ts';
import { type AiContext, flag, registerAiScript, use } from './types.ts';
import './belgemine-b.ts';
import './belgemine-sisters.ts';
import {
  BELGEMINE_BYSTANDER_SCRIPT,
  BELG_ROWS as R,
  BELG_SCRIPTS,
  BELG_SPELLS as S,
  GAUGE_FULL,
  IFRIT,
  IXION,
  MEM,
  SHIVA,
  VALEFOR,
  gain,
  gaugeOf,
  summonFirst,
  victimRow,
} from './belgemine-rules.ts';

export * from './belgemine-rules.ts';

// ---------------------------------------------------------------------------
// Valefor (m254, lmyt01_00)
// ---------------------------------------------------------------------------

/** One Valefor turn (RE 3.5). */
export function valeforAi(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  const first = summonFirst(ai, R.summonValefor);
  if (first !== undefined) return first;
  let command: Command;
  if (gaugeOf(self) >= GAUGE_FULL) {
    setGauge(ctx, self, 0, 'overdrive');
    command = use(ai, R.energyBlast, []);
  } else if (gaugeOf(self) >= VALEFOR.rayAt && flag(memory, MEM.rayFlag)) {
    command = use(ai, R.energyRay, []);
    gain(ctx, self, VALEFOR.perTurn, 'attacking');
  } else {
    const victim = randomLiving(ctx);
    const wings = gameMod(ctx, 3) === 0;
    command = use(ai, wings ? R.sonicWings : R.attackB, victim === undefined ? [] : [victim.id]);
    gain(ctx, self, VALEFOR.perTurn, 'attacking');
  }
  memory[MEM.rayFlag] = false; // every branch ends by clearing it (m254 @0x600)
  return command;
}

/** Valefor's `onHit` (m254 f3 @0x607): a magical command raises the Ray flag and adds 15, any other allowed hit adds 5. */
function valeforHit({ ctx, target, attacker, def }: HitEvent): void {
  if (!counterAllowed(ctx, target)) return;
  if (damageTypeOf(def, attacker) === 2) {
    rtOf(ctx, target.id).ai[MEM.rayFlag] = true;
    gain(ctx, target, VALEFOR.perMagicHit, 'targeted');
  } else gain(ctx, target, VALEFOR.perOtherHit, 'targeted');
}

// ---------------------------------------------------------------------------
// Ifrit (m284, lmyt01_01)
// ---------------------------------------------------------------------------

/** One Ifrit turn (RE 3.6). */
export function ifritAi(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  const first = summonFirst(ai, R.summonIfrit);
  if (first !== undefined) return first;
  self.stats.mag = IFRIT.ordinaryMag;
  if (gaugeOf(self) >= GAUGE_FULL) {
    self.stats.mag = IFRIT.hellfireMag; // written for the cast; the script writes 45 after it, which nothing reads
    setGauge(ctx, self, 0, 'overdrive');
    return use(ai, R.hellfire, []);
  }
  let command: Command;
  if (flag(memory, MEM.meteorFlag)) {
    memory[MEM.meteorFlag] = false;
    command = victimRow(ai, R.meteorStrike);
  } else command = victimRow(ai, R.attackA);
  gain(ctx, self, IFRIT.perTurn, 'attacking');
  return command;
}

/** Ifrit's `onHit` (m284 f3 @0x6fb): a physical hit raises the flag; +3. */
function ifritHit({ ctx, target, attacker, def }: HitEvent): void {
  if (!counterAllowed(ctx, target)) return;
  if (damageTypeOf(def, attacker) === 1) rtOf(ctx, target.id).ai[MEM.meteorFlag] = true;
  gain(ctx, target, IFRIT.perHit, 'targeted');
}

// ---------------------------------------------------------------------------
// Ixion (m285, lmyt01_02)
// ---------------------------------------------------------------------------

/** One Ixion turn (RE 3.7). */
export function ixionAi(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  const first = summonFirst(ai, R.summonIxion);
  if (first !== undefined) return first;

  // His second call queues an Attack first (m285 @0x3a9), and the same call goes on to the turn below: the game's queue decides which command stands, unmapped (RE 8 U1). The build keeps the later one.
  let scripted: Command | undefined;
  if (!flag(memory, MEM.secondDone)) {
    memory[MEM.secondDone] = true;
    scripted = victimRow(ai, R.attackA);
    gain(ctx, self, IXION.perAction, 'attacking');
  }

  memory[MEM.braced] = false;
  memory[MEM.evading] = false;
  self.stats.def = IXION.resetDef;
  self.stats.mdef = IXION.resetMdef;
  self.stats.eva = IXION.resetEva;

  let picked: Command | undefined;
  if (gaugeOf(self) >= GAUGE_FULL) {
    setGauge(ctx, self, 0, 'overdrive');
    picked = use(ai, R.thorsHammer, []);
  } else {
    switch (gameMod(ctx, IXION.draws)) {
      case 0: // brace: Defense and Magic Defense 255 until his next turn, no action
        memory[MEM.braced] = true;
        self.stats.def = IXION.guarded;
        self.stats.mdef = IXION.guarded;
        break;
      case 1: // evade: Evasion 255 until his next turn, no action
        memory[MEM.evading] = true;
        self.stats.eva = IXION.guarded;
        break;
      case 2:
        picked = victimRow(ai, R.aerospark);
        gain(ctx, self, IXION.perAction, 'attacking');
        break;
      default:
        picked = victimRow(ai, R.attackA);
        gain(ctx, self, IXION.perAction, 'attacking');
        break;
    }
  }
  return picked ?? scripted ?? null;
}

/** Ixion's `onHit` (m285 f3 @0x836): +25 for the type he is guarding against, else +5. */
function ixionHit({ ctx, target, attacker, def }: HitEvent): void {
  if (!counterAllowed(ctx, target)) return;
  const memory = rtOf(ctx, target.id).ai;
  const type = damageTypeOf(def, attacker);
  const matching = (flag(memory, MEM.braced) && type === 2) || (flag(memory, MEM.evading) && type === 1);
  gain(ctx, target, matching ? IXION.perMatchingHit : IXION.perOtherHit, 'targeted');
}

// ---------------------------------------------------------------------------
// Shiva (m286, lmyt01_03)
// ---------------------------------------------------------------------------

/** One Shiva turn (RE 3.8). */
export function shivaAi(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  const first = summonFirst(ai, R.summonShiva);
  if (first !== undefined) return first;
  if (gaugeOf(self) >= GAUGE_FULL) {
    setGauge(ctx, self, 0, 'overdrive');
    return use(ai, R.diamondDust, []);
  }
  const hurt = self.hp < Math.floor(self.stats.maxHp / 2);
  const draw = gameMod(ctx, SHIVA.draws);
  let command: Command;
  let added: number = SHIVA.perTurn;
  if (hurt && draw === 0) {
    command = use(ai, S.blizzaga, [self.id]); // an Ice spell on herself: she absorbs it, a heal
    added = SHIVA.perHealTurn;
  } else if (hurt) command = victimRow(ai, draw === 1 ? R.heavenlyStrike : draw === 2 ? S.blizzara : R.attackB);
  else command = victimRow(ai, draw === 0 ? R.heavenlyStrike : draw === 1 ? S.blizzara : R.attackB);
  gain(ctx, self, added, 'attacking');
  return command;
}

/** Shiva's `onHit` (m286 f3 @0x666): +5 for a hit that took HP, with no counter gate. */
function shivaHit({ ctx, target, lastDamage }: HitEvent): void {
  if (lastDamage > 0) gain(ctx, target, SHIVA.perHit, 'targeted');
}

/** Belgemine owns no CTB turn (RE 0); if she is ever asked, she passes. */
function belgemineAi(): Command | null {
  return null;
}

registerAiScript(BELGEMINE_BYSTANDER_SCRIPT, belgemineAi);
registerAiScript(BELG_SCRIPTS.valefor, valeforAi);
registerAiScript(BELG_SCRIPTS.ifrit, ifritAi);
registerAiScript(BELG_SCRIPTS.ixion, ixionAi);
registerAiScript(BELG_SCRIPTS.shiva, shivaAi);
registerHitScript(BELG_SCRIPTS.valefor, valeforHit);
registerHitScript(BELG_SCRIPTS.ifrit, ifritHit);
registerHitScript(BELG_SCRIPTS.ixion, ixionHit);
registerHitScript(BELG_SCRIPTS.shiva, shivaHit);
