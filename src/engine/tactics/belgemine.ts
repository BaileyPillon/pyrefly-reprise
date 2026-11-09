/**
 * The hidden Belgemine's Challenge chapter (FFX; the eight aeon duels of the Remiem Temple): the line the guides' clears use, written as a tactic [`research/re-ffx-belgemine-aeon-duels.md` section 5 and 6, the Gamer Guides HD and Jegged
 * pages the note reads; `docs/plans/ch-belgemine-review.md` section 2's "what it asks of the player"].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Aeons, Summon, Grand Summon, Shield and the enemy aeons' Overdrive gauges are FFX's. Registered under the FFX game in `./lookup.ts`, so an FFX-2 board never reaches it.
 *
 * ## The line, and where each rule comes from
 *
 * It is the **intended** line of `tests/unit/chapters/belgemine-bench.test.ts` (`docs/handoff/ch-belgemine.md`), written as a tactic. It only picks among the rows the engine offers (a duel greys the mirror aeon and the fallen, and Yuna's
 * menu is Summon and Grand Summon), and returns `null` (the generic ladder) when none of her eight is standing.
 *
 * **Yuna** summons, in the order the guides give for each duel, the first aeon the menu offers (RE 5; Gamer Guides HD and Jegged): against Ifrit **Shiva or Ixion first** (a physical hit brings his Meteor Strike), against Bahamut
 * **Anima or Ixion** (they hit hardest), against everything else the heaviest hitter first. Her first summon of a duel is a **Grand Summon** while her gauge is full, so the first aeon arrives with its Overdrive ready.
 * **Against Anima the first call is a plain Summon** (her gauge is fed by every hit, so a Grand Summon's Overdrive-ready arrival is a mistake there: measured). Yojimbo and the Magus Sisters are not in the line (a Pay and the Sisters' orders are a menu of their own; the bench measures the line without them and says so).
 *
 * **The aeon on the field:**
 * 1. **Shield** when the foe's big move lands before this aeon acts again: its gauge is within one hit of 100 (RE 3: Valefor's Energy Blast, Ifrit's Hellfire, Ixion's Thor's Hammer, Shiva's Diamond Dust, Bahamut's Mega Flare after his five
 *    empty turns, Yojimbo's Zanmato, Anima's Oblivion, the Sisters' Delta Attack when all three are full), read off the CTB order the player sees (`predictTurnOrder`), as the guides say "Shield if it is coming next".
 * 2. **Shield while Ixion guards**: he braces (Defense and Magic Defense 255) or evades (Evasion 255) one turn in two (RE 3.7); a blow into the guard is wasted and charges him by 25, so the line waits behind Shield for the turn he is open.
 * 3. (**Dismiss** an aeon under a third of its HP when another can still be called is an option the bench measured and the line leaves OFF: the call costs Yuna a turn, and it wins the chain 87 percent against 98 without it.)
 * 4. **Its Overdrive** at the foe when the gauge is full (one Overdrive is worth several turns of Attacks).
 * 5. Otherwise **Attack** the weakest foe standing (Mindy before Sandy and Cindy: with any one of the three down, the Delta Attack is over for good, RE 3.12).
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId, FFXCombatant } from '../../battle/common/types.ts';
import type { Tactic } from './common.ts';

/** The eight duels' foes by combatant id (`src/data/ffx/belgemine-ids.ts`), written out here: a tactic imports no data module. Belgemine and Yojimbo's dog are not foes. */
export const BELGEMINE_CHAPTER_BOSS_IDS: readonly CombatantId[] = [
  'belg-valefor', 'belg-ifrit', 'belg-ixion', 'belg-shiva', 'belg-bahamut', 'belg-yojimbo', 'belg-anima', 'belg-mindy', 'belg-sandy', 'belg-cindy',
];

/** The duel a foe id belongs to (the three Sisters are one). */
const DUEL_OF: Readonly<Record<string, string>> = {
  'belg-valefor': 'valefor', 'belg-ifrit': 'ifrit', 'belg-ixion': 'ixion', 'belg-shiva': 'shiva', 'belg-bahamut': 'bahamut', 'belg-yojimbo': 'yojimbo', 'belg-anima': 'anima',
  'belg-mindy': 'sisters', 'belg-sandy': 'sisters', 'belg-cindy': 'sisters',
};

/** What one blow adds to the foe's gauge (RE 3: Valefor +5 for a physical hit, Ifrit +3, Ixion +5 (25 when matching), Shiva +5, Bahamut none, Yojimbo +3, Anima +5, a Sister +5). */
const HIT_GAIN: Readonly<Record<string, number>> = { valefor: 5, ifrit: 3, ixion: 5, shiva: 5, bahamut: 0, yojimbo: 3, anima: 5, sisters: 5 };

const GAUGE_FULL = 100;
/** `state.flags` key prefix of an aeon lock (`battle/ffx/aeon-duel.ts#AEON_LOCK_PREFIX`), restated so this module stays out of the battle layer's import graph. */
const AEON_LOCK_PREFIX = 'aeonDuel.lock:';

/** Yuna's order per duel (see the header), and the choices the bench compares. */
export interface BelgemineLine {
  order: Readonly<Record<string, readonly string[]>>;
  /** Shield when the foe's big move lands before this aeon acts again (read off the CTB order). */
  shieldWhenDue: boolean;
  /** Wait behind Shield while Ixion guards (a blow into the guard is wasted). */
  waitOutGuard: boolean;
  /** Dismiss an aeon under this fraction of its HP when another can be called; 0 never. */
  dismissUnder: number;
  /** The first summon of a duel is a Grand Summon while her gauge is full. */
  grandSummon: boolean;
  /** Yuna calls an aeon whose Overdrive gauge is full before the guides' order (a charged Bahamut or Anima is the guides' answer to the Sisters). */
  preferCharged: boolean;
  /** Which Sister the aeon strikes: the weakest first (Mindy), or Cindy, whose Mighty Guard, Regen and Cura are what stall a long fight. */
  sistersTarget: 'weakest' | 'cindy';
  /** Foes whose duel the aeon fires no Overdrive in (a many-hit blow fills a gauge that is fed by every hit: Anima's, +5 a hit, RE 3.11). */
  holdOverdriveVs: readonly string[];
  /** Foes whose duel opens with a plain Summon, not a Grand Summon (measured per duel; see the bench). */
  noGrandSummonVs: readonly string[];
}

const HEAVY = ['anima', 'bahamut', 'ixion', 'ifrit', 'shiva', 'valefor'] as const;

export const BELGEMINE_INTENDED_LINE: BelgemineLine = {
  order: {
    valefor: HEAVY,
    ifrit: ['shiva', 'ixion', 'anima', 'bahamut', 'valefor'],
    ixion: HEAVY,
    shiva: HEAVY,
    bahamut: ['anima', 'ixion', 'ifrit', 'shiva', 'valefor'],
    yojimbo: HEAVY,
    anima: ['bahamut', 'ixion', 'ifrit', 'shiva', 'valefor'],
    sisters: HEAVY,
  },
  shieldWhenDue: true,
  waitOutGuard: true,
  dismissUnder: 0, // measured: 98 percent of the chain without it, 87 with a Dismiss under a third (the call costs Yuna a turn, and the aeon she calls stands in the same fire)
  grandSummon: true,
  preferCharged: true,
  sistersTarget: 'cindy',
  holdOverdriveVs: [],
  noGrandSummonVs: ['belg-anima'], // measured: against Anima the Grand Summon's ready Overdrive pours many hits into her hit-fed gauge (+5 a hit): her duel is won 88 times in 100 with it and 100 without, the chain's figure unchanged (docs/handoff/ch-belgemine.md section 4)
};

type FFXEngineLike = BattleEngine & { predictTurnOrder?: (n: number, preview?: Command) => { actorId: CombatantId }[] };

/** How many turns `foe` takes before `me` acts again, if `me` Shields now (FFX's CTB forecast). */
function foeTurnsFirst(engine: BattleEngine, me: CombatantId, foe: CombatantId): number {
  const ffx = engine as FFXEngineLike;
  if (typeof ffx.predictTurnOrder !== 'function') return 1;
  const order = ffx.predictTurnOrder(16, { kind: 'ability', id: 'shield', targets: [me] });
  let n = 0;
  for (let i = 1; i < order.length; i++) {
    const id = order[i]!.actorId;
    if (id === me) break;
    if (id === foe) n++;
  }
  return n;
}

const gaugeOf = (c: AnyCombatant | undefined): number => (c as FFXCombatant | undefined)?.overdrive?.gauge ?? 0;

function offered(commands: AvailableCommand[], kind: string, id?: string): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && (c.command as { id: string }).id === id)));
}

/** The foes standing, weakest first (Mindy before Sandy and Cindy). */
function standing(engine: BattleEngine, line: BelgemineLine): AnyCombatant[] {
  const state = engine.state();
  return BELGEMINE_CHAPTER_BOSS_IDS.map((id) => state.combatants[id])
    .filter((c): c is AnyCombatant => !!c && c.side === 'enemy' && c.alive)
    .sort((a, b) => (line.sistersTarget === 'cindy' ? Number(b.id === 'belg-cindy') - Number(a.id === 'belg-cindy') : 0) || a.hp - b.hp);
}

/** True while Ixion guards: braced (Defense and Magic Defense 255) or evading (Evasion 255), read off the stats the player's Scan would show. */
function guarding(foe: AnyCombatant): boolean {
  if (foe.id !== 'belg-ixion') return false;
  const s = foe.stats;
  return s.def >= 255 || s.eva >= 255;
}

/** True when a foe's big move lands before `me` acts again. */
function bigMoveDue(engine: BattleEngine, me: CombatantId, foes: readonly AnyCombatant[]): boolean {
  const duel = DUEL_OF[foes[0]!.id]!;
  const gain = HIT_GAIN[duel] ?? 0;
  const mover = duel === 'sisters' ? foes.find((f) => f.id === 'belg-cindy') : foes[0];
  if (mover === undefined) return false;
  if (duel === 'sisters') {
    if (foes.length < 3 || !foes.every((f) => gaugeOf(f) + gain >= GAUGE_FULL)) return false;
  } else if (gaugeOf(mover) + gain < GAUGE_FULL) return false;
  return foeTurnsFirst(engine, me, mover.id) > 0;
}

/** Is there another aeon the line would call that is not itself failing (alive, not the mirror, not the one on the field, over the Dismiss line)? */
function anotherAeon(engine: BattleEngine, me: CombatantId, line: BelgemineLine, duel: string): boolean {
  const state = engine.state();
  const calls = line.order[duel] ?? [];
  return Object.values(state.combatants).some(
    (c) =>
      c.side === 'aeon' && calls.includes(c.id) && c.id !== me && c.alive && state.flags[AEON_LOCK_PREFIX + c.id] === undefined && !(((c as FFXCombatant).aeon?.reviveCountdown ?? 0) > 0) && c.hp >= c.stats.maxHp * line.dismissUnder,
  );
}

function aeonTurn(line: BelgemineLine, engine: BattleEngine, me: CombatantId, commands: AvailableCommand[], foes: readonly AnyCombatant[]): Command | null {
  const self = engine.state().combatants[me];
  const target = foes[0]!;
  const shield = offered(commands, 'ability', 'shield');
  const shieldMe = shield && shield.validTargets.includes(me) ? ({ ...shield.command, targets: [me] } as Command) : null;

  if (line.shieldWhenDue && shieldMe && bigMoveDue(engine, me, foes)) return shieldMe;
  if (line.waitOutGuard && shieldMe && foes.some(guarding)) return shieldMe;

  // Its Overdrive first, even from an aeon that is failing: a full gauge is worth several Attacks and a dismissed aeon would carry it away unused.
  const od = line.holdOverdriveVs.includes(target.id) ? undefined : offered(commands, 'overdrive');
  if (od) return { ...od.command, targets: od.validTargets.includes(target.id) ? [target.id] : [] } as Command;

  const dismiss = offered(commands, 'dismiss');
  if (line.dismissUnder > 0 && dismiss && self && self.hp < self.stats.maxHp * line.dismissUnder && anotherAeon(engine, me, line, DUEL_OF[target.id] ?? '')) return { ...dismiss.command, targets: [] } as Command;
  const attack = offered(commands, 'attack');
  return attack && attack.validTargets.includes(target.id) ? ({ ...attack.command, targets: [target.id] } as Command) : null;
}

/** An aeon's HP as a fraction of its maximum (1 when the roster has no such combatant). */
function aeonHealth(engine: BattleEngine, id: string): number {
  const c = engine.state().combatants[id];
  return c === undefined ? 1 : c.hp / Math.max(1, c.stats.maxHp);
}

function yunaTurn(line: BelgemineLine, engine: BattleEngine, commands: AvailableCommand[], foes: readonly AnyCombatant[]): Command | null {
  const order = line.order[DUEL_OF[foes[0]!.id]!] ?? [];
  const grand = line.grandSummon && !line.noGrandSummonVs.includes(foes[0]!.id) ? offered(commands, 'overdrive', 'grand-summon') : undefined;
  // The first aeon in the guides' order that is not already failing (the one a Dismiss just sent away would only be dismissed again); when all are failing, the first that is standing.
  const calls = order.filter((id) => offered(commands, 'summon', id) !== undefined);
  const sound = calls.filter((x) => line.dismissUnder <= 0 || aeonHealth(engine, x) >= line.dismissUnder);
  const charged = line.preferCharged ? sound.find((x) => gaugeOf(engine.state().combatants[x]) >= GAUGE_FULL) : undefined;
  const id = charged ?? sound[0] ?? [...calls].sort((a, b) => aeonHealth(engine, b) - aeonHealth(engine, a))[0];
  if (id === undefined) return null;
  if (grand) return { ...grand.command, targets: [], extra: { kind: 'yuna-grand-summon', grandSummon: { aeonId: id } } } as Command;
  return { ...offered(commands, 'summon', id)!.command, targets: [] } as Command;
}

/** The tactic for one line (the bench measures variants; the chapter ships {@link BELGEMINE_INTENDED_LINE}). */
export function belgemineTactic(line: BelgemineLine = BELGEMINE_INTENDED_LINE): Tactic {
  return (actorId, commands, engine) => {
    const foes = standing(engine, line);
    if (foes.length === 0) return null;
    const state = engine.state();
    if (state.aeonId === actorId) return aeonTurn(line, engine, actorId, commands, foes);
    if (actorId === 'yuna') return yunaTurn(line, engine, commands, foes);
    return null;
  };
}

export const belgemineLine: Tactic = belgemineTactic();

export default belgemineLine;
