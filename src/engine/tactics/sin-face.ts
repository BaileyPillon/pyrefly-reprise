/**
 * The intended line for **Chapter XVIII, "Sin: the Face"**: Overdrive Sin over Bevelle, a burst against a clock.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3]. The line is research §8 row 8
 * ([verified: 4 sources]) with row 9 (Wards against Gaze) answered by the preset's own armour, and it is the
 * link-4 bench's **sensible** line (`tests/unit/helpers/sinPolicies.ts`, `docs/plans/sin-link4-bench.md`) put
 * into the game, so the move advisor's card and the guide's NEXT say what the bench measured:
 *
 * 1. **Upkeep**: a Soft on a Petrify, a Remedy on a Confuse, a Phoenix Down on a KO, Holy Water on a Zombie
 *    under 35 %, a potion under 35 % (§7.3 item 5).
 * 2. **Haste first**: Hastega while two actives lack it, Haste on the last one (row 8).
 * 3. **An Overdrive whenever one reaches** (row 8: "Overdrives ... to finish"; nothing is worth holding past
 *    the clock).
 * 4. **During the three pulls** (FAR, §5.4): Tidus Cheers to five, Wakka swings, Lulu casts Firaga, and Yuna
 *    and Auron make way for Wakka and Lulu from the bench (a switch costs no turn).
 * 5. **In reach**: Auron comes back for Armor Break (then Mental Break for Lulu), the moment it is in range;
 *    everyone else swings, Lulu keeps casting, Yuna makes way.
 *
 * Aeons are not used, as in the bench: the preset's aeon gauges are not full (said in the bench plan). The
 * clock is the script's own, the 12th turn (re-parity AI lane C, D-31); the tactic reads it from `sin.turnsLeft`. Nothing here changes a boss number.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { OVERDRIVE_SIN_ID } from '../../battle/ffx/ai/overdrive-sin-rules.ts';
import { type Tactic, activeParty, aim, has, hpFraction, row, stacksOf } from './common.ts';
import { foe, rangeOf } from './sin-common.ts';

/** Chapter XVIII fields one boss. */
export const SIN_FACE_BOSS_IDS: readonly CombatantId[] = [OVERDRIVE_SIN_ID];

/** The bench's potion line: under this fraction of max HP. */
const POTION_AT = 0.35;

const SIN = OVERDRIVE_SIN_ID;

function at(commands: AvailableCommand[], labels: readonly string[], target: CombatantId): Command | null {
  const r = row(commands, labels, target);
  return r ? aim(r, target) : null;
}

/** A switch row that brings `name` in (the row's label is the member's name). */
function bring(commands: AvailableCommand[], engine: BattleEngine, id: CombatantId): Command | null {
  if (!engine.state().reserveIds.includes(id)) return null;
  const r = commands.find((c) => c.enabled && c.command.kind === 'switch' && c.label.toLowerCase() === id);
  return r ? r.command : null;
}

function upkeep(actorId: CombatantId, commands: AvailableCommand[], party: AnyCombatant[]): Command | null {
  for (const c of party) {
    if (c.id === actorId) continue;
    if (has(c, 'petrify')) return at(commands, ['Soft', 'Remedy'], c.id);
    if (has(c, 'confuse')) return at(commands, ['Remedy'], c.id);
    if (!c.alive) return at(commands, ['Phoenix Down', 'Mega Phoenix'], c.id);
  }
  for (const c of party) {
    if (!c.alive || hpFraction(c) >= POTION_AT) continue;
    if (has(c, 'zombie')) return at(commands, ['Holy Water'], c.id);
    return at(commands, ['X-Potion', 'Hi-Potion'], c.id);
  }
  return null;
}

export const sinFace: Tactic = (actorId, commands, engine) => {
  const party = activeParty(engine);
  const me = party.find((c) => c.id === actorId);
  if (!me) return null;
  const sin = foe(engine, SIN);
  if (!sin) return null;
  const far = rangeOf(engine) === 'far';

  const fix = upkeep(actorId, commands, party);
  if (fix) return fix;

  const unhasted = party.filter((c) => c.alive && !has(c, 'haste'));
  if (unhasted.length >= 2) {
    const r = row(commands, ['Hastega']);
    if (r) return aim(r, actorId);
  }
  if (unhasted.length === 1) {
    const r = at(commands, ['Haste'], unhasted[0]!.id);
    if (r) return r;
  }

  const od = commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes(SIN));
  if (od) return aim(od, SIN);

  // Lulu out of Firaga's MP drinks an Ether, then a Turbo Ether.
  if (actorId === 'lulu' && me.mp < 16) {
    const mp = at(commands, ['Ether', 'Turbo Ether'], actorId);
    if (mp) return mp;
  }

  const swing = (): Command | null => {
    const r = commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(SIN));
    return r ? aim(r, SIN) : null;
  };

  if (far) {
    if (actorId === 'tidus') {
      const short = party.some((c) => stacksOf(c, 'cheer') < 5);
      const cheer = short ? row(commands, ['Cheer']) : undefined;
      return cheer ? aim(cheer, actorId) : null;
    }
    if (actorId === 'wakka') return swing();
    if (actorId === 'lulu') return at(commands, ['Firaga', 'Fira'], SIN);
    return bring(commands, engine, 'wakka') ?? bring(commands, engine, 'lulu');
  }

  // In reach: Auron back for the Breaks; whoever else stands is the damage.
  const broken = has(sin, 'armor-break');
  if (!broken && actorId !== 'auron' && (actorId === 'tidus' || actorId === 'yuna')) {
    const auron = bring(commands, engine, 'auron');
    if (auron) return auron;
  }
  if (actorId === 'auron') {
    if (!broken) return at(commands, ['Armor Break'], SIN);
    if (!has(sin, 'mental-break') && party.some((c) => c.id === 'lulu')) return at(commands, ['Mental Break'], SIN) ?? swing();
  }
  if (actorId === 'lulu') return at(commands, ['Firaga'], SIN) ?? swing();
  if (actorId === 'yuna') {
    for (const next of ['auron', 'wakka', 'lulu']) {
      const r = bring(commands, engine, next);
      if (r) return r;
    }
  }
  return swing();
};

export default sinFace;
