/**
 * **The hidden Gauntlet chapter's ids and the rules every creature's script shares** (FFX only; chapter 54; `research/re-ffx-monster-arena-creations.md`, "RE n"). The battle layer imports no `src/data`, so the combatant,
 * script and move-row ids the scripts name are **copies** of `data/ffx/gauntlet-ids.ts`; `tests/unit/chapters/gauntlet-data.test.ts` pins that the copies agree. Each creature's own numbers (a draw's modulo, a threshold,
 * a cycle) live at the top of its own file with their source, one file a creature (`./gauntlet-cactuar-king.ts`, `./gauntlet-don-tonberry.ts`, `./gauntlet-jormungand.ts`; the later tiers add theirs).
 *
 * **How the scripts read the game's own words** (the earlier AI lanes' conventions, `./game-rolls.ts` and `./hit-gates.ts`):
 *
 * - `GetRandomValue() mod n` is one draw of the battle's script stream (`gameMod`); `findMatchingChr(front line, alive)` is `randomLiving` (the picker stream, a draw only with two or more candidates).
 * - "An aeon is in the front line" (`countChrOverlap(FrontlineChars, AllAeons)`) is `aeonHoldsField`: Yuna's seven aeons (actors 8 to 14), the test every earlier script of the project uses.
 * - A command a script *performs* from `onHit` is a free reaction (`react`): it needs the owner able to act and the hit not itself part of a reaction (`isCounterattackAllowed()` is `counterAllowed`), and the engine
 *   drops a second reaction of the same owner in one action. A monster whose HP the hit took to 0 queues nothing.
 */

/** The combatant ids (copies of `GauntletCreatureId` and the parts in `data/ffx/gauntlet-ids.ts`). */
export const GAUNTLET_IDS = {
  cactuarKing: 'cactuar-king',
  donTonberry: 'don-tonberry',
  jormungand: 'jormungand',
} as const;

/** The AI script ids (copies of `GAUNTLET_SCRIPT`). */
export const GAUNTLET_SCRIPTS = {
  cactuarKing: 'gauntlet-cactuar-king',
  donTonberry: 'gauntlet-don-tonberry',
  jormungand: 'gauntlet-jormungand',
} as const;

/** The move rows the tier-1 scripts name (copies of `GAUNTLET_ROWS`; the comment gives the game's command id). */
export const GAUNTLET_ROWS = {
  needles10000: 'gauntlet-10000-needles', // 0x40BC
  needles99999: 'gauntlet-99999-needles', // 0x40F2
  runAway: 'gauntlet-run-away', // 0x4033
  tonberryAttack: 'gauntlet-tonberry-attack', // 0x4062
  voodoo: 'gauntlet-voodoo', // 0x40EA
  karma: 'gauntlet-karma', // 0x40FF
  waddle: 'gauntlet-waddle', // 0x4081
  jormungandAttack: 'gauntlet-jormungand-attack', // 0x40BA
  coldStare: 'gauntlet-cold-stare', // 0x40BB
  vorpal: 'gauntlet-space-time-vorpal', // 0x40E2
} as const;

/**
 * `state.flags` key: the Cactuar King ran away (`./gauntlet-cactuar-king.ts` sets it as it performs its Run Away; `./gauntlet-end.ts` ends the battle on it). Nothing else in the project writes or reads it.
 */
export const GOT_AWAY_FLAG = 'gauntlet.gotAway';
/** `state.flags` key: the waypoint Don Tonberry's last Waddle moved him to, 0 (not yet moved) to 4 (arrived): the formation's own `PositionToMoveTo` write, for the scene. */
export const TONBERRY_WAYPOINT_FLAG = 'gauntlet.tonberry.waypoint';
