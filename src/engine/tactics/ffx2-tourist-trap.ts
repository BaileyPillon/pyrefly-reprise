/**
 * Yojimbo in the Cavern of the Stolen Fayth (the optional FFX-2 mission "Tourist Trap"; our hidden chapter): the line the sources' clears use. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Registered under the FFX-2 game in `./lookup.ts`, so an FFX board never reaches it; the chapter's boss is `x2-yojimbo` (Daigoro, `x2-daigoro`, cannot be targeted and is never aimed at).
 * The line is an input to a measurement, and nothing in the boss was tuned to it (D-410): `tests/unit/chapters/tourist-trap-bench.test.ts` plays it.
 *
 * ## The line
 *
 * The research's strategy (`research/ffx-yojimbo.md` section 8.2, `[verified: 2 sources: wiki, FFExodus]`): protect against his Poison, put two hard hitters on him, keep someone who
 * heals the whole party for the turn after Zanmato (a Mega-Potion, or a Mix), and expect Zanmato on his 14th turn. The preset's girls are Yuna the White Mage and two Dark Knights
 * (Darkness ignores Defense; the Dark Knights' own Poisonproof is learned), so:
 *
 * **Yuna (White Mage)**, in this order:
 * 1. **Revive**: a Phoenix Down (else Life) for a girl down.
 * 2. **Esuna** (else a Remedy) for a girl who is poisoned, the Poison Kozuka leaves.
 * 3. **An Ether** for herself under 24 MP (Kozuka takes a quarter of one girl's MP, Zanmato all but one).
 * 4. **Protect** whenever anyone lacks it: Wakizashi and Daigoro are physical.
 * 5. **A Mega-Potion** when two are under 35 percent (the heal for the turn after Zanmato); **Curaga** (else Cura) for one under 45 percent.
 * 6. **Cura** for one under 75 percent; else **Pray**.
 *
 * **The Dark Knights**: a Hi-Potion for herself under 25 percent (after Zanmato they stand at 1 HP), else Darkness.
 *
 * Returns `null` (the generic ladder) when Yojimbo is not on the field.
 */

import type { AnyCombatant, AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';
import { X2_YOJIMBO_ID } from '../../data/ffx2/enemies/tourist-trap.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';

/** The chapter's boss: the tactic and the guide register this id. */
export const TOURIST_TRAP_BOSS_IDS: readonly CombatantId[] = [X2_YOJIMBO_ID];

/** The offered row for `kind` + `id`, aimed at `targets`. */
function use(commands: AvailableCommand[], kind: string, id: string, targets: CombatantId[]): Command | null {
  const r = commands.find(
    (c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id,
  );
  return r ? ({ ...r.command, targets } as Command) : null;
}

function yunaTurn(commands: AvailableCommand[], self: AnyCombatant, party: AnyCombatant[]): Command | null {
  const ko = party.find((u) => !u.alive);
  if (ko) {
    const back = use(commands, 'item', 'x2-phoenix-down', [ko.id]) ?? use(commands, 'ability', 'x2-white-mage-life', [ko.id]);
    if (back) return back;
  }
  const living = party.filter((u) => u.alive);
  const poisoned = living.find((u) => has(u, 'poison'));
  if (poisoned) {
    const cure = use(commands, 'ability', 'x2-white-mage-esuna', [poisoned.id]) ?? use(commands, 'item', 'x2-remedy', [poisoned.id]);
    if (cure) return cure;
  }
  const lowest = [...living].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  const below = (f: number): number => living.filter((u) => hpFraction(u) < f).length;
  if (self.mp < 24) {
    const ether = use(commands, 'item', 'x2-ether', [self.id]);
    if (ether) return ether;
  }
  if (below(0.35) >= 2) {
    const all = use(commands, 'item', 'x2-mega-potion', []) ?? use(commands, 'ability', 'x2-white-mage-pray', []);
    if (all) return all;
  }
  if (living.some((u) => !has(u, 'protect'))) {
    const protect = use(commands, 'ability', 'x2-white-mage-protect', []);
    if (protect) return protect;
  }
  if (lowest && hpFraction(lowest) < 0.45) {
    const one = use(commands, 'ability', 'x2-white-mage-curaga', [lowest.id]) ?? use(commands, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (one) return one;
  }
  if (lowest && hpFraction(lowest) < 0.75) {
    const cura = use(commands, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (cura) return cura;
  }
  return use(commands, 'ability', 'x2-white-mage-pray', []);
}

function knightTurn(commands: AvailableCommand[], self: AnyCombatant): Command | null {
  if (hpFraction(self) < 0.25) {
    const potion = use(commands, 'item', 'x2-hi-potion', [self.id]);
    if (potion) return potion;
  }
  return use(commands, 'ability', 'x2-dark-knight-darkness', []);
}

export const ffx2TouristTrap: Tactic = (actorId, commands, engine) => {
  const s = engine.state();
  const on = TOURIST_TRAP_BOSS_IDS.some((id) => s.combatants[id]?.side === 'enemy' && s.combatants[id]?.alive);
  if (!on) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  return actorId === 'yuna' ? yunaTurn(commands, self, party) : knightTurn(commands, self);
};

export default ffx2TouristTrap;
