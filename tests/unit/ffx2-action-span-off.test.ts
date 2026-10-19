/**
 * **Switch OFF is the base, byte for byte** (re-parity lane X2-A, row XA6 slice A; FFX-2 only).
 *
 * **r56 (2026-10-19): the switch `ACTION_TIME_PER_COMMAND` is ON in production** (the release driver's delegated pick under Bailey's advance yes), so this file now plays every
 * chain with the knob OFF (`withActionSpanKnobsAsync({ perCommand: false })`): the previous action time must be exactly what it was. Every FFX-2 chapter's whole chain, played through
 * the app's own path with the shipped strategy, has to produce the same event log as the r55 commit (`b24614c05`, the live build before r56). The pinned file holds one SHA-1 of the whole event
 * log of every link, per chapter, seed and pace; it was re-recorded on r55 (b24614c05 put in place in-process, an overlay of the files that differ, no worktree or copy) and is checked here on
 * the r56 tree. **The one exception is `ffx2-den-of-woe`:** r56 also moves the scripted line's Hero Drink trigger from 4,500 to 12,000 HP (`src/engine/tactics/ffx2-den-of-woe.ts` DRINK_FROM, our line,
 * not data), which changes that chapter's play with the switch off too, so its pins are the r56 line with the knob off; the proof that the old digests come back with the trigger at 4,500
 * is in `docs/handoff/re-parity-r56-re.md` (12 seeds, 3 paces, identical to b24614c05).
 *
 * - Always on: the pinned digests (a few seeds per chapter at the bench pace, plus a few at the human pace for the chapters that carry a formation's flat 3 s).
 * - `PYREFLY_X2AT_DIGEST=1`: instead of checking, print the digests of the chapters in `PYREFLY_X2AT_CHAPTERS` (default all twelve) for seeds `PYREFLY_X2AT_SEEDS` (`<n>` or
 *   `<a>-<b>`) at pace `PYREFLY_X2AT_PACE`, as JSON lines, and write them to `PYREFLY_X2AT_OUT` when set. Run it on the base export to record, on this tree to compare.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { ACTION_TIME_PER_COMMAND } from '../../src/battle/ffx2/action-time.ts';
import { withActionSpanKnobsAsync } from '../../src/battle/ffx2/action-span.ts';
import { FFX2_CHAPTERS, playChain, type Pace } from './helpers/ffx2ChainPlay.ts';

const PRINT = process.env['PYREFLY_X2AT_DIGEST'] === '1';
const PIN_FILE = new URL('../fixtures/parity/ffx2/action_span_off.json', import.meta.url);
const SEED_SPEC = process.env['PYREFLY_X2AT_SEEDS'] ?? '3';
const SEED_RANGE = /^(\d+)-(\d+)$/.exec(SEED_SPEC);
const FIRST = SEED_RANGE ? Number(SEED_RANGE[1]) : 1;
const LAST = SEED_RANGE ? Number(SEED_RANGE[2]) : Number(SEED_SPEC);
const CHAPTERS = process.env['PYREFLY_X2AT_CHAPTERS']?.split(',') ?? FFX2_CHAPTERS;
const PACE = (process.env['PYREFLY_X2AT_PACE'] ?? 'bench') as Pace;

describe.skipIf(!PRINT)('action span off: print digests (PYREFLY_X2AT_DIGEST=1)', () => {
  it('plays the chapters and prints one digest per seed', async () => {
    await registerBattleContent();
    const out: Record<string, string> = {};
    for (const id of CHAPTERS) {
      const chapter = getChapter(id);
      if (!chapter || chapter.game !== 'ffx2') continue;
      for (let seed = FIRST; seed <= LAST; seed += 1) {
        const one = await withActionSpanKnobsAsync({ perCommand: false }, () => playChain(chapter, seed, PACE));
        out[`${id}:${seed}:${PACE}`] = `${one.outcome[0]}:${one.digest}`;
      }
    }
    const text = JSON.stringify(out, null, 1);
    console.log(text);
    if (process.env['PYREFLY_X2AT_OUT']) writeFileSync(process.env['PYREFLY_X2AT_OUT'], text);
  }, 20_000_000);
});

describe.skipIf(PRINT)('action span off: the base, byte for byte', () => {
  it('the switch is on in production (r56); the knob turns it off for this file', () => {
    expect(ACTION_TIME_PER_COMMAND).toBe(true);
  });

  it.skipIf(!existsSync(PIN_FILE))('every pinned chapter, seed and pace plays the base commit\'s event log', async () => {
    await registerBattleContent();
    const pins = JSON.parse(readFileSync(PIN_FILE, 'utf8')) as Record<string, string>;
    const bad: string[] = [];
    for (const [key, want] of Object.entries(pins)) {
      const [id, seed, pace] = key.split(':') as [string, string, Pace];
      const chapter = getChapter(id);
      if (!chapter) continue;
      const one = await withActionSpanKnobsAsync({ perCommand: false }, () => playChain(chapter, Number(seed), pace));
      const got = `${one.outcome[0]}:${one.digest}`;
      if (got !== want) bad.push(key);
    }
    expect(bad).toEqual([]);
  }, 600_000);
});
