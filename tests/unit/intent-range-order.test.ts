/**
 * Every damage range the Enemy Intent card prints reads low to high (round 33 PR-0603; r75-code3).
 *
 * The finding: the Chapter XII card read "TIDUS 4,132-2,333" (the low end above the high end), and round 32 had printed the same text.
 *
 * The cause, found by running the engine (hard rule 3): `estimateCommand` prices a move three times, under the `min`, `mid` and `max` roll
 * policies, and reads the figure at the bottom and top of the variance band off the first and last. The policy's RNG treats a draw as a
 * *branch* (answered with the median in all three runs) only for the three ranges `[0,100]`, `[0,99]` and `[0,255]`. Seymour Omnis's fourth
 * spell is aimed by the script's picker, `findMatchingChr`, whose draw is the raw 31-bit value `int(0, 0x7fffffff)`; it was not on the
 * branch list, so the `min` run drew 0 (Tidus, the first candidate) and the `max` run drew 2147483647 (a different candidate): the "low" run
 * landed two spells on Tidus (4,132) and the "high" run one (2,333). A band that mixes *whom the spell lands on* with *how hard it rolls* is
 * not a variance band. The raw 31-bit draws the kernel reduces itself (the picker, the Magus Sisters, Yojimbo's turn roll, the drops) are
 * branch draws by definition, so they now answer with the median in every run, as `pick` already does.
 *
 * Two layers are pinned here, each failing without its own fix: the engine sweep (the cause: no card of any chapter of either game has a
 * low end above its high end, nor a figure outside its band) and the printer (a slab that is handed an inverted band prints it low to
 * high, as the phone line always did).
 *
 * **Game case:** the cause is FFX only (the picker draw is the FFX script engine's; FFX-2's predictor has no such draw and the sweep finds
 * no inverted band in it); the printer is shared by both games' cards (`enemy-intent-damage.ts`), so the printer test runs for both.
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../src/battle/common/types.ts';
import { harnessFor } from '../../critic/bench/advisor-v2/harness.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS } from '../../src/data/encounters.ts';
import { predictEnemyIntents } from '../../src/battle/ffx/intent.ts';
import { predictFFX2EnemyIntents } from '../../src/battle/ffx2/intent.ts';
import type { Ctx } from '../../src/battle/ffx/state.ts';
import { damageHtml } from '../../src/ui/common/enemy-intent-damage.ts';
import type { IntentTargetView, IntentView } from '../../src/ui/common/EnemyIntent.ts';
import { phoneFigures } from '../../src/ui/common/enemy-intent-phone.ts';

interface Row {
  targetId: string;
  targetName: string;
  amount: number;
  min: number;
  max: number;
}
interface Card {
  moveName: string;
  estimate: { perTarget: readonly Row[] } | null;
  randomTarget?: { rows: readonly Row[] } | null;
}

/** The chapters the game can show an Enemy Intent card in: the nineteen listed and the hidden ones, both games. */
const SWEPT = [...CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.game === 'ffx' || c.game === 'ffx2');

/** Magnitude: a heal's bounds are negative, and the card prints magnitudes. */
const mag = (n: number): number => Math.abs(n);

interface Sweep {
  cards: number;
  ranged: number;
  inverted: string[];
  outside: string[];
  chapters: string[];
}

let swept: Sweep | null = null;

function sweep(): Sweep {
  if (swept) return swept;
  const out: Sweep = { cards: 0, ranged: 0, inverted: [], outside: [], chapters: [] };
  for (const chapter of SWEPT) {
    for (const seed of [1, 2, 3]) {
      const { engine, options } = harnessFor(chapter.id, seed);
      const read = (cards: readonly Card[], where: string): void => {
        for (const card of cards) {
          out.cards += 1;
          const rows = [...(card.estimate?.perTarget ?? []), ...(card.randomTarget?.rows ?? [])];
          for (const r of rows) {
            if (mag(r.min) !== mag(r.max)) out.ranged += 1;
            const tag = `${where} ${card.moveName} -> ${r.targetName}: ${r.min}..${r.max} (mid ${r.amount})`;
            if (mag(r.min) > mag(r.max)) out.inverted.push(tag);
            else if (mag(r.amount) < mag(r.min) - 1 || mag(r.amount) > mag(r.max) + 1) out.outside.push(tag);
          }
        }
      };
      let decisions = 0;
      for (let i = 0; i < 6_000 && decisions < 16; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') {
          engine.tick?.(100);
          continue;
        }
        decisions += 1;
        const where = `${chapter.id}#${seed} turn ${decisions}`;
        const anyEngine = engine as unknown as { ctx?: Ctx; intent?: () => Card | null; gaugeSnapshot?: () => never; rng?: never };
        if (chapter.game === 'ffx2') {
          const env = { state: engine.state(), rng: anyEngine.rng!, snapshot: anyEngine.gaugeSnapshot!(), ...(options.ffx2 ?? {}) };
          read(predictFFX2EnemyIntents(env as never) as unknown as Card[], where);
        } else {
          read(predictEnemyIntents(anyEngine.ctx!) as unknown as Card[], where);
        }
        // Walk the fight on: the first enabled row, rotating through the list so spells, skills and items change the board too.
        const rows = d.commands.filter((c) => c.enabled && c.validTargets.length > 0);
        const row = rows[(decisions - 1) % Math.max(1, rows.length)] ?? rows[0];
        engine.submit(row ? ({ ...row.command, targets: [row.validTargets[0]!] } as Command) : ({ kind: 'defend', targets: [] } as Command));
      }
      if (seed === 1) out.chapters.push(`${chapter.id}:${decisions}`);
    }
  }
  swept = out;
  return out;
}

describe('every Enemy Intent card reads low to high (PR-0603)', () => {
  it('sweeps every chapter of both games, listed and hidden, and reads a few hundred cards with real ranges', () => {
    const s = sweep();
    expect(s.chapters.length).toBe(SWEPT.length);
    for (const entry of s.chapters) expect(Number(entry.split(':')[1]), entry).toBeGreaterThan(0);
    expect(s.cards).toBeGreaterThanOrEqual(300);
    expect(s.ranged).toBeGreaterThanOrEqual(100);
  }, 600_000);

  it('no card of any chapter has its low end above its high end', () => {
    expect(sweep().inverted).toEqual([]);
  }, 600_000);

  it('and the figure the card leads with sits inside its own band', () => {
    expect(sweep().outside).toEqual([]);
  }, 600_000);
});

describe('Chapter XII: the Mortiphasm Spells card (the finding, seed 1, the first menu)', () => {
  it('prices the fourth spell on the same victim in the low, middle and high runs, so each band brackets its figure', () => {
    const { engine } = harnessFor('seymour-omnis', 1);
    for (let i = 0; i < 400; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'player-input') break;
      engine.tick?.(100);
    }
    const [card] = predictEnemyIntents((engine as unknown as { ctx: Ctx }).ctx).filter((c) => c.moveName === 'Mortiphasm Spells');
    expect(card).toBeDefined();
    const rows = card!.estimate!.perTarget;
    expect(rows.length).toBeGreaterThanOrEqual(2);
    for (const r of rows) {
      expect(r.min, r.targetName).toBeLessThanOrEqual(r.amount);
      expect(r.amount, r.targetName).toBeLessThanOrEqual(r.max);
    }
  });
});

describe('the printed band is always low to high, in both games\' cards', () => {
  const row = (over: Partial<IntentTargetView>): IntentTargetView => ({
    targetId: 'tidus', targetName: 'Tidus', amount: 4408, min: 4132, max: 2333, hpFraction: 0.68, lethal: false, hitChancePercent: null, ...over,
  });
  const viewOf = (rows: IntentTargetView[]): IntentView => ({ estimate: { name: 'Mortiphasm Spells', hits: 1, perTarget: rows, totalHarmToParty: 0, heals: false }, randomTarget: null } as unknown as IntentView);

  it('hands an inverted band the right way round (4,132 / 2,333 prints 2,333 to 4,132)', () => {
    const html = damageHtml(viewOf([row({})]));
    expect(html).toContain('2,333–4,132');
    expect(html).not.toContain('4,132–2,333');
  });

  it('a heal\'s negative bounds print by magnitude, small to large', () => {
    const html = damageHtml(viewOf([row({ amount: -1000, min: -900, max: -1100 })]));
    expect(html).toContain('900–1,100');
  });

  it('a band whose two ends round to the same figure prints that figure once', () => {
    const html = damageHtml(viewOf([row({ amount: 1200, min: 1199.6, max: 1200.2 })]));
    expect(html).not.toContain('–');
    expect(html).toContain('>1,200<');
  });

  it('the phone line prints the same order, and so does the random-target list', () => {
    expect(phoneFigures(viewOf([row({})])).rows[0]!.band).toBe('2,333–4,132');
    const random = { rows: [row({}), row({ targetId: 'auron', targetName: 'Auron', amount: 2204, min: 2333, max: 2066 })], perHit: false, hits: 1 };
    const html = damageHtml({ ...viewOf([row({})]), randomTarget: random } as unknown as IntentView);
    expect(html).toContain('2,333–4,132');
    expect(html).toContain('2,066–2,333');
    expect(html).not.toContain('4,132–2,333');
    expect(html).not.toContain('2,333–2,066');
  });
});
