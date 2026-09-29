/**
 * Chapter XVI — Ixion at Djose: the line the sources' clears use [research/ffx2-ixion-djose.md §4.5].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, the fallen aeons' action counter. Registered
 * under the FFX-2 game in `./lookup.ts`, so an FFX board (whose Ixion is the aeon `'ixion'`) never reaches it; the
 * combatant id is the chapter's own `x2-ixion`.
 *
 * ## The line
 *
 * It is the **sensible** line of the chapter's bench, written as a tactic (`tests/unit/helpers/ixionDrive.ts`,
 * `docs/plans/ixion-bench.md`: 191 / 200 at human pace as built): two Dark Knights on Darkness and a White Mage
 * (Split_Infinity's party, §4.5), Shell and Protect up, heal, and **answer the tell**: when Ixion's last action was
 * Recharge and Thor's Hammer has not come yet, Shell first, then everyone as high as she can get them
 * (Split_Infinity: "heal as soon as you see Recharge", `[verified: 3 sources]` that the Hammer is next).
 *
 * **Yuna (White Mage)**, in this order:
 * 1. **Revive**: a Phoenix Down (else Life) for a girl down.
 * 2. **An Ether** for herself under 24 MP.
 * 3. **The tell** (his last action was Recharge): Shell if anyone lacks it; a Mega-Potion (else Pray) when two are
 *    under 70 %; Curaga for one under 90 %.
 * 4. **A Mega-Potion** when two are under 35 %; **Curaga** (else Cura) for one under 45 %.
 * 5. **Shell, then Protect**, whenever anyone lacks them.
 * 6. **Cura** for one under 75 %; else **Pray**.
 *
 * **The Dark Knights**: a Hi-Potion for herself under 25 %, else Darkness (it ignores his Defense 106).
 *
 * Returns `null` (the generic ladder) when Ixion is not on the field.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';

/** The chapter's one combatant id: the tactic and the guide register the same id. */
export const IXION_DJOSE_BOSS_IDS: readonly CombatantId[] = ['x2-ixion'];

/** Ixion's Recharge, the tell (`src/data/ffx2/enemies/ixion-djose-abilities.ts`). */
export const IXION_RECHARGE_ID = 'x2-ixion-recharge';

/** True when Ixion's last action was Recharge: the Hammer is next and has not come (what the screen shows). */
export function ixionTellIsUp(engine: BattleEngine): boolean {
  const log = engine.state().log;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i] as { type: string; actorId?: string; abilityId?: string };
    if (e.type === 'action-start' && e.actorId === IXION_DJOSE_BOSS_IDS[0]) return e.abilityId === IXION_RECHARGE_ID;
  }
  return false;
}

/** The offered row for `kind` + `id`, aimed at `targets`. */
function use(commands: AvailableCommand[], kind: string, id: string, targets: CombatantId[]): Command | null {
  const r = commands.find(
    (c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id,
  );
  return r ? ({ ...r.command, targets } as Command) : null;
}

function yunaTurn(commands: AvailableCommand[], engine: BattleEngine, self: AnyCombatant, party: AnyCombatant[]): Command | null {
  const ko = party.find((u) => !u.alive);
  if (ko) {
    const back = use(commands, 'item', 'x2-phoenix-down', [ko.id]) ?? use(commands, 'ability', 'x2-white-mage-life', [ko.id]);
    if (back) return back;
  }
  const living = party.filter((u) => u.alive);
  const lowest = [...living].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  const below = (f: number): number => living.filter((u) => hpFraction(u) < f).length;
  if (self.mp < 24) {
    const ether = use(commands, 'item', 'x2-ether', [self.id]);
    if (ether) return ether;
  }
  if (ixionTellIsUp(engine)) {
    if (living.some((u) => !has(u, 'shell'))) {
      const shell = use(commands, 'ability', 'x2-white-mage-shell', []) ?? use(commands, 'item', 'x2-lunar-curtain', []);
      if (shell) return shell;
    }
    if (below(0.7) >= 2) {
      const all = use(commands, 'item', 'x2-mega-potion', []) ?? use(commands, 'ability', 'x2-white-mage-pray', []);
      if (all) return all;
    }
    if (lowest && hpFraction(lowest) < 0.9) {
      const one = use(commands, 'ability', 'x2-white-mage-curaga', [lowest.id]);
      if (one) return one;
    }
  }
  if (below(0.35) >= 2) {
    const all = use(commands, 'item', 'x2-mega-potion', []);
    if (all) return all;
  }
  if (lowest && hpFraction(lowest) < 0.45) {
    const one = use(commands, 'ability', 'x2-white-mage-curaga', [lowest.id]) ?? use(commands, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (one) return one;
  }
  if (living.some((u) => !has(u, 'shell'))) {
    const shell = use(commands, 'ability', 'x2-white-mage-shell', []);
    if (shell) return shell;
  }
  if (living.some((u) => !has(u, 'protect'))) {
    const protect = use(commands, 'ability', 'x2-white-mage-protect', []);
    if (protect) return protect;
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

export const ffx2IxionDjose: Tactic = (actorId, commands, engine) => {
  const s = engine.state();
  const on = IXION_DJOSE_BOSS_IDS.some((id) => s.combatants[id]?.side === 'enemy' && s.combatants[id]?.alive);
  if (!on) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  return actorId === 'yuna' ? yunaTurn(commands, engine, self, party) : knightTurn(commands, self);
};

export default ffx2IxionDjose;
