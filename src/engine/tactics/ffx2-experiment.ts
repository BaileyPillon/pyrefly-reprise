/**
 * The Experiment (FFX-2 Chapter 5, Djose Temple; our hidden chapter "The Experiment"): the line the sources' clears use. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Registered under the FFX-2 game in `./lookup.ts`, so an FFX board never reaches it; the combatant id is the chapter's own `x2-experiment`. The line is written to
 * win **every** choice of levels the prep tab offers, and is measured on all of them (`tests/unit/chapters/experiment-bench.test.ts`).
 *
 * ## The line
 *
 * The guides' clear (Jegged's Chapter 5 Djose page, the wiki, `research/ffx2-experiment.md`): two Dark Knights on **Darkness**, which ignores Defense (the Experiment's Defense
 * climbs to 205), and a White Mage who puts **Protect** up before anything else (the wiki: "having Protect up at the start of the battle mitigates the damage"), then **Shell** when
 * the Annihilator is on its list, keeps the party healed and raises whoever Lifeslicer or a Rocket Launcher put down.
 *
 * **Yuna (White Mage)**, in this order:
 * 1. **Revive**: a Phoenix Down (else Life) for a girl down.
 * 2. **An Ether** for herself under 24 MP.
 * 3. **Protect**, then **Shell** (only when the Annihilator is among the Experiment's actions), whenever anyone lacks it.
 * 4. **A Mega-Potion** when two are under 35 %; **Curaga** (else Cura) for one under 45 %.
 * 5. **Cura** for one under 75 %; else **Pray**.
 *
 * **The Dark Knights**: a Hi-Potion for herself under 25 %, else Darkness.
 *
 * Returns `null` (the generic ladder) when the Experiment is not on the field.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { EXPERIMENT_ACTIONS } from '../../data/ffx2/enemies/experiment-levels.ts';
import { EXPERIMENT_BODY_IDS } from '../../data/ffx2/enemies/experiment.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';

/** The chapter's two bodies, Act I's prototype and Act II's full weapon: the tactic and the guide register the same ids. */
export const EXPERIMENT_BOSS_IDS: readonly CombatantId[] = EXPERIMENT_BODY_IDS;

/** The offered row for `kind` + `id`, aimed at `targets`. */
function use(commands: AvailableCommand[], kind: string, id: string, targets: CombatantId[]): Command | null {
  const r = commands.find(
    (c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id,
  );
  return r ? ({ ...r.command, targets } as Command) : null;
}

/** True when the Experiment can fire the Annihilator (its Special track is at Level 5), read off the field. */
export function annihilatorOnTheField(engine: BattleEngine): boolean {
  for (const id of EXPERIMENT_BOSS_IDS) {
    const boss = engine.state().combatants[id] as unknown as { abilityIds?: readonly string[]; alive?: boolean } | undefined;
    if (boss?.alive !== false && boss?.abilityIds?.includes(EXPERIMENT_ACTIONS.annihilator) === true) return true;
  }
  return false;
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
  if (living.some((u) => !has(u, 'protect'))) {
    const protect = use(commands, 'ability', 'x2-white-mage-protect', []);
    if (protect) return protect;
  }
  if (annihilatorOnTheField(engine) && living.some((u) => !has(u, 'shell'))) {
    const shell = use(commands, 'ability', 'x2-white-mage-shell', []) ?? use(commands, 'item', 'x2-lunar-curtain', []);
    if (shell) return shell;
  }
  if (below(0.35) >= 2) {
    const all = use(commands, 'item', 'x2-mega-potion', []) ?? use(commands, 'ability', 'x2-white-mage-pray', []);
    if (all) return all;
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

export const ffx2Experiment: Tactic = (actorId, commands, engine) => {
  const s = engine.state();
  const on = EXPERIMENT_BOSS_IDS.some((id) => s.combatants[id]?.side === 'enemy' && s.combatants[id]?.alive);
  if (!on) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  return actorId === 'yuna' ? yunaTurn(commands, engine, self, party) : knightTurn(commands, self);
};

export default ffx2Experiment;
