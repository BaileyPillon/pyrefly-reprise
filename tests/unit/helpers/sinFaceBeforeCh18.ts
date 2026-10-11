/**
 * **The Chapter XVIII line as it was before CH-XVIII** (`src/engine/tactics/sin-face.ts` at `919f2c78`, re-parity W2's tree):
 * one Firaga a Lulu turn, an Ether only under 16 MP. Kept byte for byte (imports re-pointed, the export renamed) so the ladder
 * (`tests/unit/re-parity-ch18-ladder.test.ts`) can still measure "the old line" on any later tree, the way `sinPolicies.ts` keeps
 * the bench's. **FFX only.** Test-only; nothing imports it but the ladder.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../../src/battle/common/types.ts';
import { OVERDRIVE_SIN_ID } from '../../../src/battle/ffx/ai/overdrive-sin-rules.ts';
import { type Tactic, activeParty, aim, has, hpFraction, row, stacksOf } from '../../../src/engine/tactics/common.ts';
import { foe, rangeOf } from '../../../src/engine/tactics/sin-common.ts';

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

export const sinFaceBeforeCh18: Tactic = (actorId, commands, engine) => {
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

