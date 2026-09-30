/**
 * The battle pacing OPTION (fb-0929; `src/engine/pace.ts`), pinned.
 *
 * Bailey's friend: "moves and transitions happen too fast". Taste, so an option for Bailey,
 * default off (AGENTS.md rules 9 and 10). What must hold:
 *
 * 1. The default is `'current'`, and at `'current'` every multiplier is exactly 1 (the live build).
 * 2. FFX and FFX-2 have their own presets (rule 14: CTB vs ATB); FF7 and anything else is never paced.
 * 3. It is presentation only: a real chapter played through the real presenter under
 *    `'relaxed'` emits the **same event log** as under `'current'` (the engine, the RNG, the
 *    CTB order and the FFX-2 ATB clock are untouched), and every presenter wait is either the
 *    same or stretched by exactly the preset's action factor.
 *
 * Game case: both (the switch is shared plumbing), with separate per-game presets.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { BattleEvent, Command } from '../../src/battle/common/types.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import {
  PACE_NAMES,
  PACE_PRESETS,
  pace,
  paceFactor,
  paceFromQuery,
  paceGameOf,
  paceRate,
  setPace,
  setPaceGame,
} from '../../src/engine/pace.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import * as ffx2data from '../../src/data/ffx2/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';
import { setCappedAutoPlay } from './helpers/presenterCap.ts';

afterEach(() => {
  setPace('current');
  setPaceGame('other');
});

describe('pace module', () => {
  it("defaults to 'current', where every multiplier is exactly 1 for both games", () => {
    expect(pace()).toBe('current');
    for (const g of ['ffx', 'ffx2'] as const) {
      for (const k of ['action', 'numeral', 'transition'] as const) {
        expect(paceFactor(k, g)).toBe(1);
        expect(paceRate(k, g)).toBe(1);
      }
    }
  });

  it('keeps separate FFX and FFX-2 presets, and never paces FF7', () => {
    setPace('relaxed');
    expect(paceFactor('action', 'ffx')).toBe(PACE_PRESETS.ffx.relaxed.action);
    expect(paceFactor('action', 'ffx2')).toBe(PACE_PRESETS.ffx2.relaxed.action);
    expect(PACE_PRESETS.ffx.relaxed).not.toEqual(PACE_PRESETS.ffx2.relaxed);
    expect(paceFactor('action', paceGameOf('ff7'))).toBe(1);
    expect(paceFactor('transition', paceGameOf('ff7'))).toBe(1);
    // Every non-default preset lengthens, never shortens.
    for (const g of ['ffx', 'ffx2'] as const) {
      for (const n of PACE_NAMES) {
        for (const v of Object.values(PACE_PRESETS[g][n])) expect(v).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('follows the battle screen\'s game when none is named', () => {
    setPace('steady');
    setPaceGame('ffx2');
    expect(paceFactor('numeral')).toBe(PACE_PRESETS.ffx2.steady.numeral);
    setPaceGame('ff7');
    expect(paceFactor('numeral')).toBe(1);
  });

  it('refuses unknown names and reads ?pace= from a query string', () => {
    expect(setPace('ludicrous')).toBe(false);
    expect(pace()).toBe('current');
    expect(paceFromQuery('?coach=off&pace=relaxed')).toBe('relaxed');
    expect(paceFromQuery('?pace=fast')).toBeNull();
    expect(paceFromQuery('')).toBeNull();
  });
});

// ------------------------------------------------------- presentation only, by running the engine

class SilentHud implements HudPort {
  mount(): void {}
  unmount(): void {}
  sync(): void {}
  onEvent(): void {}
  async chooseCommand(): Promise<Command> {
    throw new Error('auto-played: no menu should open');
  }
  async openMinigame(): Promise<never> {
    throw new Error('auto-played: minigames are auto-resolved');
  }
  setVisible(): void {}
  setProjector(): void {}
}

function ffxEngine(seed: number) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.setSeed(seed);
  engine.init({
    game: 'ffx', party: gagazetBuild, enemies: ENEMY_GROUPS_BY_ID['seymour-flux']!,
    triggers: [], seed, condition: 'normal', canEscape: false,
  });
  return engine;
}

function ffx2Engine(seed: number) {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(ffx2data.ABILITIES)),
    items: itemRegistryFrom(Object.values(ffx2data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(ffx2data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2data.GARMENT_GRIDS)),
    minigames: false,
  });
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2', party: bevelleBuild, enemies: ffx2data.ENEMY_GROUPS_BY_ID['ffx2-bahamut']!,
    triggers: [], seed, condition: 'normal', canEscape: false,
  });
  return engine;
}

/** Play one real chapter through the real presenter on a fake clock; the event log and every wait. */
async function playChapter(game: 'ffx' | 'ffx2', seed: number): Promise<{ log: BattleEvent[]; waits: number[] }> {
  setPaceGame(game);
  const engine = game === 'ffx' ? ffxEngine(seed) : ffx2Engine(seed);
  const state = engine.state();
  const waits: number[] = [];
  const presenter = new BattlePresenter({
    stage: new FakeStage([...state.activeIds], [...state.enemyIds]),
    hud: new SilentHud(),
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    audio: new FakeAudio(),
    cutscenes: new FakeCutscenes(),
    sleep: (ms) => {
      waits.push(ms);
      return Promise.resolve();
    },
    now: () => 0,
  });
  setCappedAutoPlay(presenter, intendedStrategy, 400);
  await presenter.run(engine as never);
  return { log: JSON.parse(JSON.stringify(engine.state().log)) as BattleEvent[], waits };
}

describe.each([
  { label: 'Chapter I, Seymour Flux (FFX, CTB)', game: 'ffx' as const },
  { label: 'Chapter IV, Bahamut (FFX-2, ATB)', game: 'ffx2' as const },
])('relaxed pacing is presentation only: $label', ({ game }) => {
  it('emits the identical event log and stretches each wait by the action factor or not at all', async () => {
    setPace('current');
    const base = await playChapter(game, 20260929);
    setPace('relaxed');
    const slow = await playChapter(game, 20260929);
    const f = PACE_PRESETS[game].relaxed.action;

    expect(base.log.length).toBeGreaterThan(20);
    expect(slow.log).toEqual(base.log); // engine, RNG, turn order, ATB: untouched

    expect(slow.waits.length).toBe(base.waits.length);
    let stretched = 0;
    base.waits.forEach((ms, i) => {
      const got = slow.waits[i]!;
      if (Math.abs(got - ms * f) < 1e-6 && ms > 0) stretched += 1;
      else expect(got).toBeCloseTo(ms, 6); // an unscaled wait (a cut-in card, the Active pump) stays put
    });
    expect(stretched / base.waits.filter((w) => w > 0).length).toBeGreaterThan(0.8);
  });
});
