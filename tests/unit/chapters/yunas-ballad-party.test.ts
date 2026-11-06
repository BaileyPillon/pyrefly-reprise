/**
 * The one shared-contract change of Yuna's Ballad (the hidden FFX-2 chapter), and the proof that it touches nothing else. **Both games' plumbing, FFX-2's type** [AGENTS.md rules 2 and 14; `docs/CONTRACT-CHANGES.md`].
 *
 * `FFX2PartyBuild.members` was a fixed three-tuple; since 2026-11-06 it is a union of tuples of three, two or one girl (additive: the type `FFXPartyBuild.activeSlots` took the same shape on 2026-09-25 for Chapter XIV's solo duel).
 * The preflight's T0 found the core already built the line-up from the list's length (`yunas-ballad-engine.test.ts`); this file pins the contract:
 *
 * 1. **The type** (checked by `tsc`, which compiles the tests): one, two and three girls are a party, four and none are not.
 * 2. **Nothing else changed**: every other FFX-2 chapter's party, listed and hidden, is still exactly three girls in the order Yuna, Rikku, Paine; only the Ballad's holds one.
 * 3. **The plumbing that reads a party keeps its length**: the setup of a chapter, the carry into the next link (HP and MP, the full state, the worn dressphere) and the chapter's start do not add, drop or reorder a girl, and
 *    the scene-slot warning (`BattleScreenSetup`, more members than slots) is silent for one.
 */
import { describe, expect, it, vi } from 'vitest';

import { carryFfx2Full, carryWornDresspheres } from '../../../src/app/screens/BattleScreenCarry.ts';
import { carryPartyForward, setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2_YUNAS_BALLAD } from '../../../src/data/chapter-ffx2-yunas-ballad.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS } from '../../../src/data/encounters.ts';
import { yunasBalladBuild } from '../../../src/data/ffx2/builds/yunas-ballad.ts';
import { denOfWoeKit } from '../../../src/data/ffx2/builds/den-of-woe.ts';
import { openDuel, runDuel, turnOf, LINES, yunaOf } from '../helpers/yunasBalladDrive.ts';

const girl = yunasBalladBuild.members[0];

describe('the type: one, two and three girls are a party; four and none are not (compile-time, by tsc)', () => {
  it('compiles a party of one, two and three, and refuses four and none', () => {
    const one: FFX2PartyBuild['members'] = [girl];
    const two: FFX2PartyBuild['members'] = [girl, girl];
    const three: FFX2PartyBuild['members'] = [girl, girl, girl];
    // @ts-expect-error a fourth girl is still not a party
    const four: FFX2PartyBuild['members'] = [girl, girl, girl, girl];
    // @ts-expect-error nor is an empty one
    const none: FFX2PartyBuild['members'] = [];
    expect([one.length, two.length, three.length, four.length, none.length]).toEqual([1, 2, 3, 4, 0]);
  });
});

describe('nothing else changed', () => {
  it('every FFX-2 chapter\'s party but the Ballad\'s is exactly three girls, Yuna then Rikku then Paine (listed chapters and every other hidden one)', () => {
    const ffx2 = [...CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.buildRef.game === 'ffx2');
    expect(ffx2.length).toBeGreaterThanOrEqual(15); // the listed FFX-2 chapters and the hidden ones, the Ballad among them
    for (const chapter of ffx2) {
      const build = chapter.buildRef as FFX2PartyBuild;
      if (chapter.id === FFX2_YUNAS_BALLAD.id) {
        expect(build.members.map((m) => m.id), chapter.id).toEqual(['yuna']);
        continue;
      }
      expect(build.members.map((m) => m.id), chapter.id).toEqual(['yuna', 'rikku', 'paine']);
    }
  });

  it('the Ballad\'s Yuna IS the Den of Woe kit\'s Yuna (a deep copy: the kit is untouched), and no other girl of the kit was changed', () => {
    expect(denOfWoeKit.members).toHaveLength(3);
    expect(yunasBalladBuild.members).toHaveLength(1);
    expect(yunasBalladBuild.members[0]).toEqual(denOfWoeKit.members[0]);
    expect(yunasBalladBuild.members[0]).not.toBe(denOfWoeKit.members[0]);
    expect(yunasBalladBuild.inventory).toEqual(denOfWoeKit.inventory);
    expect(yunasBalladBuild.gil).toBe(denOfWoeKit.gil);
    expect(denOfWoeKit.members.map((m) => m.level)).toEqual([54, 56, 58]); // the Den's shipped kit, as Bailey picked it on 2026-09-26
  });
});

describe('the plumbing that reads a party keeps its length', () => {
  it('setupForChapter fields one girl and does not warn about the scene slots', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const setup = setupForChapter(FFX2_YUNAS_BALLAD, 3);
    expect(setup.party.game).toBe('ffx2');
    if (setup.party.game === 'ffx2') expect(setup.party.members).toHaveLength(1);
    expect(warn.mock.calls.filter(([m]) => String(m).includes('scene slots'))).toEqual([]);
    warn.mockRestore();
  });

  it('the carry into the next link (HP and MP; the full state; the worn dressphere) keeps one girl, her id and her place', () => {
    const engine = openDuel(0, 8);
    runDuel(engine, 0, turnOf(LINES.warrior));
    const state = engine.state();
    const yuna = yunaOf(engine);
    for (const carried of [
      carryPartyForward(yunasBalladBuild, state, false, false),
      carryPartyForward(yunasBalladBuild, state, false, true),
      carryPartyForward(yunasBalladBuild, state, true, false),
      carryFfx2Full(yunasBalladBuild, state),
      carryWornDresspheres(yunasBalladBuild, state),
    ]) {
      expect(carried.game).toBe('ffx2');
      if (carried.game !== 'ffx2') continue;
      expect(carried.members.map((m) => m.id)).toEqual(['yuna']);
    }
    const full = carryPartyForward(yunasBalladBuild, state, false, true);
    expect(full.game).toBe('ffx2');
    if (full.game !== 'ffx2') return;
    expect(full.members[0].hp).toBe(Math.min(yuna.hp, yuna.stats.maxHp));
    expect(full.members[0].mp).toBe(yuna.mp);
  });

  it('a three-girl party carried the same way still has three (the old shape, through the same functions)', () => {
    const engine = openDuel(0, 8);
    const three = structuredClone(denOfWoeKit);
    const carried = carryFfx2Full(three, engine.state());
    expect(carried.members.map((m) => m.id)).toEqual(['yuna', 'rikku', 'paine']);
  });
});
