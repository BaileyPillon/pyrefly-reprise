/**
 * Ifrit at Kilika Temple (FFX-2 Chapter 3, the hidden chapter): the line the guide teaches, as the move advisor's tactic. **FFX-2 only** [AGENTS.md rule 14].
 *
 * ATB, dresspheres and the fallen aeons' action counter. Registered under the FFX-2 game in `./lookup.ts`, so an FFX board (whose Ifrit is the aeon `'ifrit'`) never reaches it; the combatant id is the chapter's own `x2-ifrit`.
 *
 * ## The line
 *
 * It is the **advisor line** the chapter's bench measures (`tests/unit/chapters/ifrit-kilika-bench.test.ts`): an input to a measurement, never game data, and nothing in it tunes the boss (hard rule 6;
 * `boss-side-fix-needs-measured-options`). It answers what the research says about him (`research/re-ffx2-ifrit-kilika.md`, `research/ffx2-fallen-aeons.md` §7.1): his plain Attack is the physical hit (Strength 82, two turns in
 * three of the ordinary ones, so **Protect** and a **Power Break** matter); Firaga, Meteor Strike and Hellfire are all **magic**, so **Shell** halves every one of them; **he absorbs Fire**, so nothing the line does is Fire (a Fire
 * spell would heal him); his Defense of 98 is the wall (**Darkness** ignores it, **Armor Break** lowers it); Breaks and Slow land, Gravity does nothing.
 *
 * **Yuna (White Mage)**, in this order:
 * 1. **Revive**: a Phoenix Down (else Life) for a girl down.
 * 2. **Curaga** (else Cura) for the girl lowest under 45 %.
 * 3. **Protect, then Shell**, whenever anyone lacks them.
 * 4. **Cura** for one girl under 75 %; else **Pray**.
 *
 * (The Chapter 2 preset's bag holds no Mega-Potion, so the Valefor line's rule for one is left out here; the Djose preset, which holds five, is a bench what-if and plays the same line.)
 *
 * **Rikku (Dark Knight)**: a Hi-Potion for herself under 25 %, else Darkness (it ignores his Defense 98). **Paine (Warrior)**: a Hi-Potion under 25 %, else **Armor Break** until he is Defense-down, then **Power Break** until he is
 * Strength-down, then the plain Attack.
 *
 * Returns `null` (the generic ladder) when Ifrit is not on the field.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';

/** The chapter's one combatant id: the tactic and the guide register the same id (`src/data/ffx2/enemies/ifrit.ts`). */
export const IFRIT_KILIKA_BOSS_IDS: readonly CombatantId[] = ['x2-ifrit'];

/** The offered row for `kind` + `id`, aimed at `targets`. */
function use(commands: AvailableCommand[], kind: string, id: string, targets: CombatantId[]): Command | null {
  const r = commands.find(
    (c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id,
  );
  return r ? ({ ...r.command, targets } as Command) : null;
}

function yunaTurn(commands: AvailableCommand[], party: AnyCombatant[]): Command | null {
  const ko = party.find((u) => !u.alive);
  if (ko) {
    const back = use(commands, 'item', 'x2-phoenix-down', [ko.id]) ?? use(commands, 'ability', 'x2-white-mage-life', [ko.id]);
    if (back) return back;
  }
  const living = party.filter((u) => u.alive);
  const lowest = [...living].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
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
  if (!has(boss, 'def-down')) {
    const armor = use(commands, 'ability', 'x2-warrior-armor-break', [boss.id]);
    if (armor) return armor;
  }
  if (!has(boss, 'str-down')) {
    const power = use(commands, 'ability', 'x2-warrior-power-break', [boss.id]);
    if (power) return power;
  }
  const swing = commands.find((c) => c.enabled && c.command.kind === 'attack');
  return swing ? ({ ...swing.command, targets: [boss.id] } as Command) : null;
}

export const ffx2IfritKilika: Tactic = (actorId, commands, engine: BattleEngine) => {
  const s = engine.state();
  const boss = IFRIT_KILIKA_BOSS_IDS.map((id) => s.combatants[id]).find((c) => c?.side === 'enemy' && c.alive);
  if (!boss) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  if (actorId === 'yuna') return yunaTurn(commands, party);
  if (actorId === 'rikku') return rikkuTurn(commands, self);
  return paineTurn(commands, self, boss);
};

export default ffx2IfritKilika;
