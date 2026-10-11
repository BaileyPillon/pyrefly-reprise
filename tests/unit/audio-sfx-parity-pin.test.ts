/**
 * SFX parity integration, the pin (both games): while `manifest.sfxParity.packs` is empty, the presenter asks the
 * mixer for exactly the cues, at exactly the volumes, delays and virtual times, that it asked for before the
 * per-event slots, the flow hooks and the beat timing existed.
 *
 * The golden (`tests/fixtures/sfx-parity-pin.golden.json`) was recorded on the build BEFORE that work (origin/r40-rc,
 * `fcecfa74`'s tree with the records merged), by running this file with `SFX_PIN_WRITE=<path>` set. It groups every
 * scenario of the scripted fight (`helpers/sfxFight.ts`: every ability of both games' catalogues by a party actor and
 * by a foe, every weapon, a critical, a multi-hit, a miss, the statuses, KOs, a summon, a charge ladder, a form
 * change, a counter, an Overdrive full, the data `sfx` keys, the victory) by the line of cues it made, so a change
 * shows as the scenarios that moved. The recorder logs only `key`, `volume`, `delay` and `pan`: the new options
 * (`events`, `coveredBy`, `beatMs`) are asked of the mixer, which ignores them with no pack listed.
 *
 * The second half pins the mixer: with no pack, `playSfx` with the new options does what it does without them.
 *
 * To re-record after a DELIBERATE change to the presenter's own timing or to a cue choice: check the old tree out
 * into a scratch worktree, copy `helpers/sfxFight.ts` and this file in, run
 * `SFX_PIN_WRITE=<path> node node_modules/vitest/vitest.mjs run tests/unit/audio-sfx-parity-pin.test.ts`, and review
 * the diff of the golden like any behaviour change.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fightTrace, type FightGame } from './helpers/sfxFight.ts';

const ROOT = resolve(import.meta.dirname, '../..');
const GOLDEN = join(ROOT, 'tests', 'fixtures', 'sfx-parity-pin.golden.json');

type Golden = Record<FightGame, Record<string, string[]>>;

const sortedKeys = (o: Record<string, string[]>): Record<string, string[]> => Object.fromEntries(Object.keys(o).sort().map((k) => [k, [...o[k]!].sort()]));

describe('the scripted fight plays exactly what it played before the parity integration', () => {
  const write = process.env['SFX_PIN_WRITE'];

  for (const game of ['ffx', 'ffx2'] as const) {
    it(`${game}: every scenario makes the cues, volumes, delays and times the golden records`, async () => {
      const trace = sortedKeys(await fightTrace(game));
      if (write) {
        const existing: Partial<Golden> = (() => {
          try {
            return JSON.parse(readFileSync(write, 'utf8')) as Partial<Golden>;
          } catch {
            return {};
          }
        })();
        writeFileSync(write, `${JSON.stringify({ ...existing, [game]: trace }, null, 1)}\n`);
        return;
      }
      const golden = (JSON.parse(readFileSync(GOLDEN, 'utf8')) as Golden)[game];
      // Compare scenario by scenario, so a failure names what moved.
      const was = new Map<string, string>();
      for (const [sig, ids] of Object.entries(golden)) for (const id of ids) was.set(id, sig);
      const now = new Map<string, string>();
      for (const [sig, ids] of Object.entries(trace)) for (const id of ids) now.set(id, sig);
      // Every scenario the golden holds must still exist and play the same. A scenario the golden does not hold (an ability or an
      // enemy someone added to the data since) has no "before" to compare with, so it is not a change of what the game plays.
      const missing = [...was.keys()].filter((id) => !now.has(id));
      expect(missing.slice(0, 12), `${missing.length} recorded scenario(s) no longer exist (a renamed or removed ability or enemy: re-record, see the header)`).toEqual([]);
      const moved: string[] = [];
      for (const [id, sig] of was) if (now.get(id) !== sig) moved.push(`${id}\n    was ${sig}\n    now ${now.get(id)}`);
      expect(moved.slice(0, 12), `${moved.length} scenario(s) changed`).toEqual([]);
    }, 120_000);
  }
});
