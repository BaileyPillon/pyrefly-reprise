/**
 * Angra Mainyu, Zarich and Tawrich (FFX-2 Chapter 5, the mission "Showdown in the Sands"; the hidden chapter): the line the guide teaches, as the move advisor's tactic. **FFX-2 only** [AGENTS.md rule 14].
 *
 * ATB, dresspheres and the game's own three scripts (`research/re-ffx2-angra-mainyu.md` §9). Registered under the FFX-2 game in `./lookup.ts`, so an FFX board never reaches it; the combatant ids are the chapter's own
 * (`x2-angra-mainyu`, `x2-zarich`, `x2-tawrich`).
 *
 * ## The line
 *
 * It is the **advisor line** the chapter's bench measures (`tests/unit/chapters/angra-mainyu-bench.test.ts`): an input to a measurement, never game data, and nothing in it tunes the boss (hard rule 6;
 * `boss-side-fix-needs-measured-options`). It is Jegged's first answer to the fight (`research/ffx2-angra-mainyu.md` §5): **one girl heals and two Dark Knights use Darkness**, which is neither physical nor
 * magical, so it reaches the body and both arms (Zarich is immune to physical damage and Tawrich to magical damage, `[inferred]`). It answers what the rows say: Perdition's Flame is physical (so **Protect** halves
 * it, Shell does not), Flare, Demi and Zarich's spells are magical (so **Shell** halves them), Bio and Bloody Breath poison and silence, Zarich's Glimmer of Despair drains MP and lowers stats.
 *
 * **Yuna (White Mage)**, in this order:
 * 1. **Revive**: a Phoenix Down (else Life) for a girl down (a Flame can drop one).
 * 2. **A Turbo Ether** for herself under 40 MP (Glimmer of Despair and Osmose take it).
 * 3. **A Remedy** for herself while Silenced (a Silenced White Mage cannot heal).
 * 4. **A Mega-Potion** when two girls are under 45 %.
 * 5. **Curaga** (else Cura) for one girl under 50 %.
 * 6. **Protect, then Shell**, whenever anyone lacks them.
 * 7. **Esuna** for a girl who is Poisoned or Confused; **Cura** for one girl under 75 %; else **Pray**.
 *
 * **Rikku and Paine (Dark Knights)**: a Hi-Potion for herself under 30 % (Darkness costs the user HP), else **Darkness**.
 *
 * Returns `null` (the generic ladder) when Angra Mainyu is not on the field.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';

/** The chapter's three combatant ids: the tactic and the guide register the same ids (`src/data/angra-mainyu-ids.ts`). */
export const ANGRA_MAINYU_BOSS_IDS: readonly CombatantId[] = ['x2-angra-mainyu', 'x2-zarich', 'x2-tawrich'];

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
  const lowest = [...living].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  const below = (f: number): number => living.filter((u) => hpFraction(u) < f).length;
  if (self.mp < 40) {
    const ether = use(commands, 'item', 'x2-turbo-ether', [self.id]);
    if (ether) return ether;
  }
  if (has(self, 'silence')) {
    const remedy = use(commands, 'item', 'x2-remedy', [self.id]);
    if (remedy) return remedy;
  }
  if (below(0.45) >= 2) {
    const all = use(commands, 'item', 'x2-mega-potion', []);
    if (all) return all;
  }
  if (lowest && hpFraction(lowest) < 0.5) {
    const one = use(commands, 'ability', 'x2-white-mage-curaga', [lowest.id]) ?? use(commands, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (one) return one;
  }
  if (living.some((u) => !has(u, 'protect'))) {
    const protect = use(commands, 'ability', 'x2-white-mage-protect', []);
    if (protect) return protect;
  }
  if (living.some((u) => !has(u, 'shell'))) {
    const shell = use(commands, 'ability', 'x2-white-mage-shell', []);
    if (shell) return shell;
  }
  const sick = living.find((u) => has(u, 'poison') || has(u, 'confuse'));
  if (sick) {
    const esuna = use(commands, 'ability', 'x2-white-mage-esuna', [sick.id]);
    if (esuna) return esuna;
  }
  if (lowest && hpFraction(lowest) < 0.75) {
    const cura = use(commands, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (cura) return cura;
  }
  return use(commands, 'ability', 'x2-white-mage-pray', []);
}

function darkKnightTurn(commands: AvailableCommand[], self: AnyCombatant): Command | null {
  if (hpFraction(self) < 0.3) {
    const potion = use(commands, 'item', 'x2-hi-potion', [self.id]);
    if (potion) return potion;
  }
  return use(commands, 'ability', 'x2-dark-knight-darkness', []);
}

export const ffx2AngraMainyu: Tactic = (actorId, commands, engine: BattleEngine) => {
  const s = engine.state();
  const body = s.combatants['x2-angra-mainyu'];
  if (!body || body.side !== 'enemy' || !body.alive) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  if (actorId === 'yuna') return yunaTurn(commands, self, party);
  return darkKnightTurn(commands, self);
};

export default ffx2AngraMainyu;
