/**
 * The Luca Opener (Logos and Ormi, then Leblanc, on the docks of Luca; the hidden FFX-2 chapter): the line the guide teaches, as the move advisor's tactic. **FFX-2 only** [AGENTS.md rule 14].
 *
 * ATB, dresspheres and the Syndicate's three plain scripts. Registered under the FFX-2 game in `./lookup.ts`, so an FFX board never reaches it; the combatant ids are the chapter's own `x2-luca-*`.
 *
 * ## The line
 *
 * It is the **advisor line** the chapter's bench measures (`tests/unit/chapters/luca-opener-bench.test.ts`): an input to a measurement, never game data, and nothing in it tunes the boss (hard rule 6;
 * `boss-side-fix-needs-measured-options`). It answers what the research says about them (`research/re-ffx2-luca-opener.md`, Jegged's "Luca" page): both fights are "very easy", Rikku **steals from both** henchmen and from
 * Leblanc, **Logos goes first** (he has 86 HP and a Defense of 2, and he is the one with a Potion for Ormi), then Ormi (Defense 60, 97 HP), and in the second fight Yuna is held to the Songstress and her one command,
 * **Darkness Dance** (Leblanc is not immune to Darkness, so her plain Attacks miss; her Thunder never misses).
 *
 * **Yuna**: 1. a Phoenix Down for a girl down; 2. a Potion for a girl under 40 %; 3. as the Gunner, the plain Attack on the first living of Logos, Ormi, Leblanc; as the Songstress, **Darkness Dance** on Leblanc while she
 * is not Dark, else a Potion for a girl under 70 %, else the Dance again.
 * **Rikku**: a Potion for herself under 30 %; **Steal** once from each enemy that is up (Logos, then Ormi, then Leblanc), else the plain Attack. **Paine**: a Potion for herself under 30 %, else the plain Attack on the first
 * living of Logos, Ormi, Leblanc.
 *
 * Returns `null` (the generic ladder) when none of the three is on the field.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';

/** The chapter's combatant ids, in the order the line takes them: Logos first, then Ormi, then Leblanc (the tactic and the guide register the same ids). */
export const LUCA_OPENER_BOSS_IDS: readonly CombatantId[] = ['x2-luca-logos', 'x2-luca-ormi', 'x2-luca-leblanc'];

/** The offered row for `kind` + `id`, aimed at `targets`. */
function use(commands: AvailableCommand[], kind: string, id: string, targets: CombatantId[]): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id);
  return r ? ({ ...r.command, targets } as Command) : null;
}

/** The plain Attack aimed at `target`. */
function swing(commands: AvailableCommand[], target: CombatantId): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === 'attack');
  return r ? ({ ...r.command, targets: [target] } as Command) : null;
}

/** How many times Rikku has begun a Steal on `target` so far (a log read, so the line needs no memory of its own). */
function stealsOn(engine: BattleEngine, target: CombatantId): number {
  let n = 0;
  for (const e of engine.state().log as ReadonlyArray<{ type: string; actorId?: string; abilityId?: string; targets?: string[] }>) {
    if (e.type === 'action-start' && e.actorId === 'rikku' && e.abilityId === 'x2-thief-steal' && (e.targets ?? []).includes(target)) n += 1;
  }
  return n;
}

function mend(commands: AvailableCommand[], party: AnyCombatant[], below: number): Command | null {
  const ko = party.find((u) => !u.alive);
  if (ko) {
    const back = use(commands, 'item', 'x2-phoenix-down', [ko.id]);
    if (back) return back;
  }
  const lowest = [...party.filter((u) => u.alive)].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  return lowest && hpFraction(lowest) < below ? use(commands, 'item', 'x2-potion', [lowest.id]) : null;
}

export const ffx2LucaOpener: Tactic = (actorId, commands, engine: BattleEngine) => {
  const s = engine.state();
  const foes = LUCA_OPENER_BOSS_IDS.map((id) => s.combatants[id]).filter((c): c is AnyCombatant => c?.side === 'enemy' && c.alive);
  const first = foes[0];
  if (!first) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  if (actorId === 'yuna') {
    const dance = commands.find((c) => c.enabled && c.command.kind === 'ability' && 'id' in c.command && (c.command as { id: string }).id === 'x2-songstress-darkness-dance');
    if (!dance) return mend(commands, party, 0.4) ?? swing(commands, first.id);
    const rescue = mend(commands, party, 0.4);
    if (rescue) return rescue;
    if (!has(first, 'darkness')) return use(commands, 'ability', 'x2-songstress-darkness-dance', [first.id]);
    return mend(commands, party, 0.7) ?? use(commands, 'ability', 'x2-songstress-darkness-dance', [first.id]);
  }
  if (actorId === 'rikku') {
    if (hpFraction(self) < 0.3) {
      const potion = use(commands, 'item', 'x2-potion', [self.id]);
      if (potion) return potion;
    }
    const mark = foes.find((f) => stealsOn(engine, f.id) === 0);
    if (mark) {
      const steal = use(commands, 'ability', 'x2-thief-steal', [mark.id]);
      if (steal) return steal;
    }
    return swing(commands, first.id);
  }
  if (hpFraction(self) < 0.3) {
    const potion = use(commands, 'item', 'x2-potion', [self.id]);
    if (potion) return potion;
  }
  return swing(commands, first.id);
};

export default ffx2LucaOpener;
