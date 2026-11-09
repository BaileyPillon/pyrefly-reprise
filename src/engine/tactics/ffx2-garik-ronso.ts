/**
 * Garik Ronso and the Ronso Youths at the top of Mt. Gagazet (FFX-2 Chapter 3, the hidden chapter): the line the guide teaches, as the move advisor's tactic. **FFX-2 only** [AGENTS.md rule 14].
 *
 * ATB, dresspheres and the game's own two scripts. Registered under the FFX-2 game in `./lookup.ts`, so an FFX board (whose Ronso are Kimahri, Biran and Yenke) never reaches it; the combatant ids are the chapter's own `x2-`
 * ones, five bodies for the two fights (the hostile pair of Youths and Garik, the bout's Youth and Garik).
 *
 * ## The line
 *
 * It is the **advisor line** the chapter's bench measures (`tests/unit/chapters/garik-ronso-bench.test.ts`): an input to a measurement, never game data, and nothing in it tunes the boss (hard rule 6;
 * `boss-side-fix-needs-measured-options`). It answers what the rows and scripts say (`research/re-ffx2-garik-ronso.md`): **everything he and the Youths do is physical or a status** (Attack, Bane Lance, the Youth's Attack and MP Blowout
 * are all blows; Blind, Curse and Mighty Guard are statuses), so **Protect** is the girls' wall and Shell does nothing here; the Dark Knight's **Darkness** is special damage, ignores Defense, is not reduced by their Protect or their
 * raised Defense, and hits every Ronso on the field. **The line never wears Black Mage** (Bane Lance curses a Black Mage and a cursed girl cannot Change, so the dress stays on); and nobody is told to Dispel, because Darkness
 * ignores Shell, Protect and Defense and a single Dispel costs a whole turn.
 *
 * **Yuna (White Mage)**, in this order:
 * 1. **Revive**: a Phoenix Down (else Life) for a girl down.
 * 2. **Curaga** (else Cura) for the girl lowest under 45 %.
 * 3. **Protect** whenever anyone lacks it.
 * 4. **Cura** for one girl under 75 %; else **Pray**.
 *
 * **Rikku and Paine (Dark Knights)**: a Hi-Potion for herself under 25 %, else **Darkness**.
 *
 * Returns `null` (the generic ladder) when none of the chapter's bodies is on the field.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';

/** The chapter's combatant ids: the tactic and the guide register the same ids (`src/data/garik-ronso-ids.ts`). */
export const GARIK_RONSO_BOSS_IDS: readonly CombatantId[] = ['x2-garik-ronso', 'x2-ronso-youth-a', 'x2-ronso-youth-b', 'x2-garik-ronso-bout', 'x2-ronso-youth-bout'];

/** The offered row for `kind` + `id`, aimed at `targets`. */
function use(commands: AvailableCommand[], kind: string, id: string, targets: CombatantId[]): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id);
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

export const ffx2GarikRonso: Tactic = (actorId, commands, engine: BattleEngine) => {
  const s = engine.state();
  const onField = GARIK_RONSO_BOSS_IDS.map((id) => s.combatants[id]).some((c) => c?.side === 'enemy' && c.alive);
  if (!onField) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  if (actorId === 'yuna') return yunaTurn(commands, party);
  return knightTurn(commands, self);
};

export default ffx2GarikRonso;
