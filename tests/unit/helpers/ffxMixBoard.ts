/**
 * An **independent oracle** of Rikku's Mix on a generated board (re-parity RC7, lane FFX-H; **FFX only**).
 *
 * It restates the rules of the private note FFX-G05 sections 3.2, 3.6 and 4.1 in its own terms and imports nothing from `src/battle/ffx/kernel/`, `mix.ts`,
 * `adapt/` or `execute.ts`: the result of a pair is read from the real resolver's answers (`tests/fixtures/parity/ffx/mix_resolver.json`, the 112 x 112
 * `table`), the target rule of each result from the note's table of results (below, by the result's place in command order), and the hit and spread facts from
 * the game's own command records (`tests/fixtures/parity/ffx/command_records.json`). The only thing it shares with production is the plain list of our 112 item
 * ids and 64 result ids (names, not logic; the kernel test pins their order against the real resolver and the 43 recipes the data layer shipped).
 *
 * Draws come from a mirror of the battle's generator, so the oracle takes the same stream positions the engine does without sharing a line of its code.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { GameStreams } from '../../../src/battle/common/streams.ts';
import { MIX_ITEM_IDS, MIX_RESULT_IDS } from '../../../src/battle/ffx/kernel/mix-table.ts';
import type { Board, Member } from './ffxTargetBoard.ts';

const fixture = (name: string): { table?: number[][]; columns?: string[]; rows?: number[][] } =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../../fixtures/parity/ffx/${name}.json`, import.meta.url)), 'utf8'));

/** The real resolver's answer for the pair of item indices (a, b): a command id 0x308b to 0x30ca. */
const TABLE = (fixture('mix_resolver').table as number[][]);

/** The game's command records: id to [flagsMisc, hits]. */
const RECORDS = new Map<number, { flagsMisc: number; hits: number }>();
{
  const f = fixture('command_records');
  const col = Object.fromEntries((f.columns as string[]).map((c, i) => [c, i]));
  for (const row of f.rows as number[][]) RECORDS.set(row[0] as number, { flagsMisc: row[col['flagsMisc'] as number] as number, hits: row[col['hits'] as number] as number });
}

/** The seven Mix results that pick one random ally (FFX-G05 section 4.1); every other own-side result picks a group. */
const OWN_SINGLE = new Set(['mix-elixir', 'mix-nul-all', 'mix-vitality', 'mix-mana', 'mix-freedom', 'mix-quartet-of-9', 'mix-hero-drink']);
/** The three that may target the KO'd. */
const OWN_KO = new Set(['mix-mega-phoenix', 'mix-final-phoenix', 'mix-final-elixir']);
/** The first own-side result in command order: results 0 to 32 (0x308b to 0x30ab) aim at the opposing side, 33 to 63 at the own side. */
const FIRST_OWN = 33;

export interface MixCase {
  board: Board;
  /** The Mix user (a living party member). */
  userId: string;
  a: string;
  b: string;
  /** The bag before: item id to count. */
  stock: Record<string, number>;
}

export interface MixExpected {
  /** The result ability's id. */
  result: string;
  failed: boolean;
  /** Who the result is aimed at (ascending slot), empty on a failure. */
  targets: string[];
  /** The stock after, for the two ingredients. */
  stockAfter: Record<string, number>;
  /** The streams 4, 5 and 6 draws the Mix takes (the target pick, then the spread of a multi-hit result), in order. */
  draws: number[];
  /** The bit set in the party-shared array: word and bit, or null. */
  learned: { word: number; bit: number } | null;
}

/** What the game's Mix does for `c`, taking its draws from `mirror` (a generator seeded like the engine's). */
export function oracleMix(c: MixCase, mirror: GameStreams): MixExpected {
  const ia = MIX_ITEM_IDS.indexOf(c.a);
  const ib = MIX_ITEM_IDS.indexOf(c.b);
  const command = TABLE[Math.max(ia, ib)]![Math.min(ia, ib)] as number;
  const index = command - 0x308b;
  const result = MIX_RESULT_IDS[index] as string;

  // 1. both ingredients are consumed first (a doubled item twice from its one stack; a missing copy is not noticed)
  const stockAfter: Record<string, number> = {};
  for (const id of [c.a, c.b]) stockAfter[id] = c.stock[id] ?? 0;
  for (const id of [c.a, c.b]) stockAfter[id] = Math.max(0, (stockAfter[id] as number) - (stockAfter[id] === 0 ? 0 : 1));

  // 2. the auto-target of the result
  const draws: number[] = [];
  const draw = (stream: number, n: number): number => {
    draws.push(stream);
    return mirror.draw(stream) % n;
  };
  const user = c.board.members.find((m) => m.id === c.userId) as Member;
  const opposing = index < FIRST_OWN;
  const side = opposing ? (user.side === 'party' ? 'enemy' : 'party') : user.side;
  const mayTargetKo = OWN_KO.has(result);
  const legal = c.board.members
    .filter((m) => m.side === side && !m.untargetable && (!m.dead || mayTargetKo))
    .sort((x, y) => x.slot - y.slot);
  let mask: Member[];
  if (opposing || !OWN_SINGLE.has(result)) {
    // a group result: one draw (also for one group) when anybody is legal, and every legal member (the engine puts every combatant in group 0)
    mask = legal;
    if (legal.length > 0) draw(5, 1);
  } else {
    mask = legal.length <= 1 ? legal : [legal[draw(4, legal.length)] as Member];
  }
  if (mask.length === 0) return { result, failed: true, targets: [], stockAfter, draws, learned: null };

  // 3. a multi-hit random-spread result (records 0x3095 to 0x30a8) deals each hit to one member of the group, a draw on stream 5 with two or more
  const record = RECORDS.get(command) as { flagsMisc: number; hits: number };
  if ((record.flagsMisc & 0x8000) !== 0 && mask.length >= 2) for (let n = 0; n < record.hits; n++) draw(5, mask.length);

  const n = (command - 0x60) & 0xfff;
  return { result, failed: false, targets: mask.map((m) => m.id), stockAfter, draws, learned: { word: n >> 4, bit: n & 15 } };
}
