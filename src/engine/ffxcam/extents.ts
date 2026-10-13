/**
 * **The characters' camera extents** (FFX only): how tall and how wide each character frames for the camera programs. Most of FFX's spell, item and cast shots are recipes around live characters
 * (`./recipe.ts`): the look-at is raised by a fraction of the targets' *height*, the eye stands a multiple of their *width* away, and both numbers are the game's own, not what a model measures.
 *
 * **Where the game keeps them (Proven).** The `.chr` header's entry at +0x58 points at a 0x48-byte "params" block (magic 0x1624). The loader (`FUN_00825ee0` in FFX.exe) copies it into the model record:
 * `record+0x2c` is the block's float at +0x08 and `record+0x24` the one at +0x18. The camera's two getters read exactly those through the model (`FUN_0082ab30`, `FUN_0082adb0`) and multiply them by the
 * character's scale floats (`FUN_00794a30`, `FUN_00794a70`: `Chr+0x3A4` and `Chr+0x3A8`), which the battle sets to 1.0 (`FUN_0079c110`) and only a script's `SetActorScale` changes (none in this fight).
 * What the scene had measured on its models instead (the idle pose's box) was wrong both ways: Evrae's height more than twice the game's, so every shot around him raised its look-at far too high (the
 * status-spell shots lost him for a quarter of their length at FAR), and the party's widths up to three times theirs, so the shots stood up to three times too wide of them.
 *
 * The numbers are the game's data, so they are **not in the repo** (rule 8): Bailey's local converter writes them beside his models (`extents.json` in the camera folder, `ffxcam-extents/1`) and the dev
 * loader reads them (`./load.ts`). With no file, the scene measures its own models and the recipes run on those (labelled a fit in the notes).
 *
 * Pure. Game case: FFX only.
 */

/** One character's extents in FFX units: the camera programs' `camHeight` and `camWidth`. */
export interface CharExtent {
  readonly height: number;
  readonly width: number;
}

/** By FFX character number (as a string key, the way JSON holds it): 0 to 6 the party, 20 Evrae. */
export type CharExtents = Readonly<Record<string, CharExtent>>;

export const EXTENTS_FORMAT = 'ffxcam-extents/1';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

/** The extents of a parsed `extents.json`, or the first thing wrong with it. Pure. */
export function parseExtents(raw: unknown): { extents: CharExtents } | { problem: string } {
  if (!isRecord(raw)) return { problem: 'extents.json is not an object' };
  if (raw['format'] !== EXTENTS_FORMAT) return { problem: `format is ${JSON.stringify(raw['format'])}, not "${EXTENTS_FORMAT}"` };
  const chars = raw['chars'];
  if (!isRecord(chars)) return { problem: 'chars is not an object' };
  const out: Record<string, CharExtent> = {};
  for (const [chr, entry] of Object.entries(chars)) {
    if (!/^\d+$/.test(chr)) return { problem: `chars["${chr}"] is not a character number` };
    if (!isRecord(entry) || !positive(entry['height']) || !positive(entry['width'])) return { problem: `chars["${chr}"] needs a positive "height" and "width"` };
    out[chr] = { height: entry['height'], width: entry['width'] };
  }
  return { extents: out };
}
