/**
 * The reply matrix of the hidden Spherimorph chapter's script, as the interpreter printed it (FFX only; `research/re-ffx-spherimorph.md` section 4.3: 17 commands in each of the four starting states), pasted as a
 * LITERAL table so a test compares the engine against the game's own script and not against a rule written beside the code (the review of 2026-11-06, m5). Test-only.
 *
 * Each cell is `[the sign of the damage it takes, what the script asks for]`: `+` it took damage (or its weakness was hit), `-` it was healed (an absorbed element); the reply is `<Spell>(p)->attacker` (the
 * player-side spell on the one who hit it), `<Spell>(m)->frontline` (the monster-side spell on the whole front line) or `ElementalShift->self` (a weakness hit: no spell, the weakness is redrawn). No cell moves the
 * state unless it is a shift. Rows are in the interpreter's order; states are 0 weak Fire, 1 weak Ice, 2 weak Thunder, 3 weak Water.
 */

export const MATRIX_COMMANDS = ['Attack, no element','Attack with a Fire weapon','Attack with an Ice weapon','Attack with a Thunder weapon','Attack with a Water weapon','Fire (Lulu)','Blizzard','Thunder','Water','Firaga','Holy','Flare (no element)','Scan','Fire Shot (Wakka)','Water Shot (Wakka)','Element Reels (Wakka)','Power Shot (Wakka)'] as const;

export type MatrixCell = readonly [sign: '+' | '-', reply: string];

export const MATRIX: ReadonlyArray<ReadonlyArray<MatrixCell>> = [
  // state 0
  [
    ['+', 'Blizzard(p)->attacker'], // Attack, no element
    ['+', 'ElementalShift->self'], // Attack with a Fire weapon
    ['-', 'Blizzard(p)->attacker'], // Attack with an Ice weapon
    ['-', 'Blizzard(p)->attacker'], // Attack with a Thunder weapon
    ['-', 'Blizzard(p)->attacker'], // Attack with a Water weapon
    ['+', 'ElementalShift->self'], // Fire (Lulu)
    ['-', 'Blizzard(m)->frontline'], // Blizzard
    ['-', 'Blizzard(m)->frontline'], // Thunder
    ['-', 'Blizzard(m)->frontline'], // Water
    ['+', 'ElementalShift->self'], // Firaga
    ['-', 'Blizzard(m)->frontline'], // Holy
    ['+', 'Blizzard(m)->frontline'], // Flare (no element)
    ['+', 'Blizzard(m)->frontline'], // Scan
    ['+', 'ElementalShift->self'], // Fire Shot (Wakka)
    ['-', 'Blizzard(m)->frontline'], // Water Shot (Wakka)
    ['+', 'Blizzard(p)->attacker'], // Element Reels (Wakka)
    ['+', 'Blizzard(p)->attacker'], // Power Shot (Wakka)
  ],
  // state 1
  [
    ['+', 'Fire(p)->attacker'], // Attack, no element
    ['-', 'Fire(p)->attacker'], // Attack with a Fire weapon
    ['+', 'ElementalShift->self'], // Attack with an Ice weapon
    ['-', 'Fire(p)->attacker'], // Attack with a Thunder weapon
    ['-', 'Fire(p)->attacker'], // Attack with a Water weapon
    ['-', 'Fire(m)->frontline'], // Fire (Lulu)
    ['+', 'ElementalShift->self'], // Blizzard
    ['-', 'Fire(m)->frontline'], // Thunder
    ['-', 'Fire(m)->frontline'], // Water
    ['-', 'Fire(m)->frontline'], // Firaga
    ['-', 'Fire(m)->frontline'], // Holy
    ['+', 'Fire(m)->frontline'], // Flare (no element)
    ['+', 'Fire(m)->frontline'], // Scan
    ['-', 'Fire(m)->frontline'], // Fire Shot (Wakka)
    ['-', 'Fire(m)->frontline'], // Water Shot (Wakka)
    ['+', 'Fire(p)->attacker'], // Element Reels (Wakka)
    ['+', 'Fire(p)->attacker'], // Power Shot (Wakka)
  ],
  // state 2
  [
    ['+', 'Water(p)->attacker'], // Attack, no element
    ['-', 'Water(p)->attacker'], // Attack with a Fire weapon
    ['-', 'Water(p)->attacker'], // Attack with an Ice weapon
    ['+', 'ElementalShift->self'], // Attack with a Thunder weapon
    ['-', 'Water(p)->attacker'], // Attack with a Water weapon
    ['-', 'Water(m)->frontline'], // Fire (Lulu)
    ['-', 'Water(m)->frontline'], // Blizzard
    ['+', 'ElementalShift->self'], // Thunder
    ['-', 'Water(m)->frontline'], // Water
    ['-', 'Water(m)->frontline'], // Firaga
    ['-', 'Water(m)->frontline'], // Holy
    ['+', 'Water(m)->frontline'], // Flare (no element)
    ['+', 'Water(m)->frontline'], // Scan
    ['-', 'Water(m)->frontline'], // Fire Shot (Wakka)
    ['-', 'Water(m)->frontline'], // Water Shot (Wakka)
    ['+', 'Water(p)->attacker'], // Element Reels (Wakka)
    ['+', 'Water(p)->attacker'], // Power Shot (Wakka)
  ],
  // state 3
  [
    ['+', 'Thunder(p)->attacker'], // Attack, no element
    ['-', 'Thunder(p)->attacker'], // Attack with a Fire weapon
    ['-', 'Thunder(p)->attacker'], // Attack with an Ice weapon
    ['-', 'Thunder(p)->attacker'], // Attack with a Thunder weapon
    ['+', 'ElementalShift->self'], // Attack with a Water weapon
    ['-', 'Thunder(m)->frontline'], // Fire (Lulu)
    ['-', 'Thunder(m)->frontline'], // Blizzard
    ['-', 'Thunder(m)->frontline'], // Thunder
    ['+', 'ElementalShift->self'], // Water
    ['-', 'Thunder(m)->frontline'], // Firaga
    ['-', 'Thunder(m)->frontline'], // Holy
    ['+', 'Thunder(m)->frontline'], // Flare (no element)
    ['+', 'Thunder(m)->frontline'], // Scan
    ['-', 'Thunder(m)->frontline'], // Fire Shot (Wakka)
    ['+', 'ElementalShift->self'], // Water Shot (Wakka)
    ['+', 'Thunder(p)->attacker'], // Element Reels (Wakka)
    ['+', 'Thunder(p)->attacker'], // Power Shot (Wakka)
  ],
];
