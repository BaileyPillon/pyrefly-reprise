/**
 * SFX parity, the mix (2026-10-10; decision 52i, the spec's proposal P1): how a row target becomes a per-cue trim.
 *
 * The recorded set (`public/audio/sfx/sprite-v2.mp3`) was mastered to class levels (ui -24, weapon -18, impact -14.1,
 * spell -15, flourish -14 LUFS). P1 asks each EVENT to sit where the games' own sound facts put it: the retail level
 * ratio between events plus one offset per game, with the D-210 floor under the party's swings and blows and a
 * ceiling of -14 LUFS over everything. Those targets are numbers in `docs/audio/sfx-parity-mix.json`, one row per
 * event. This module turns them into a trim in dB for each (game, cue), which `parityMix.ts` applies at play time as
 * a gain on the cue's own source node. Nothing is re-encoded, `SaveData` and the limiter are untouched, and the
 * table is data: `tools/audio/sfx-parity-mix.mjs` writes `parityTrims.ts` from the JSON and the manifest, and
 * `tests/unit/audio-sfx-parity-mix.test.ts` fails when the table is stale.
 *
 * Pure: no DOM, no Web Audio, no `three`. Game case (rule 14): a trim is per game; a cue the other game never plays
 * is never given one, and a `both` cue takes its own value in each game from that game's rows.
 */

export type MixGame = 'ffx' | 'ffx2';
export type FloorClass = 'weapon' | 'impact';
/** The spec's evidence grade for a row; `hold` is a row with no retail sound (52j). */
export type Confidence = 'high' | 'medium-high' | 'medium' | 'low' | 'hold';

export interface MixRow {
  id: string;
  game: MixGame;
  /** The v2 cue names (without the `v2:` prefix) the event plays today. */
  cues: readonly string[];
  /** The event's retail-ratio level in LUFS (loudest 400 ms), or `null` for a HOLD row (52j: keep today's sound). */
  retailLufs: number | null;
  /** `weapon` or `impact` for a party swing or blow: the D-210 floor applies. */
  floor: FloorClass | null;
  /** How well the game files establish this row. A `low` row is a candidate: it keeps today's level unless `applyLow`. */
  confidence: Confidence;
  /** Plays per fight in the proof runs: the weight when several rows share one cue. */
  freq: number;
}

export interface MixFile {
  capLufs: number;
  tpCeilDbtp: number;
  floors: Record<FloorClass, number>;
  /** Apply the `low` rows too (default false: candidates keep today's sound until an ear or the files settle them). */
  applyLow: boolean;
  rows: readonly MixRow[];
}

/** What the manifest knows of a v2 cue (`sfxV2.cues[name]`). */
export interface CueLevel {
  game: 'ffx' | 'ffx2' | 'both';
  lufs: number;
  truePeakDb: number;
}

export type Trims = Record<MixGame, Record<string, number>>;

const round1 = (x: number): number => Math.round(x * 10) / 10;

/** A boss's signature-move row (`ffx.boss.*`, `ffx2.boss.*`, `ffx2.lb.sig.*`): its sound belongs to a boss pack. */
export const isBossRow = (row: Pick<MixRow, 'id'>): boolean => /\.(?:boss|sig)\./.test(row.id);

/**
 * One row's P1 target in LUFS: the retail level, lifted to the floor for a party hit, held under the cap. `null`
 * when the row does not move its cue: a HOLD row (52j), or a `low` row while `applyLow` is off.
 */
export function rowTarget(file: MixFile, row: MixRow): number | null {
  if (row.retailLufs === null || row.confidence === 'hold') return null;
  if (row.confidence === 'low' && !file.applyLow) return null;
  let target = row.retailLufs;
  if (row.floor) target = Math.max(target, file.floors[row.floor]);
  return round1(Math.min(target, file.capLufs));
}

/**
 * The trim in dB for every (game, cue) that has at least one applied row (see {@link rowTarget}).
 *
 * - A cue several rows share (a generic hit, a boss roar several bosses use) takes the play-weighted mean of their
 *   applied targets, in dB, until each of those rows has its own recorded original. Boss rows never move a cue a
 *   generic row also names ({@link isBossRow}).
 * - A cut is exact. A boost is limited so the cue's true peak stays under the ceiling after the gain (the limiter
 *   is never asked to do the work); `floor`-ing to 0.1 dB keeps the sum inside it.
 * - A trim under 0.05 dB is left out: the cue plays as it always did.
 */
export function deriveTrims(file: MixFile, cues: Readonly<Record<string, CueLevel>>): Trims {
  const out: Trims = { ffx: {}, ffx2: {} };
  for (const game of ['ffx', 'ffx2'] as const) {
    for (const [name, cue] of Object.entries(cues)) {
      if (cue.game !== 'both' && cue.game !== game) continue;
      const named = file.rows.filter((r) => r.game === game && r.cues.includes(name));
      // A boss's signature move that borrows a shared cue as its stand-in does not move that cue for everyone else
      // (Flux's cleave does not make Auron's swing louder): boss and signature rows count only when every row that
      // names the cue is one of them, and they get their own level when their boss pack lands.
      const generic = named.filter((r) => !isBossRow(r));
      const rows = generic.length > 0 ? generic : named;
      let weight = 0;
      let sum = 0;
      for (const row of rows) {
        const target = rowTarget(file, row);
        if (target === null) continue;
        const w = Math.max(row.freq, 1);
        weight += w;
        sum += w * target;
      }
      if (weight === 0) continue;
      const target = Math.min(sum / weight, file.capLufs);
      let trim = round1(target - cue.lufs);
      if (trim > 0) {
        const headroom = Math.floor((file.tpCeilDbtp - cue.truePeakDb) * 10) / 10;
        trim = Math.max(0, Math.min(trim, headroom));
      }
      if (Math.abs(trim) >= 0.05) out[game][name] = trim;
    }
  }
  return out;
}
