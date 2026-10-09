/**
 * **Re-parity, Chapter XII (1 of 2): the opening, his affinity from the discs and his four spells** (FFX only).
 *
 * Rows of `research/re-ffx-ai-seymour.md` section 5 (5.1, 5.3 and 5.4); the rows that differ from the old AI are D-26, D-31 and
 * D-33 of the note's section 6. The oracle is the note's own table of the 35 element multisets (from running his real
 * pre-turn and turn functions over all 256 disc layouts): every layout is checked, not a sample. The second half is
 * `parity-ffx-ai-omnis-discs.test.ts`: what turns a disc, when his affinity changes, the sequence and the counter.
 */

import { describe, expect, it } from 'vitest';
import type { Affinity } from '../../src/battle/common/types.ts';
import { chooseAiCommand } from '../../src/battle/ffx/index.ts';
import { summonAeon } from '../../src/battle/ffx/aeons.ts';
import { koActor } from '../../src/battle/ffx/hp.ts';
import { planOmnisVolley } from '../../src/battle/ffx/ai/seymour-omnis.ts';
import { OMNIS_CYCLE, OMNIS_DISCS, OMNIS_STATE, type Element4, omnisDiscs, refreshOmnisAffinities } from '../../src/battle/ffx/ai/seymour-omnis-rules.ts';
import { gardenOfPainBuild } from '../../src/data/ffx/builds/garden-of-pain.ts';
import { at, realCtx, withRng } from './helpers/seymourParity.ts';

const OMNIS = 'seymour-omnis';
const DISC = (n: number): string => `mortiphasm-${n}`;
const fresh = (seed = 1) => realCtx('seymour-omnis', seed, gardenOfPainBuild);
type TestCtx = ReturnType<typeof fresh>['ctx'];

const LETTER_TO_ELEMENT: Record<string, Element4> = { F: 'fire', I: 'ice', W: 'water', T: 'lightning' };
const NAME_TO_ELEMENT: Record<string, Element4> = { Fire: 'fire', Ice: 'ice', Water: 'water', Thunder: 'lightning' };
const LEVEL: Record<string, Affinity> = { Absorb: 'absorb', Weak: 'weak', Null: 'immune', Resist: 'resist' };
const RANK: Record<Affinity, number> = { normal: 0, resist: 1, weak: 2, immune: 3, absorb: 4 };

/** Put the four discs in a layout ('FIWT' = disc 1 Fire, disc 2 Ice, disc 3 Water, disc 4 Thunder) and refresh him. */
function setDiscs(ctx: TestCtx, layout: string): void {
  ctx.state.flags[OMNIS_DISCS] = [...layout].map((l) => LETTER_TO_ELEMENT[l]).join(',');
  refreshOmnisAffinities(ctx);
}

// ---------------------------------------------------------------------------
// The oracle: section 5.3's table. [multiset, affinity as written, spells in cast order]
// ---------------------------------------------------------------------------
const TABLE: ReadonlyArray<readonly [string, string, string]> = [
  ['FFFF', 'Absorb Fire, Weak Ice', 'Firaga, Firaga, Firaga, Firaga'],
  ['IIII', 'Absorb Ice, Weak Fire', 'Blizzaga, Blizzaga, Blizzaga, Blizzaga'],
  ['WWWW', 'Absorb Water, Weak Thunder', 'Waterga, Waterga, Waterga, Waterga'],
  ['TTTT', 'Absorb Thunder, Weak Water', 'Thundaga, Thundaga, Thundaga, Thundaga'],
  ['FFFI', 'Absorb Fire, Resist Ice', 'Firaga, Firaga, Firaga, Blizzara'],
  ['FFFW', 'Absorb Fire, Resist Water', 'Firaga, Firaga, Firaga, Watera'],
  ['FFFT', 'Absorb Fire, Resist Thunder', 'Firaga, Firaga, Firaga, Thundara'],
  ['FIII', 'Absorb Ice, Resist Fire', 'Blizzaga, Blizzaga, Blizzaga, Fira'],
  ['IIIW', 'Absorb Ice, Resist Water', 'Blizzaga, Blizzaga, Blizzaga, Watera'],
  ['IIIT', 'Absorb Ice, Resist Thunder', 'Blizzaga, Blizzaga, Blizzaga, Thundara'],
  ['FWWW', 'Absorb Water, Resist Fire', 'Waterga, Waterga, Waterga, Fira'],
  ['IWWW', 'Absorb Water, Resist Ice', 'Waterga, Waterga, Waterga, Blizzara'],
  ['TWWW', 'Absorb Water, Resist Thunder', 'Waterga, Waterga, Waterga, Thundara'],
  ['FTTT', 'Absorb Thunder, Resist Fire', 'Thundaga, Thundaga, Thundaga, Fira'],
  ['ITTT', 'Absorb Thunder, Resist Ice', 'Thundaga, Thundaga, Thundaga, Blizzara'],
  ['TTTW', 'Absorb Thunder, Resist Water', 'Thundaga, Thundaga, Thundaga, Watera'],
  ['FFII', 'Null Fire, Null Ice', 'Fira, Fira, Blizzara, Blizzara'],
  ['FFWW', 'Null Fire, Null Water', 'Fira, Fira, Watera, Watera'],
  ['FFTT', 'Null Fire, Null Thunder', 'Fira, Fira, Thundara, Thundara'],
  ['IIWW', 'Null Ice, Null Water', 'Blizzara, Blizzara, Watera, Watera'],
  ['IITT', 'Null Ice, Null Thunder', 'Blizzara, Blizzara, Thundara, Thundara'],
  ['TTWW', 'Null Fire, Null Thunder', 'Watera, Watera, Thundara, Thundara'], // the slip: Null Fire where Null Water was meant
  ['FFIW', 'Null Fire, Resist Ice, Resist Water', 'Fira, Fira, Blizzara, Watera'],
  ['FFIT', 'Null Fire, Resist Ice, Resist Thunder', 'Fira, Fira, Blizzara, Thundara'],
  ['FFTW', 'Null Fire, Resist Thunder, Resist Water', 'Fira, Fira, Watera, Thundara'],
  ['FIIW', 'Null Ice, Resist Fire, Resist Water', 'Blizzara, Blizzara, Fira, Watera'],
  ['FIIT', 'Null Ice, Resist Fire, Resist Thunder', 'Blizzara, Blizzara, Fira, Thundara'],
  ['IITW', 'Null Ice, Resist Thunder, Resist Water', 'Blizzara, Blizzara, Watera, Thundara'],
  ['FITT', 'Null Thunder, Resist Fire, Resist Ice', 'Thundara, Thundara, Blizzara, Fira'],
  ['FTTW', 'Null Thunder, Resist Fire, Resist Water', 'Thundara, Thundara, Watera, Fira'],
  ['ITTW', 'Null Thunder, Resist Ice, Resist Water', 'Thundara, Thundara, Blizzara, Watera'],
  ['FIWW', 'Null Fire, Resist Fire, Resist Ice', 'Watera, Watera, Blizzara, Fira'], // the slip
  ['FTWW', 'Null Fire, Resist Fire, Resist Thunder', 'Watera, Watera, Fira, Thundara'], // the slip
  ['ITWW', 'Null Fire, Resist Ice, Resist Thunder', 'Watera, Watera, Blizzara, Thundara'], // the slip
  ['FITW', 'Resist Fire, Resist Ice, Resist Thunder, Resist Water', 'Fira, Blizzara, Watera, Thundara'],
];

const canon = (s: string): string => [...s].sort().join('');
const ROW_OF = new Map(TABLE.map((row) => [canon(row[0]), row] as const));

/** The affinity the table's words give, the highest rank winning where an element is written twice (Null over Resist). */
function expectedAffinities(words: string): Record<Element4, Affinity> {
  const out: Record<Element4, Affinity> = { fire: 'normal', ice: 'normal', lightning: 'normal', water: 'normal' };
  for (const part of words.split(', ')) {
    const [level, name] = part.split(' ') as [string, string];
    const element = NAME_TO_ELEMENT[name] as Element4;
    const affinity = LEVEL[level] as Affinity;
    if (RANK[affinity] > RANK[out[element]]) out[element] = affinity;
  }
  return out;
}
const spellIds = (spells: string): string[] => spells.split(', ').map((s) => `omnis-${s.toLowerCase()}`);

/** All 256 ways to put one of four elements on each of four discs, as layout strings. */
function allLayouts(): string[] {
  const out: string[] = [];
  const letters = ['F', 'I', 'W', 'T'];
  for (const a of letters) for (const b of letters) for (const c of letters) for (const d of letters) out.push(a + b + c + d);
  return out;
}

describe('the opening (the formation script\'s scene 4; section 5.1)', () => {
  it('the four discs show Fire, so he opens absorbing Fire and weak to Ice, with his Defense at 180', () => {
    const { ctx } = fresh();
    expect(omnisDiscs(ctx.state)).toEqual(['fire', 'fire', 'fire', 'fire']);
    const omnis = at(ctx, OMNIS);
    expect(omnis.affinities.fire).toBe('absorb');
    expect(omnis.affinities.ice).toBe('weak');
    expect(omnis.stats.def).toBe(180);
    expect(ctx.state.flags[OMNIS_STATE]).toBe('normal');
    expect(ctx.state.flags[OMNIS_CYCLE]).toBe(0);
  });

  it('the discs own no turn: they are off the queue', () => {
    const { ctx } = fresh();
    for (let n = 1; n <= 4; n++) expect(ctx.rt.actors.get(DISC(n))?.ordersOnly).toBe(true);
    expect(chooseAiCommand(ctx, at(ctx, DISC(1)))).toBeNull();
  });
});

describe('his affinity from the discs: all 256 layouts against the 35 rows of section 5.3 (D-31)', () => {
  it('the table covers every multiset of four discs, and the layouts add up to 256', () => {
    expect(new Set(TABLE.map((r) => canon(r[0]))).size).toBe(35);
    expect(allLayouts().length).toBe(256);
    expect(allLayouts().every((l) => ROW_OF.has(canon(l)))).toBe(true);
  });

  it('every layout gives the affinity the table gives its multiset, and nothing for Holy or any other element', () => {
    const { ctx } = fresh();
    const omnis = at(ctx, OMNIS);
    const holy = omnis.affinities['holy'];
    for (const layout of allLayouts()) {
      setDiscs(ctx, layout);
      const row = ROW_OF.get(canon(layout)) as readonly [string, string, string];
      const want = expectedAffinities(row[1]);
      for (const element of ['fire', 'ice', 'lightning', 'water'] as const) {
        expect(omnis.affinities[element] ?? 'normal', `${layout} ${element}`).toBe(want[element]);
      }
      expect(omnis.affinities['holy']).toBe(holy);
    }
  });

  it('the Water-pair slip: Null Fire where Null Water was meant, only when the Water pair is the first pair the chain meets', () => {
    const { ctx } = fresh();
    const omnis = at(ctx, OMNIS);
    for (const layout of ['TTWW', 'WWTT', 'FIWW', 'WIFW', 'FTWW', 'ITWW']) {
      setDiscs(ctx, layout);
      expect(omnis.affinities.fire, layout).toBe('immune');
      expect(omnis.affinities.water ?? 'normal', layout).not.toBe('immune');
    }
    for (const layout of ['FFWW', 'IIWW', 'WFWF', 'WIIW']) {
      setDiscs(ctx, layout);
      expect(omnis.affinities.water, layout).toBe('immune'); // a Fire or an Ice pair meets Water in its own branch
    }
    setDiscs(ctx, 'IIWW');
    expect(omnis.affinities.fire ?? 'normal').toBe('normal'); // and the slip does not Null Fire there
  });
});

describe('his four spells (m131 @0xa0a to 0x16c8; D-26)', () => {
  it('always four, in the table\'s order, -ga for an element on three or four discs and -ra otherwise: all 256 layouts', () => {
    const { ctx } = fresh();
    for (const layout of allLayouts()) {
      setDiscs(ctx, layout);
      const row = ROW_OF.get(canon(layout)) as readonly [string, string, string];
      const volley = planOmnisVolley(ctx);
      expect(volley.map((c) => c.abilityId), layout).toEqual(spellIds(row[2]));
    }
  });

  it('three or four of a kind: spells 1 to 3 go to Character 1, 2, 3 in that order and spell 4 to a random living member', () => {
    const { ctx } = fresh();
    const slots = ctx.state.activeIds;
    for (const layout of ['FFFF', 'WWWW', 'FFFI', 'TTTW', 'IWII']) {
      setDiscs(ctx, layout);
      const rng = withRng(ctx, [1]); // the fourth spell: index 1 of three candidates
      const volley = planOmnisVolley(ctx);
      expect(volley.map((c) => c.targetId), layout).toEqual([slots[0], slots[1], slots[2], slots[1]]);
      expect(rng.spent, layout).toEqual({ script: 0, picker: 1, other: 0 });
    }
  });

  it('every other layout: all four go to random living members, each its own picker draw, in ascending actor order', () => {
    const { ctx } = fresh();
    for (const layout of ['FFII', 'TTWW', 'FIWT', 'FFIW']) {
      setDiscs(ctx, layout);
      const rng = withRng(ctx, [0, 1, 2, 3]);
      const volley = planOmnisVolley(ctx);
      const party = [...ctx.state.activeIds]; // tidus 0, yuna 1, auron 2
      expect(rng.spent, layout).toEqual({ script: 0, picker: 4, other: 0 });
      expect(volley.map((c) => c.targetId), layout).toEqual([party[0], party[1], party[2], party[0]]);
    }
  });

  it('a slotted spell whose slot has 0 HP goes to a random living member instead (one more picker draw)', () => {
    const { ctx } = fresh();
    setDiscs(ctx, 'FFFF');
    const slots = ctx.state.activeIds;
    koActor(ctx, at(ctx, slots[1] as string));
    const rng = withRng(ctx, [1, 1]); // spell 2's fallback, then spell 4
    const volley = planOmnisVolley(ctx);
    const living = [slots[0], slots[2]];
    expect(rng.spent.picker).toBe(2);
    expect(volley).toHaveLength(4);
    expect(volley.map((c) => c.targetId)).toEqual([slots[0], living[1], slots[2], living[1]]);
    expect(volley.every((c) => c.targetId !== slots[1])).toBe(true);
  });

  it('with fewer standing he still casts four spells (the old rule cast fewer); with one standing no draw is spent', () => {
    const { ctx } = fresh();
    setDiscs(ctx, 'FIWT');
    const slots = ctx.state.activeIds;
    koActor(ctx, at(ctx, slots[0] as string));
    koActor(ctx, at(ctx, slots[1] as string));
    const rng = withRng(ctx, [5, 5, 5, 5]);
    const volley = planOmnisVolley(ctx);
    expect(volley).toHaveLength(4);
    expect(volley.every((c) => c.targetId === slots[2])).toBe(true);
    expect(rng.calls).toHaveLength(0);
  });

  it('an aeon on the field takes all four spells, in every one of the 256 layouts (D-33)', () => {
    const { ctx } = fresh();
    summonAeon(ctx, 'yuna', 'shiva');
    expect(ctx.state.aeonId).toBe('shiva');
    for (const layout of allLayouts()) {
      setDiscs(ctx, layout);
      const volley = planOmnisVolley(ctx);
      expect(volley, layout).toHaveLength(4);
      expect(volley.every((c) => c.targetId === 'shiva'), layout).toBe(true);
    }
  });
});
