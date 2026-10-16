/**
 * FFX linked monsters: which monster slots share one model, and the placement shuffle that draws for each such group
 * (the link rule of the monster load, VA 0x00783680 with its callbacks 0x00783990 and 0x00783b00, and the shuffle itself,
 * VA 0x007842f0).
 *
 * **Game case: FFX only.** FFX-2 has its own exe, its own formation loader and its own start-up draws (FFX2-G10); none of these
 * addresses exist there. Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec: `research/re-ffx-battle-entry.md`
 * section 2 (condensed from the private note FFX-G10, section 3.3). Pure and deterministic; the draws come from a `draw()`
 * callback that returns the raw 31-bit value the game's RNG would. Proven against the game's own machine code on 20,000
 * generated formations and on the monster words of 28 real formation files (0 mismatches); `tests/unit/parity-ffx-entry.test.ts`
 * replays 300 of those vectors and the real formations.
 *
 * What the game does, in its own order (all of it before the opening counters of `kernel/ctb-init.ts`):
 *
 * 1. **The link rule.** A formation has 8 monster slots (chr ids 0x14 to 0x1b), each holding a 16-bit monster word or 0xFFFF
 *    (empty). A word names a monster file only when its class nibble (bits 12 to 15) is 0 or 1: the file id is then its low
 *    12 bits; any other class, or a file id of 0, has no file and the slot is skipped (it stays a leader with no data). For
 *    each other slot in order: when an EARLIER slot holds exactly the same word and has data, the slot becomes a follower of
 *    the FIRST such slot (its parent is that slot's chr id, it asks for no file of its own); otherwise it is a leader, and
 *    its parent is itself.
 * 2. **The shuffle.** For each used leader `c`, in ascending chr id, with `n = 1 +` the number of its followers: when
 *    `n >= 2`, (a) `n` draws on `c`'s own purpose-0 stream (28 to 35), each giving `(value & 3) + 8 * k` for `k = 0 .. n-1`;
 *    then (b) for each slot `u` from `c` upward whose parent is `c` (the leader first), ONE draw on `u`'s own stream,
 *    `idx = value mod (the number of entries still unassigned)`; the slot's stored position (`stat_appear_count`, script
 *    property 233) takes that entry and the entry is removed. So **2n draws per group**, nothing for an unlinked monster.
 *    No script of the game reads the stored position (1,224 monster and formation scripts scanned), so what the shuffle
 *    changes in play is where the streams stand afterwards.
 *
 * Callers: `adapt/entry.ts#spendEntryDraws` (the engine's battle set-up).
 */

import { rngStreamIndex } from './rng.ts';

/** A formation has eight monster slots, chr ids 0x14 to 0x1b. */
export const MONSTER_SLOT_COUNT = 8;
export const MONSTER_CHR_FIRST = 0x14;

/** The monster word of an empty slot. */
export const EMPTY_MONSTER_WORD = 0xffff;

/**
 * The monster file a word asks for (0x00783680): the low 12 bits when the class nibble is 0 or 1, else 0 (no file). A file id
 * of 0 is also "no file".
 */
export function monsterFileId(word: number): number {
  const w = word & 0xffff;
  const cls = w >>> 12;
  return cls === 0 || cls === 1 ? w & 0xfff : 0;
}

/** What the link rule and the shuffle leave in the eight monster slots. */
export interface PlacementResult {
  /** `Chr+0x14` of each slot: its own chr id (0x14 + slot) for a leader, the chr id of its leader for a follower. */
  readonly parent: readonly number[];
  /** `Chr+0x11`: true for a leader (every slot without a link, empty slots included), false for a follower. */
  readonly leader: readonly boolean[];
  /** The stored position of each slot (`Chr+0x424`, script property 233): 0 unless the slot belongs to a linked group. */
  readonly place: readonly number[];
}

/**
 * The link rule (0x00783680). `words` has up to eight entries (a missing entry is an empty slot); `hasFile` says whether the
 * file system holds the file of a given id (the install holds every file the chapters' words name; the default is "yes").
 */
export function linkMonsters(
  words: readonly number[],
  hasFile: (fileId: number) => boolean = () => true,
): { parent: number[]; leader: boolean[] } {
  const parent: number[] = [];
  const leader: boolean[] = [];
  const hasData: boolean[] = [];
  for (let i = 0; i < MONSTER_SLOT_COUNT; i++) {
    parent.push(MONSTER_CHR_FIRST + i);
    leader.push(true);
    hasData.push(false);
  }
  for (let i = 0; i < MONSTER_SLOT_COUNT; i++) {
    const word = (words[i] ?? EMPTY_MONSTER_WORD) & 0xffff;
    if (word === EMPTY_MONSTER_WORD) continue;
    const file = monsterFileId(word);
    if (file === 0 || !hasFile(file)) continue;
    let first = -1;
    for (let j = 0; j < i; j++) {
      if (((words[j] ?? EMPTY_MONSTER_WORD) & 0xffff) === word && hasData[j]) {
        first = j;
        break;
      }
    }
    if (first >= 0) {
      leader[i] = false;
      parent[i] = MONSTER_CHR_FIRST + first;
    }
    hasData[i] = true;
  }
  return { parent, leader };
}

/**
 * The link rule and the placement shuffle (0x00783680 and 0x007842f0) for one formation's monster words. `draw(stream, modulus)`
 * returns the raw 31-bit value of one draw of `stream` (the kernel reduces it with `& 3` and `% remaining`, as the game does); a
 * caller whose generator is not the game's may pass a value already reduced to `modulus`, which the kernel's own reduction
 * leaves alone. The game ignores `modulus`.
 *
 * Draws made, in order: for each linked group (by ascending leader), `n` draws on the leader's stream, then one on each
 * member's stream, leader first. A formation with no repeated monster word draws nothing.
 */
export function placementShuffle(
  words: readonly number[],
  draw: (stream: number, modulus: number) => number,
  hasFile?: (fileId: number) => boolean,
): PlacementResult {
  const { parent, leader } = linkMonsters(words, hasFile);
  const place: number[] = new Array<number>(MONSTER_SLOT_COUNT).fill(0);
  for (let c = 0; c < MONSTER_SLOT_COUNT; c++) {
    const used = ((words[c] ?? EMPTY_MONSTER_WORD) & 0xffff) !== EMPTY_MONSTER_WORD;
    if (!used || !leader[c]) continue;
    const leaderChr = MONSTER_CHR_FIRST + c;
    let n = 1;
    for (let u = c + 1; u < MONSTER_SLOT_COUNT; u++) if (parent[u] === leaderChr) n++;
    if (n < 2) continue;
    const entries: number[] = [];
    const leaderStream = rngStreamIndex(leaderChr, 0, false);
    for (let k = 0; k < n; k++) entries.push((draw(leaderStream, 4) & 3) + 8 * k);
    let remaining = n;
    for (let u = c; u < MONSTER_SLOT_COUNT; u++) {
      if (parent[u] !== leaderChr) continue;
      const stream = rngStreamIndex(MONSTER_CHR_FIRST + u, 0, false);
      const idx = draw(stream, remaining) % remaining;
      remaining--;
      place[u] = entries.splice(idx, 1)[0] as number;
    }
  }
  return { parent, leader, place };
}
