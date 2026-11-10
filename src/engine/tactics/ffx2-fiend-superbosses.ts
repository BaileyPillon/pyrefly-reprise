/**
 * The Fiend Arena Superbosses (Almighty Shinra, then the Major Numerus; the hidden FFX-2 chapter): the line the guide teaches, as the move advisor's tactic. **FFX-2 only** [AGENTS.md rule 14].
 *
 * ATB, dresspheres and the game's own five scripts. Registered under the FFX-2 game in `./lookup.ts`, so an FFX board never reaches it; the combatant ids are the chapter's own `x2-` ones, five fighting bodies for the two
 * acts (Shinra, and the four heads Unum, Duo, Tria and Quattour; the body, pod and tail are hidden parts that are never aimed at, so they are not registered).
 *
 * ## The line
 *
 * It is the **advisor line** the chapter's bench measures (`tests/unit/chapters/fiend-superbosses-tactic.test.ts`): an input to a measurement, never game data, and nothing in it tunes the boss (hard rule 6;
 * `boss-side-fix-needs-measured-options`). It is the Farplane Cup's "curtains" line, which the chapter shares its party with (Chapter XIII's Lv 99 three: Yuna and Paine Dark Knights, Rikku an Alchemist):
 * the Dark Knights' **Darkness** is special damage, ignores Defense (Shinra's is 255) and hits every enemy at once, so it reaches all four heads together (`ffx2-vegnagun-shuyin` section 6.4); Rikku **raises** a fallen girl first,
 * cures a girl turned to stone with a Remedy (Duo's Break), then lays **Protect** (Light Curtain) and **Shell** (Lunar Curtain) on the party whenever a girl lacks one, mends the party with a Megalixir when the lowest girl is
 * under half, and otherwise swings.
 *
 * **What it does not do, on purpose, and the guide says so:** it has no answer to a Command (Radis, Venam, Fulmen, Mortis). Each is a 99,999-limit blow that Protect and Shell do not touch and that puts a Lv 99 girl down
 * (`research/re-ffx2-fiend-arena-superbosses.md` section 4, measured on the engine in stage 1 of the lane), and the party as built has no Invincible, no Thunder-proofing and no Mix row: nothing here promises
 * a defence the kit cannot give. The line is what a player can do; whether it wins is the bench's number and Bailey's options sheet.
 *
 * Returns `null` (the generic ladder) when none of the chapter's bodies is on the field, and `null` for a girl with nothing to do (Rikku with a full party and no spare item swings).
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';

/** The chapter's fighting combatant ids: the tactic and the guide register the same ids (`src/data/fiend-superbosses-ids.ts`, `NUMERUS_HEAD_IDS` and `X2_ALMIGHTY_SHINRA_ID`; a test pins them). */
export const FIEND_SUPERBOSSES_BOSS_IDS: readonly CombatantId[] = ['x2-almighty-shinra', 'x2-numerus-unum', 'x2-numerus-duo', 'x2-numerus-tria', 'x2-numerus-quattour'];

/** The offered row for `kind` + `id`, aimed at `targets`. */
function use(commands: AvailableCommand[], kind: string, id: string, targets: CombatantId[]): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id);
  return r ? ({ ...r.command, targets } as Command) : null;
}

/** A girl who is down and can be raised: not one an Eject or a shatter took out of the fight, which no item brings back. */
function fallenGirl(party: AnyCombatant[]): AnyCombatant | undefined {
  return party.find((u) => !u.alive && !has(u, 'eject') && u.removed !== true);
}

/** Rikku's turn: raise, then Protect, then Shell, then a Megalixir under half, else swing (`null`). */
function rikkuTurn(commands: AvailableCommand[], party: AnyCombatant[]): Command | null {
  const down = fallenGirl(party);
  if (down) {
    const back = use(commands, 'ability', 'x2-alchemist-stash-phoenix-down', [down.id]) ?? use(commands, 'item', 'x2-phoenix-down', [down.id]);
    if (back) return back;
  }
  const living = party.filter((u) => u.alive);
  const stone = living.find((u) => has(u, 'petrify')); // Duo's Break: a girl turned to stone is out of the fight until a Remedy cures her
  if (stone) {
    const cure = use(commands, 'item', 'x2-remedy', [stone.id]);
    if (cure) return cure;
  }
  if (living.some((u) => !has(u, 'protect'))) {
    const protect = use(commands, 'item', 'x2-light-curtain', []);
    if (protect) return protect;
  }
  if (living.some((u) => !has(u, 'shell'))) {
    const shell = use(commands, 'item', 'x2-lunar-curtain', []);
    if (shell) return shell;
  }
  const lowest = [...living].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (lowest && hpFraction(lowest) < 0.5) {
    const mend = use(commands, 'item', 'x2-megalixir', []);
    if (mend) return mend;
  }
  return null;
}

export const ffx2FiendSuperbosses: Tactic = (actorId, commands, engine: BattleEngine) => {
  const s = engine.state();
  const onField = FIEND_SUPERBOSSES_BOSS_IDS.map((id) => s.combatants[id]).some((c) => c?.side === 'enemy' && c.alive);
  if (!onField) return null;
  const party = activeParty(engine);
  if (!party.some((c) => c.id === actorId)) return null;
  if (actorId === 'rikku') return rikkuTurn(commands, party);
  return use(commands, 'ability', 'x2-dark-knight-darkness', []);
};

export default ffx2FiendSuperbosses;
