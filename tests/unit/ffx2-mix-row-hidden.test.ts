/**
 * The Alchemist's Mix row is not in the menu while its picker is not built (PR-0619; r75-code3; **FFX-2 only**).
 *
 * The finding (deep round 34, the hidden Fallen Maesters): Rikku's menu listed a greyed "MIX NOT BUILT" row. The driver's decision of 2026-11-04 is to show nothing that is not built, so
 * `buildCommands` (`src/battle/ffx2/menu.ts`) leaves the row out while `MIX_PICKER` is off (`constants.ts`); it comes back when the picker lands. The engine is unchanged: a direct submit still
 * resolves a Mix (`parity-ffx2-mix-chapter.test.ts` and `parity-ffx2-mix-engine.test.ts`). FFX has no Mix and its aeon order rows (`ffx/aeon-commands.ts`) are not touched.
 *
 * Played on the hidden Fallen Maesters (Rikku is an Alchemist there) and on every other FFX-2 chapter of the board, so no build lists the row greyed or otherwise.
 */

import { describe, expect, it } from 'vitest';
import type { Command, Decision } from '../../src/battle/common/types.ts';
import { harnessFor } from '../../critic/bench/advisor-v2/harness.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS } from '../../src/data/encounters.ts';
import { MIX_PICKER } from '../../src/battle/ffx2/constants.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

const MIX = 'x2-alchemist-mix';

/** The first `limit` menus of a fight, answering each with its first enabled row. */
function menus(chapterId: string, seed: number, limit: number): Input[] {
  const { engine } = harnessFor(chapterId, seed);
  const out: Input[] = [];
  for (let i = 0; i < 6_000 && out.length < limit; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') {
      engine.tick?.(100);
      continue;
    }
    out.push(d);
    const row = d.commands.find((c) => c.enabled && c.validTargets.length > 0);
    engine.submit(row ? ({ ...row.command, targets: [row.validTargets[0]!] } as Command) : ({ kind: 'defend', targets: [] } as Command));
  }
  return out;
}

describe('the Mix row is not listed while its picker is not built (PR-0619)', () => {
  it('the picker is still off, which is what this test describes', () => {
    expect(MIX_PICKER).toBe(false);
  });

  it('on the hidden Fallen Maesters Rikku is an Alchemist with her other rows enabled and no Mix row, greyed or otherwise', () => {
    const all = menus('ffx2-fallen-maesters', 1, 18);
    const rikku = all.filter((d) => d.actorId === 'rikku');
    expect(rikku.length, 'Rikku had menus').toBeGreaterThan(0);
    for (const d of rikku) {
      const ids = d.commands.map((c) => (c.command.kind === 'ability' ? c.command.id : c.command.kind));
      expect(ids, 'the control: the Alchemist rows are there').toContain('x2-alchemist-stash-potion');
      expect(ids, 'the Mix row is not').not.toContain(MIX);
      expect(d.commands.map((c) => c.label.toLowerCase())).not.toContain('mix');
    }
  });

  it('no menu of any FFX-2 chapter, listed or hidden, lists the Mix or a row greyed as unbuilt', () => {
    const chapters = [...CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.game === 'ffx2');
    let seen = 0;
    for (const chapter of chapters) {
      for (const d of menus(chapter.id, 1, 9)) {
        seen += d.commands.length;
        for (const c of d.commands) {
          expect(c.command.kind === 'ability' && c.command.id === MIX, `${chapter.id}: ${c.label}`).toBe(false);
          expect(c.opensMinigame, `${chapter.id}: ${c.label}`).not.toBe('rikku-mix');
          expect(c.disabledReason ?? '', `${chapter.id}: ${c.label}`).not.toMatch(/not built/i);
        }
      }
    }
    expect(seen, 'rows were read').toBeGreaterThan(300);
  });
});
