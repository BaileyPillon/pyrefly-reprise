// @vitest-environment jsdom
/**
 * FOC23-01 (FFX Chapter I at 390x844): the phone refit is told how much of the field's top the FFX
 * phone HUD covers (the turn strip and the intent strip), so a boss's head is not fitted under it.
 * The band is measured on the FFX phone HUD only; FFX-2's approved phone framing is untouched.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BattleMoments } from '../../src/engine/BattleMoments.ts';
import { phoneTopOf } from '../../src/ui/common/phoneSlice.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';

function box(el: HTMLElement, top: number, height: number): void {
  el.getBoundingClientRect = () => ({ x: 0, y: top, left: 0, top, width: 300, height, right: 300, bottom: top + height, toJSON: () => ({}) }) as DOMRect;
}

afterEach(() => {
  document.body.innerHTML = '';
  delete document.documentElement.dataset['phoneBattle'];
});

describe('phoneTopOf', () => {
  it('is the bottom of the FFX turn strip and intent strip, as a share of the field height', () => {
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    const game = document.createElement('div');
    game.id = 'game';
    box(game, 0, 520);
    const hud = document.createElement('div');
    hud.className = 'ffxhud';
    const ctb = document.createElement('div');
    ctb.className = 'ig-ctb';
    box(ctb, 10, 55);
    const intent = document.createElement('div');
    intent.className = 'eint__panel';
    box(intent, 65, 70);
    hud.append(ctb, intent);
    document.body.append(game, hud);
    // The rail's 65 plus the strip's usual 2 + 70 beats the measured 135.
    expect(phoneTopOf(document)).toBeCloseTo(137 / 520, 5);
  });

  it('is 0 off the FFX phone HUD (FFX-2, desktop)', () => {
    document.documentElement.dataset['phoneBattle'] = 'ffx2';
    const h = document.createElement('div');
    h.className = 'ffx2hud';
    document.body.append(h);
    expect(phoneTopOf(document)).toBe(0);
  });
});

describe('the battle start passes the band to the refit', () => {
  it('fitSlice gets the top share', async () => {
    const stage = new FakeStage(['tidus', 'yuna'], ['seymour-flux']);
    const got: number[] = [];
    (stage.camera as { fitSlice?: unknown }).fitSlice = (_r: string, _s: number, _subs: unknown[], top?: number) => {
      got.push(top ?? -1);
      return true;
    };
    const overlay = { letterbox: async () => {}, nameSlab: async () => {}, vignette: () => {}, clear: () => {}, phoneSlice: () => 0.42, phoneTop: () => 0.26 };
    const moments = new BattleMoments({ stage, moments: overlay, sleep: noSleep, speed: () => 'normal' });
    await moments.battleStart({ partyIds: ['tidus', 'yuna'] });
    expect(got).toEqual([0.26]);
  });
});

describe('phoneTopOf before the intent strip has a line', () => {
  it('reserves the strip under the measured rail', () => {
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    const game = document.createElement('div');
    game.id = 'game';
    box(game, 0, 520);
    const hud = document.createElement('div');
    hud.className = 'ffxhud';
    const ctb = document.createElement('div');
    ctb.className = 'ig-ctb';
    box(ctb, 10, 54);
    hud.append(ctb);
    document.body.append(game, hud);
    expect(phoneTopOf(document)).toBeCloseTo((64 + 2 + 70) / 520, 5);
  });
});
