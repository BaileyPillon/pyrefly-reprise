/**
 * Valefor at Besaid (FFX-2 Chapter 3, the hidden chapter): the line the guide teaches, as the move advisor's tactic. **FFX-2 only** [AGENTS.md rule 14].
 *
 * ATB, dresspheres and the fallen aeons' action counter. Registered under the FFX-2 game in `./lookup.ts`, so an FFX board (whose Valefor is the aeon `'valefor'`) never reaches it; the
 * combatant id is the chapter's own `x2-valefor`.
 *
 * ## The line
 *
 * It is the **advisor line** the chapter's bench measures (`tests/unit/chapters/besaid-valefor-bench.test.ts`): an input to a measurement, never game data, and nothing in it tunes the boss
 * (hard rule 6; `boss-side-fix-needs-measured-options`). It answers what the research says about her (`research/ffx2-fallen-aeons.md` §7.1): her Normal Attack is the physical hit (STR 97, so
 * **Protect** and a **Power Break** matter), her Energy Ray is magic on all three girls (so **Shell** halves it) while her **Energy Blast is not magic: neither Shell nor Protect softens it** (the RE review of 2026-10-14, m164, row 164: its damage flags are 0, so the answer to it is HP), Sonic Wings chips a little MP from the girl who stands farthest from her (Yuna at the start, who is also the one who
 * casts: hence the Ether), and Breaks and Slow land on her.
 *
 * **Yuna (White Mage)**, in this order:
 * 1. **Revive**: a Phoenix Down (else Life) for a girl down.
 * 2. **An Ether** for herself under 24 MP (Sonic Wings is the move that takes it).
 * 3. **A Mega-Potion** when two girls are under 35 %.
 * 4. **Curaga** (else Cura) for one girl under 45 %.
 * 5. **Protect, then Shell**, whenever anyone lacks them.
 * 6. **Cura** for one girl under 75 %; else **Pray**.
 *
 * **Rikku (Dark Knight)**: a Hi-Potion for herself under 25 %, else Darkness (it ignores her Defense 76). **Paine (Warrior)**: a Hi-Potion under 25 %, else **Power Break** until Valefor
 * is Strength-down, then **Armor Break** until she is Defense-down, then the plain Attack.
 *
 * Returns `null` (the generic ladder) when Valefor is not on the field.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';

/** The chapter's one combatant id: the tactic and the guide register the same id (`src/data/ffx2/enemies/valefor.ts`). */
export const VALEFOR_BESAID_BOSS_IDS: readonly CombatantId[] = ['x2-valefor'];

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
  if (self.mp < 24) {
    const ether = use(commands, 'item', 'x2-ether', [self.id]);
    if (ether) return ether;
  }
  if (below(0.35) >= 2) {
    const all = use(commands, 'item', 'x2-mega-potion', []);
    if (all) return all;
  }
  if (lowest && hpFraction(lowest) < 0.45) {
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
  if (lowest && hpFraction(lowest) < 0.75) {
    const cura = use(commands, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (cura) return cura;
  }
  return use(commands, 'ability', 'x2-white-mage-pray', []);
}

function rikkuTurn(commands: AvailableCommand[], self: AnyCombatant): Command | null {
  if (hpFraction(self) < 0.25) {
    const potion = use(commands, 'item', 'x2-hi-potion', [self.id]);
    if (potion) return potion;
  }
  return use(commands, 'ability', 'x2-dark-knight-darkness', []);
}

function paineTurn(commands: AvailableCommand[], self: AnyCombatant, boss: AnyCombatant): Command | null {
  if (hpFraction(self) < 0.25) {
    const potion = use(commands, 'item', 'x2-hi-potion', [self.id]);
    if (potion) return potion;
  }
  if (!has(boss, 'str-down')) {
    const power = use(commands, 'ability', 'x2-warrior-power-break', [boss.id]);
    if (power) return power;
  }
  if (!has(boss, 'def-down')) {
    const armor = use(commands, 'ability', 'x2-warrior-armor-break', [boss.id]);
    if (armor) return armor;
  }
  const swing = commands.find((c) => c.enabled && c.command.kind === 'attack');
  return swing ? ({ ...swing.command, targets: [boss.id] } as Command) : null;
}

export const ffx2ValeforBesaid: Tactic = (actorId, commands, engine: BattleEngine) => {
  const s = engine.state();
  const boss = VALEFOR_BESAID_BOSS_IDS.map((id) => s.combatants[id]).find((c) => c?.side === 'enemy' && c.alive);
  if (!boss) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  if (actorId === 'yuna') return yunaTurn(commands, self, party);
  if (actorId === 'rikku') return rikkuTurn(commands, self);
  return paineTurn(commands, self, boss);
};

export default ffx2ValeforBesaid;
