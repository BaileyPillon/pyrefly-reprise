/**
 * Scan on the three (FFX only; the hidden Penance chapter; `research/re-ffx-penance.md` section 3): Scan is in the extra-status immunity word of all three records (0x432F for Penance, 0x032F for the arms, as the
 * Dark Aeons'), so Yuna's Scan misses on each and leaves no Scan status. The plan's section 5 said "Scan on an arm works"; the files say otherwise and the engine follows the files (`docs/handoff/ch-penance.md` section 7).
 */

import { describe, expect, it } from 'vitest';

import { LEFT_ARM, PENANCE, RIGHT_ARM, actor, defend, log, newEngine, nextInput, row } from '../helpers/penanceDrive.ts';

describe('Scan misses on Penance and both arms', () => {
  for (const target of [PENANCE, RIGHT_ARM, LEFT_ARM]) {
    it(`${target}: the action is a miss and no Scan status stays on it`, () => {
      const e = newEngine(3);
      let scanned = false;
      for (let i = 0; i < 60 && !scanned; i++) {
        const d = nextInput(e);
        const c = d.actorId === 'yuna' ? row(d, 'ability', 'scan', target) : null;
        if (c) {
          const before = log(e).length;
          e.submit(c);
          const mine = log(e).slice(before);
          expect(mine.some((x) => x.type === 'miss')).toBe(true);
          expect(mine.some((x) => x.type === 'status-add' && x.status === 'scan' && x.targetId === target)).toBe(false);
          scanned = true;
          continue;
        }
        e.submit(defend());
      }
      expect(scanned).toBe(true);
      expect(Object.keys(actor(e, target).statuses)).not.toContain('scan');
    });
  }
});
