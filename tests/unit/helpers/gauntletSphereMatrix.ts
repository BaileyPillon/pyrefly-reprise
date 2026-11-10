/**
 * **The Greater Sphere's reply matrix, as the game's own bytecode gave it** (FFX only; the hidden Gauntlet chapter's act 5; `research/re-ffx-monster-arena-creations.md` 3.5): the real hook script of monster file `m281` run
 * end to end in the earlier AI lanes' Atel interpreter (the Spherimorph lane's harness, read only; the run's output is `t-gsphere.out.txt` in the lane's scratch folder), for 20 commands in each of the four starting
 * states and for each sign of the damage the hit took (damage, a heal by an absorbed element, none). Generated from that output by `gen-matrix3.mjs` (lane scratch), not typed. Test-only.
 *
 * A cell is the reply the script asked for: `ultima:front` (Ultima, 0x40F3, on the front line), `press:front` (Hydraulic Press on the front line), `shift` (a new element, then Elemental Shift on itself),
 * `flare:one` (the party's Flare on one random member) or `none`. Each row is `[command, [state 0 .. state 3]]` and each state is `[damage +100, healed -100, damage 0]`.
 */

export const SPHERE_COMMANDS = [
  "Attack, no element",
  "Attack with a Fire weapon",
  "Attack with an Ice weapon",
  "Attack with a Thunder weapon",
  "Attack with a Water weapon",
  "Fire (Lulu)",
  "Blizzard",
  "Thunder",
  "Water",
  "Firaga",
  "Blizzaga",
  "Thundaga",
  "Waterga",
  "Holy",
  "Flare (no element)",
  "Scan",
  "Fire Shot (Wakka)",
  "Water Shot (Wakka)",
  "Element Reels (Wakka)",
  "Power Shot (Wakka)",
] as const;

export type SphereCommand = (typeof SPHERE_COMMANDS)[number];
export type SphereReply = 'ultima:front' | 'press:front' | 'shift' | 'flare:one' | 'none';

/** The interpreter's table: rows in `SPHERE_COMMANDS` order. */
export const SPHERE_MATRIX: ReadonlyArray<readonly [SphereCommand, ReadonlyArray<readonly [SphereReply, SphereReply, SphereReply]>]> = [
  ["Attack, no element", [['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front']]],
  ["Attack with a Fire weapon", [['press:front', 'ultima:front', 'ultima:front'], ['press:front', 'ultima:front', 'ultima:front'], ['press:front', 'ultima:front', 'ultima:front'], ['press:front', 'ultima:front', 'ultima:front']]],
  ["Attack with an Ice weapon", [['press:front', 'ultima:front', 'ultima:front'], ['press:front', 'ultima:front', 'ultima:front'], ['press:front', 'ultima:front', 'ultima:front'], ['press:front', 'ultima:front', 'ultima:front']]],
  ["Attack with a Thunder weapon", [['press:front', 'ultima:front', 'ultima:front'], ['press:front', 'ultima:front', 'ultima:front'], ['press:front', 'ultima:front', 'ultima:front'], ['press:front', 'ultima:front', 'ultima:front']]],
  ["Attack with a Water weapon", [['press:front', 'ultima:front', 'ultima:front'], ['press:front', 'ultima:front', 'ultima:front'], ['press:front', 'ultima:front', 'ultima:front'], ['press:front', 'ultima:front', 'ultima:front']]],
  ["Fire (Lulu)", [['shift', 'shift', 'shift'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front']]],
  ["Blizzard", [['ultima:front', 'ultima:front', 'ultima:front'], ['shift', 'shift', 'shift'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front']]],
  ["Thunder", [['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['shift', 'shift', 'shift'], ['ultima:front', 'ultima:front', 'ultima:front']]],
  ["Water", [['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['shift', 'shift', 'shift']]],
  ["Firaga", [['shift', 'shift', 'shift'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front']]],
  ["Blizzaga", [['ultima:front', 'ultima:front', 'ultima:front'], ['shift', 'shift', 'shift'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front']]],
  ["Thundaga", [['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['shift', 'shift', 'shift'], ['ultima:front', 'ultima:front', 'ultima:front']]],
  ["Waterga", [['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['shift', 'shift', 'shift']]],
  ["Holy", [['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front']]],
  ["Flare (no element)", [['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front']]],
  ["Scan", [['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front']]],
  ["Fire Shot (Wakka)", [['shift', 'flare:one', 'shift'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front']]],
  ["Water Shot (Wakka)", [['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['ultima:front', 'ultima:front', 'ultima:front'], ['shift', 'flare:one', 'shift']]],
  ["Element Reels (Wakka)", [['press:front', 'flare:one', 'press:front'], ['press:front', 'flare:one', 'press:front'], ['press:front', 'flare:one', 'press:front'], ['press:front', 'flare:one', 'press:front']]],
  ["Power Shot (Wakka)", [['press:front', 'flare:one', 'press:front'], ['press:front', 'flare:one', 'press:front'], ['press:front', 'flare:one', 'press:front'], ['press:front', 'flare:one', 'press:front']]],
];

/** The same hits with an aeon in the front line (the interpreter's run: state 0 and state 1, damage and heal give the same reply): the player-side -aga on the front line replaces Ultima when the element is absorbed. */
export const SPHERE_WITH_AEON: ReadonlyArray<readonly [state: number, command: SphereCommand, reply: string]> = [
  [0, 'Fire (Lulu)', 'shift'],
  [0, 'Blizzard', 'blizzaga:front'],
  [0, 'Firaga', 'shift'],
  [0, 'Blizzaga', 'blizzaga:front'],
  [0, 'Flare (no element)', 'ultima:front'],
  [1, 'Fire (Lulu)', 'firaga:front'],
  [1, 'Blizzard', 'shift'],
  [1, 'Firaga', 'firaga:front'],
  [1, 'Blizzaga', 'shift'],
  [1, 'Flare (no element)', 'ultima:front'],
];
