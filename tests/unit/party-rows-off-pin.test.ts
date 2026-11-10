/**
 * The pin half of test 6 of the FFX-2 Special look (step A; game case: FFX-2 only in what is seen, the pins also read one FFX and one FF7 face).
 *
 * With the switch `specialDressUp` OFF, which is every shipped chapter, the party rows must be byte for byte what they are at the head the
 * look steps start from. Pinned, as strings, in `tests/fixtures/specials/off-pins/`:
 *  - `partyRowHtml(c, bar, { actingId: null, index })` for every row of every FFX-2 chapter of `CHAPTERS`, built the way `helpers/ffx2ChapterDrive.ts`
 *    builds the engine (seed 1);
 *  - the face stack the row embeds (`faceStackHtml` is private to `PartyRows.ts`, so it is read through `partyRowHtml`), for every girl x every dress she
 *    owns in any chapter x (idle, acting, KO, critical, live bars);
 *  - the exported `faceLadder` (base art and the experimental Leblanc art namespace) and the `partyFaceHtml` outputs: an FFX chapter's members, an FFX-2
 *    member in each dress, and the one FF7 chapter that exists (it is registered, not listed: `UNLISTED_CHAPTERS`).
 *
 * Removal check: change one character of a row template in `PartyRows.ts` and every case here fails.
 * The mounted HUD column and the CSS rules are pinned in `special-off-pins.test.ts`.
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AtbSnapshot, FFX2Combatant } from '../../src/battle/common/types.ts';
import type { FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { CHAPTERS, getChapter, type Chapter } from '../../src/data/encounters.ts';
import { partyRowHtml } from '../../src/ui/ffx2/PartyRows.ts';
import { faceLadder, partyFaceHtml } from '../../src/ui/common/partyFace.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';
import { expectPinned } from './helpers/offPins.ts';

type Bar = AtbSnapshot['bars'][number];

const FFX2_CHAPTERS: readonly Chapter[] = CHAPTERS.filter((c) => c.game === 'ffx2');

interface Opened {
  chapter: Chapter;
  active: string[];
  reserve: string[];
  party: FFX2Combatant[];
  bars: Bar[];
}

/** The engine of a chapter at its first link, built the way the chapter drive builds it (seed 1). */
function open(chapter: Chapter): Opened {
  const engine = new FFX2Engine(ffx2Options());
  engine.setSeed(1);
  engine.init({
    game: 'ffx2',
    party: chapter.buildRef as FFX2PartyBuild,
    enemies: chapter.enemyGroupRef,
    triggers: [],
    seed: 1,
    condition: 'normal',
    canEscape: false,
  });
  const state = engine.state();
  const ids = [...state.activeIds, ...state.reserveIds];
  return {
    chapter,
    active: [...state.activeIds],
    reserve: [...state.reserveIds],
    party: ids.map((id) => state.combatants[id] as FFX2Combatant),
    bars: engine.gaugeSnapshot().bars,
  };
}

const OPENED: readonly Opened[] = FFX2_CHAPTERS.map(open);

describe('the pins cover what they claim to', () => {
  it('names every FFX-2 chapter of CHAPTERS, the two main ones among them, each with a field party', () => {
    expect(FFX2_CHAPTERS.length).toBeGreaterThanOrEqual(6);
    const ids = FFX2_CHAPTERS.map((c) => c.id);
    expect(ids).toContain('ffx2-bahamut');
    expect(ids).toContain('ffx2-vegnagun-shuyin');
    for (const o of OPENED) expect(o.active.length, o.chapter.id).toBeGreaterThan(0);
  });
});

describe('OFF pin 1: the party row of every FFX-2 chapter', () => {
  it('partyRowHtml(c, bar, { actingId: null, index }) is the pinned string for every active member', () => {
    const rows: Record<string, { active: string[]; rows: string[] }> = {};
    for (const o of OPENED) {
      const html = o.active.map((id, i) => {
        const c = o.party.find((p) => p.id === id)!;
        const bar = o.bars.find((b) => b.actorId === id) ?? null;
        return partyRowHtml(c, bar, { actingId: null, index: i });
      });
      rows[o.chapter.id] = { active: o.active, rows: html };
    }
    expectPinned('ffx2-chapter-rows', rows);
  });
});

/** Every (girl, dress) pair any FFX-2 chapter hands her: her current one and every one she owns. */
function girlsAndDresses(): Array<{ girl: FFX2Combatant; dresses: string[] }> {
  const byGirl = new Map<string, { girl: FFX2Combatant; dresses: Set<string> }>();
  for (const o of OPENED) {
    for (const c of o.party) {
      if (!c.dresspheres) continue;
      const e = byGirl.get(c.id) ?? { girl: c, dresses: new Set<string>() };
      e.dresses.add(c.dresspheres.current);
      for (const d of c.dresspheres.owned) e.dresses.add(d);
      byGirl.set(c.id, e);
    }
  }
  return [...byGirl.values()].map((e) => ({ girl: e.girl, dresses: [...e.dresses].sort() }));
}

describe('OFF pin 2: the face stack, through the row that embeds it', () => {
  // A ready track in the live look carries the shimmer's phase from the page clock (`AtbLive.shimmerDelay`): stop the clock so the string is the same every run.
  beforeAll(() => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('every girl x every owned dress x (idle, acting, KO, critical, live bars) is the pinned string', () => {
    const grid = girlsAndDresses();
    expect(grid.map((g) => g.girl.id).sort()).toEqual(['paine', 'rikku', 'yuna']);
    const out: Record<string, string> = {};
    for (const { girl, dresses } of grid) {
      expect(dresses.length, girl.id).toBeGreaterThan(3);
      for (const dress of dresses) {
        const worn: FFX2Combatant = { ...girl, dresspheres: { ...girl.dresspheres!, current: dress } };
        const bar: Bar = { actorId: girl.id, fill: 0.5, required: 16000, ready: false, charge: null, state: 'normal' } as Bar;
        const ready: Bar = { ...bar, ready: true, charge: 0.4 } as Bar;
        const maxHp = worn.stats.maxHp;
        const key = `${girl.id}/${dress}`;
        out[`${key}/idle`] = partyRowHtml({ ...worn, hp: maxHp }, bar, { actingId: null, index: 0 });
        out[`${key}/acting`] = partyRowHtml({ ...worn, hp: maxHp }, bar, { actingId: girl.id, index: 1 });
        out[`${key}/ko`] = partyRowHtml({ ...worn, hp: 0, alive: false }, bar, { actingId: null, index: 2 });
        out[`${key}/critical`] = partyRowHtml({ ...worn, hp: Math.max(1, Math.floor(maxHp * 0.2)) }, bar, { actingId: null, index: 0 });
        out[`${key}/live`] = partyRowHtml({ ...worn, hp: maxHp }, ready, { actingId: null, index: 1, live: { fill: 0.5 } });
      }
    }
    expect(Object.keys(out).length).toBeGreaterThan(100);
    expectPinned('ffx2-face-stack-rows', out);
  });
});

describe('OFF pin 2b: faceLadder and partyFaceHtml', () => {
  it('faceLadder is the pinned ladder for every girl x dress, in the base art and inside the experimental art namespace', () => {
    const out: Record<string, { art: string; portraits: string[] }> = {};
    for (const { girl, dresses } of girlsAndDresses()) {
      for (const dress of dresses) {
        out[`${girl.id}/${dress}`] = faceLadder(girl.id, dress);
        out[`${girl.id}/${dress}/exp-leblanc`] = faceLadder(girl.id, dress, 'exp-leblanc');
      }
    }
    expectPinned('face-ladder', out);
  });

  it('partyFaceHtml is the pinned markup: an FFX chapter (seymour-flux), every FFX-2 girl in each dress, and the FF7 chapter', () => {
    const members = (id: string): Array<{ id: string; name: string }> => {
      const b = getChapter(id)?.buildRef as { members: Array<{ id: string; name: string }> } | undefined;
      expect(b, id).toBeDefined();
      return b!.members.map((m) => ({ id: m.id, name: m.name }));
    };
    const out: Record<string, string> = {};
    for (const m of members('seymour-flux')) out[`ffx/seymour-flux/${m.id}`] = partyFaceHtml(m);
    for (const m of members('ff7-guard-scorpion')) out[`ff7/ff7-guard-scorpion/${m.id}`] = partyFaceHtml(m);
    for (const { girl, dresses } of girlsAndDresses()) {
      for (const dress of dresses) {
        const m = { id: girl.id, name: girl.name, dressphere: dress };
        out[`ffx2/${girl.id}/${dress}`] = partyFaceHtml(m);
        out[`ffx2/${girl.id}/${dress}/body-only`] = partyFaceHtml({ ...m, bodyOnly: true });
        out[`ffx2/${girl.id}/${dress}/exp-leblanc`] = partyFaceHtml({ ...m, artNamespace: 'exp-leblanc' });
      }
    }
    expect(Object.keys(out).filter((k) => k.startsWith('ffx/')).length).toBeGreaterThan(0);
    expect(Object.keys(out).filter((k) => k.startsWith('ff7/')).length).toBeGreaterThan(0);
    expectPinned('party-face-html', out);
  });
});
