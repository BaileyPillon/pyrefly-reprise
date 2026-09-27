// @vitest-environment jsdom
/**
 * The game-branch audit, proven by running (AGENTS.md rule 3): FF7 never falls
 * silently into an FFX or FFX-2 branch.
 *
 * `GameId` gained `'ff7'` on 2026-09-27. Every site the FF7 path can reach that
 * branches two ways either answers `'ff7'` explicitly or throws
 * `Ff7NotHandledError` naming itself (`docs/plans/ff7-game-branch-audit.md`).
 * This file calls each guarded site with FF7 input. Game case: shared
 * plumbing (both + FF7): the FFX and FFX-2 answers are unchanged (their own
 * suites and the goldens), this only pins the FF7 one.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { Ff7NotHandledError, ffxFamily, isFfxFamily } from '../../src/battle/common/game.ts';
import type { BattleState } from '../../src/battle/common/types.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { createEngine, createHud } from '../../src/app/screens/BattleScreenWiring.ts';
import { setupForChapter, carryPartyForward } from '../../src/app/screens/BattleScreenSetup.ts';
import { abilityFactsFor } from '../../src/app/screens/battleAbilityFacts.ts';
import { rosterHtml, slotsHtml, statSheetHtml } from '../../src/app/screens/PartyPrepContent.ts';
import { recommendedParty } from '../../src/app/screens/frontend/chapterCards.ts';
import { inThisFightRows } from '../../src/app/screens/pause/meters.ts';
import { buildMemberRows, clearTimeMs, leaderId } from '../../src/ui/common/resultsMath.ts';
import { marksFor } from '../../src/ui/coach/coachCopy.ts';
import { withCoach } from '../../src/ui/coach/CoachLayer.ts';
import { installPhoneBattle } from '../../src/ui/common/phoneBattle.ts';
import { TurnCutInBeat } from '../../src/engine/TurnCutIn.ts';
import { buildAdvisorView } from '../../src/engine/tactics/advisor.ts';
import { GAME_LABELS } from '../../src/data/chapter-meta.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { Ff7BattleHud } from '../../src/ui/ff7/Ff7BattleHud.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { Ff7Engine } from '../../src/battle/ff7/index.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FF7 = getChapter('ff7-guard-scorpion')!;

function ff7State(): BattleState {
  return {
    game: 'ff7',
    combatants: { cloud: { id: 'cloud', name: 'Cloud', side: 'party', hp: 316, alive: true } },
    activeIds: ['cloud'],
    enemyIds: [],
  } as unknown as BattleState;
}

describe('the guard itself', () => {
  it('passes FFX and FFX-2 through and throws for FF7, naming the site', () => {
    expect(ffxFamily('ffx', 'x')).toBe('ffx');
    expect(ffxFamily('ffx2', 'x')).toBe('ffx2');
    expect(isFfxFamily('ff7')).toBe(false);
    expect(() => ffxFamily('ff7', 'the probe')).toThrow(Ff7NotHandledError);
    expect(() => ffxFamily('ff7', 'the probe')).toThrow(/the probe/);
  });

  it('stays pure (layering rule 1): no DOM, no three, in game.ts and types-ff7.ts', () => {
    for (const file of ['src/battle/common/game.ts', 'src/battle/common/types-ff7.ts']) {
      const src = readFileSync(join(ROOT, file), 'utf8');
      expect(src, file).not.toMatch(/from 'three'|document\.|window\.|Math\.random/);
    }
  });
});

describe('construction never builds an FFX-2 engine or HUD for FF7', () => {
  it('createEngine builds the FF7 engine (engine part 2), never an FFX-2 one', async () => {
    const engine = await createEngine('ff7', setupForChapter(FF7, 1));
    expect(engine).toBeInstanceOf(Ff7Engine);
    expect(engine).not.toBeInstanceOf(FFX2Engine);
    expect(engine.state().game).toBe('ff7');
    // Never handed FFX-2's saved ATB mode: FF7 keeps its own default, Recommended (core §2.5).
    expect((engine as Ff7Engine).ff7AtbMode()).toBe('recommended');
  });

  it('createHud builds the FF7 HUD: never the FFX-2 HUD, never a coach (FF7 only)', () => {
    const hud = createHud('ff7');
    expect(hud).toBeInstanceOf(Ff7BattleHud);
    expect(hud).not.toBeInstanceOf(FFX2BattleHud);
  });

  it('the FFX-2 engine itself refuses an FF7 party (its own guard, unchanged)', () => {
    expect(() => new FFX2Engine().init(setupForChapter(FF7, 1))).toThrow(/FFX2PartyBuild/);
  });

  it('a chained carry refuses FF7 (Guard Scorpion has no chain)', () => {
    expect(() => carryPartyForward(FF7.buildRef, ff7State())).toThrow(Ff7NotHandledError);
  });
});

describe('presentation sites answer FF7 explicitly or throw', () => {
  it('no coach: withCoach hands the HUD back untouched and there are no FF7 marks', () => {
    const hud = { mount() {} } as unknown as HudPort;
    expect(withCoach('ff7', hud)).toBe(hud);
    expect(marksFor('ff7')).toEqual([]);
  });

  it('no turn cut-in for FF7', () => {
    const beat = new TurnCutInBeat({ moments: { turnCutIn: () => Promise.resolve() } as never, speed: () => 'normal' });
    expect(beat.wants(ff7State() as never, 'cloud')).toBe(false);
  });

  it('the advisor is off for FF7', () => {
    expect(buildAdvisorView(ff7State() as never, { actorId: 'cloud', commands: [] } as never)).toBeNull();
  });

  it('ability facts, pause meters, phone layout and party prep throw rather than read FFX-2', () => {
    expect(() => abilityFactsFor('ff7')).toThrow(Ff7NotHandledError);
    expect(() => inThisFightRows({} as never, 'ff7')).toThrow(Ff7NotHandledError);
    expect(() => installPhoneBattle(document.createElement('div'), 'ff7', (() => ({})) as never)).toThrow(Ff7NotHandledError);
    expect(() => rosterHtml(FF7.buildRef, 0)).toThrow(Ff7NotHandledError);
    expect(() => slotsHtml(FF7.buildRef)).toThrow(Ff7NotHandledError);
    expect(() => statSheetHtml(FF7.buildRef, 0)).toThrow(Ff7NotHandledError);
    expect(() => recommendedParty(FF7)).toThrow(Ff7NotHandledError);
  });

  it('results: rows throw, the leader is active slot 1, and a tick-only clear time throws (FF7 tick unsourced)', () => {
    expect(() => buildMemberRows(FF7, { exp: 0, ap: 0 } as never)).toThrow(Ff7NotHandledError);
    expect(leaderId(FF7)).toBe('cloud');
    expect(clearTimeMs({ elapsedMs: 120_000, elapsedTicks: 0 }, undefined, 'ff7')).toBe(120_000);
    expect(() => clearTimeMs({ elapsedMs: 0, elapsedTicks: 900 }, undefined, 'ff7')).toThrow(Ff7NotHandledError);
  });

  it('labels FF7 as FF7, never as FFX', () => {
    expect(GAME_LABELS.ff7).toBe('FF7');
  });
});
