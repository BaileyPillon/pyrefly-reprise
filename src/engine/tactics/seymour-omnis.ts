/**
 * Chapter XII — Seymour Omnis, in the Garden of Pain inside Sin: the line the fight is beaten
 * with on the approved build [research/ffx-seymour-omnis.md §5].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. CTB, Nul spells, Armor Break, the party switch.
 * Registered under the FFX game in `./lookup.ts`, so an FFX-2 board never reaches it.
 *
 * ## The line, and where each rule comes from
 *
 * It is the **intended** line of `tests/unit/chapters/omnis-bench.test.ts`, which wins 127 of
 * 200 seeds on the real engine and the Garden of Pain build, Phantom Ring on Yuna (B6 = a;
 * `docs/plans/omnis-bench.md`), written as a tactic, rule for rule:
 *
 * 1. **Keep everyone up.** Yuna's Life (else a Phoenix Down) for a fallen member; an Ether for a
 *    caster under 60 MP; then heal the lowest member below 45 % of max HP, or **below 4,200
 *    while he glows or has Dispelled** (research §5 row 6, verified: 4 sources: Ultima is about
 *    3,600 at this party's Magic Defense, §3.3).
 * 2. **Tidus hands his turn to Wakka**, the one member who turns a disc with a blow (§2,
 *    verified: 4 sources; §4.3). Finding him is part of the puzzle (B2 = a).
 * 3. **Auron lands Armor Break**, then hits: Defense 180 turns 2,000-a-hit into 300 (§3.3; §5
 *    row 1, verified: 4 sources).
 * 4. **Wakka hits a disc** of any colour shown on three or more discs, so no -ga comes out
 *    (§4.1, §5 row 2, verified: 4 sources); otherwise he hits Seymour.
 * 5. **Yuna casts the Nul** of the colour he shows most while three or more discs show it and
 *    someone lacks it (§5 row 3, verified: 3 sources), re-casts **Hastega** once Dispel has
 *    stripped it (§5 row 9, verified: 3 sources), and otherwise heals whoever is under 70 %.
 * 6. **Anyone else hits Seymour.**
 *
 * The tactic only picks among the rows the engine offers, and returns `null` (the generic
 * ladder) when Seymour Omnis is not on the field or an aeon has the turn.
 */

import type { AvailableCommand, BattleEngine, Command, CombatantId, FFXCombatant } from '../../battle/common/types.ts';
import { type Tactic, activeParty } from './common.ts';

/** Seymour Omnis's combatant id, mirrored from `src/data/ffx/enemies/seymour-omnis.ts` (`OMNIS_ID`). */
export const SEYMOUR_OMNIS_BOSS_ID = 'seymour-omnis';
/** The discs, left to right, mirrored from the same file (`MORTIPHASM_IDS`). */
const DISCS = ['mortiphasm-1', 'mortiphasm-2', 'mortiphasm-3', 'mortiphasm-4'] as const;
/** The Omnis rules' state keys (`src/battle/ffx/ai/seymour-omnis-rules.ts`). */
const DISCS_FLAG = 'omnis.discs';
const STATE_FLAG = 'omnis.state';

/** Heal under this share of max HP in the ordinary turns (the bench's line). */
const HEAL_UNDER = 0.45;
/** Before Ultima, heal anyone under this HP [§5 row 6: "keep HP above 4,000"]. */
const ULTIMA_FLOOR = 4_200;
/** Yuna tops up whoever is under this share when nothing else is due (the bench's line). */
const TOP_UP_UNDER = 0.7;
/** A caster under this MP gets an Ether first (the bench's line). */
const DRY_MP = 60;
const NUL: Readonly<Record<string, string>> = { fire: 'nulblaze', ice: 'nulfrost', lightning: 'nulshock', water: 'nultide' };

const DEFEND: Command = { kind: 'defend', targets: [] };

/** The first enabled row of `kind` (and `id`, when given). */
function byId(commands: readonly AvailableCommand[], kind: Command['kind'], id?: string): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)));
}

function onTarget(commands: readonly AvailableCommand[], kind: 'ability' | 'item', id: string, target: CombatantId): Command | null {
  return byId(commands, kind, id)?.validTargets.includes(target) ? { kind, id, targets: [target] } : null;
}

function hit(commands: readonly AvailableCommand[], target: CombatantId): Command {
  return byId(commands, 'attack')?.validTargets.includes(target) ? { kind: 'attack', targets: [target] } : DEFEND;
}

/** The colour he shows most, and on how many discs. */
function majority(engine: BattleEngine): { element: string; count: number; discs: string[] } {
  const discs = String(engine.state().flags[DISCS_FLAG] ?? '').split(',');
  const counts: Record<string, number> = {};
  for (const d of discs) counts[d] = (counts[d] ?? 0) + 1;
  const [element, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
  return { element, count, discs };
}

/** Rule 1: revive, refill a caster, heal the lowest below the floor. */
function upkeep(engine: BattleEngine, actorId: CombatantId, commands: readonly AvailableCommand[], floorHp?: number): Command | null {
  const members = activeParty(engine).filter((c) => !c.removed);
  const down = members.find((c) => c.hp <= 0);
  if (down) {
    const life = actorId === 'yuna' ? onTarget(commands, 'ability', 'life', down.id) : null;
    const raise = life ?? onTarget(commands, 'item', 'phoenix-down', down.id) ?? onTarget(commands, 'item', 'mega-phoenix', down.id);
    if (raise) return raise;
  }
  const dry = members.find((c) => c.hp > 0 && (c.id === 'yuna' || c.id === 'lulu') && c.mp < DRY_MP);
  if (dry) {
    for (const item of ['turbo-ether', 'ether', 'elixir']) {
      const use = onTarget(commands, 'item', item, dry.id);
      if (use) return use;
    }
  }
  const low = members
    .filter((c) => c.hp > 0 && (floorHp !== undefined ? c.hp < floorHp : c.hp < c.stats.maxHp * HEAL_UNDER))
    .sort((a, b) => a.hp - b.hp)[0];
  if (!low) return null;
  const cure = actorId === 'yuna' ? onTarget(commands, 'ability', 'curaga', low.id) : null;
  return cure ?? onTarget(commands, 'item', 'x-potion', low.id) ?? onTarget(commands, 'item', 'hi-potion', low.id);
}

export const seymourOmnis: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const omnis = state.combatants[SEYMOUR_OMNIS_BOSS_ID] as FFXCombatant | undefined;
  if (!omnis || omnis.side !== 'enemy' || !omnis.alive) return null;
  if (state.aeonId === actorId) return null;

  const phase = state.flags[STATE_FLAG];
  const care = upkeep(engine, actorId, commands, phase === 'red' || phase === 'dispelled' ? ULTIMA_FLOOR : undefined);
  if (care) return care;

  // 2. Tidus hands his turn to Wakka.
  if (actorId === 'tidus') {
    const s = commands.find((c) => c.enabled && c.command.kind === 'switch' && (c.command.extra as { inId?: string } | undefined)?.inId === 'wakka');
    if (s) return s.command;
  }

  // 3. Auron's Armor Break, then his sword.
  if (actorId === 'auron') {
    if (omnis.statuses['armor-break'] === undefined) return onTarget(commands, 'ability', 'armor-break', SEYMOUR_OMNIS_BOSS_ID) ?? hit(commands, SEYMOUR_OMNIS_BOSS_ID);
    return hit(commands, SEYMOUR_OMNIS_BOSS_ID);
  }

  // 4. Wakka turns a disc of the colour shown three or four times.
  if (actorId === 'wakka') {
    const m = majority(engine);
    const disc = m.count >= 3 ? DISCS[m.discs.indexOf(m.element)] : undefined;
    if (disc && byId(commands, 'attack')?.validTargets.includes(disc)) return { kind: 'attack', targets: [disc] };
    return hit(commands, SEYMOUR_OMNIS_BOSS_ID);
  }

  // 5. Yuna: the Nul, Hastega, then a top-up.
  if (actorId === 'yuna') {
    const party = activeParty(engine).filter((c) => !c.removed && c.hp > 0);
    const m = majority(engine);
    const nul = NUL[m.element];
    if (nul && m.count >= 3 && party.some((c) => (c.statuses as Record<string, unknown>)[nul] === undefined) && byId(commands, 'ability', nul)) {
      return { kind: 'ability', id: nul, targets: [] };
    }
    if (party.some((c) => c.statuses['haste'] === undefined) && byId(commands, 'ability', 'hastega')) return { kind: 'ability', id: 'hastega', targets: [] };
    const hurt = party.filter((c) => c.hp < c.stats.maxHp * TOP_UP_UNDER).sort((a, b) => a.hp - b.hp)[0];
    if (hurt) return onTarget(commands, 'ability', 'curaga', hurt.id) ?? DEFEND;
    return DEFEND;
  }

  // 6. Everyone else hits him.
  return hit(commands, SEYMOUR_OMNIS_BOSS_ID);
};

export default seymourOmnis;
