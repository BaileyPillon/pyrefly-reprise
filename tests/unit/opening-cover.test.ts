// @vitest-environment jsdom
/**
 * The opening's first frame under the boss card (post-conference lane "post-fight-start", pose continuity; BOTH GAMES: shared opening plumbing, Chapter I is FFX and Chapter IV is FFX-2).
 *
 * Release 64 let the card fade onto a party standing at home with the full HUD up, and only then began the opening, which took the HUD down and put the party at alpha 0 (a pop at the start of every
 * opening). Now, as the card starts to leave (`BattleStartBanner` `covered`), `BattleMoments.coverOpening` takes the HUD down and parks the party at alpha 0 under it; the opening finds them already down
 * and plays exactly as before. A hurried opening, a skipped run and `?opencover=off` keep what they had; a party parked and not slid on comes back.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BattleMoments } from '../../src/engine/BattleMoments.ts';
import type { PlaybackSpeed } from '../../src/engine/BattlePresenterPorts.ts';
import { parkParty, slideParty, unparkParty } from '../../src/engine/OpeningPark.ts';
import { BattleStartBanner } from '../../src/ui/common/BattleStartBanner.ts';
import { coverOption, openingCovered } from '../../src/ui/common/transitions/cardHold.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';

const PARTY = ['tidus', 'yuna', 'auron'];
const OPEN = { partyIds: PARTY, bossId: 'seymour-flux', bossName: 'Seymour Flux' } as const;

function setup(speed: PlaybackSpeed = 'normal') {
  const stage = new FakeStage(PARTY, ['seymour-flux']);
  const hud: boolean[] = [];
  const moments = new BattleMoments({ stage, sleep: noSleep, speed: () => speed, hud: { setVisible: (v: boolean) => void hud.push(v) } });
  const alphas = (): number[] => PARTY.map((id) => stage.actors.get(id)!.alpha);
  return { stage, moments, hud, alphas };
}

describe('OpeningPark', () => {
  it('parks each member at alpha 0 once, and puts back only the ones it parked', () => {
    const { stage, alphas } = setup();
    const odd = stage.actors.get('yuna')!;
    odd.alpha = 0.4; // a figure the opening has no business restoring is not parked: it is simply not in the ids
    parkParty(stage, ['tidus', 'auron']);
    expect(alphas()).toEqual([0, 0.4, 0]);
    parkParty(stage, ['tidus']); // again: nothing changes
    unparkParty(stage, PARTY);
    expect(alphas()).toEqual([1, 0.4, 1]); // yuna was never parked: untouched
    unparkParty(stage, PARTY); // again: nothing parked, nothing touched
    expect(alphas()).toEqual([1, 0.4, 1]);
  });

  it('a slide takes a parked figure over: it is no longer the park\'s to put back', async () => {
    const { stage, alphas } = setup();
    parkParty(stage, PARTY);
    await slideParty(stage, PARTY, 520);
    expect(alphas()).toEqual([1, 1, 1]); // the slide faded them in
    stage.actors.get('tidus')!.alpha = 0.3;
    unparkParty(stage, PARTY); // not parked any more
    expect(stage.actors.get('tidus')!.alpha).toBe(0.3);
  });
});

describe('BattleMoments.coverOpening', () => {
  it('takes the HUD down and the party to alpha 0, and touches nothing else', () => {
    const { stage, moments, hud, alphas } = setup();
    moments.coverOpening(PARTY);
    expect(hud).toEqual([false]);
    expect(alphas()).toEqual([0, 0, 0]);
    expect(stage.calls.filter((c) => c.startsWith('camera') || c.startsWith('moveTo'))).toEqual([]); // no camera, no position
  });

  it('the opening that follows plays as it did: HUD down again, the party fades in, the HUD comes back', async () => {
    const { moments, hud, alphas } = setup();
    moments.coverOpening(PARTY);
    await moments.battleStart(OPEN);
    expect(hud[0]).toBe(false);
    expect(hud[hud.length - 1]).toBe(true); // handed back at the opening's end
    expect(alphas()).toEqual([1, 1, 1]);
  });

  it('a hurried opening and a skipped run cover nothing', () => {
    const a = setup();
    a.moments.hurry = true;
    a.moments.coverOpening(PARTY);
    expect(a.hud).toEqual([]);
    expect(a.alphas()).toEqual([1, 1, 1]);
    const b = setup('skip');
    b.moments.coverOpening(PARTY);
    expect(b.hud).toEqual([]);
    expect(b.alphas()).toEqual([1, 1, 1]);
    const c = setup();
    c.moments.coverOpening([]);
    expect(c.hud).toEqual([]);
  });

  it('an opening that then collapses puts the party back (nothing slides on), and the HUD is handed back as ever', async () => {
    const { moments, hud, alphas } = setup();
    moments.coverOpening(PARTY);
    expect(alphas()).toEqual([0, 0, 0]);
    moments.hurry = true; // a press between the cover and the opening: every wait collapses
    await moments.battleStart(OPEN);
    expect(alphas()).toEqual([1, 1, 1]);
    expect(hud[hud.length - 1]).toBe(true);
  });
});

describe('BattleStartBanner covered', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });
  const make = (covered: () => void, holdMs = 1900) => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const banner = new BattleStartBanner({ root, bossName: 'Bahamut', holdMs, covered });
    let gone = false;
    void banner.show().then(() => void (gone = true));
    return { banner, root, isGone: () => gone };
  };

  it('runs once, as the card starts to leave and before the fade begins', async () => {
    const seen: boolean[] = [];
    let el: HTMLElement | null = null;
    const c = make(() => seen.push(el!.classList.contains('bstart--leaving')));
    el = c.banner.el;
    await vi.advanceTimersByTimeAsync(1899);
    expect(seen).toEqual([]); // still holding
    await vi.advanceTimersByTimeAsync(5);
    expect(seen).toEqual([false]); // called with the card whole
    expect(el.classList.contains('bstart--leaving')).toBe(true);
    c.banner.dismiss(); // a second dismiss does not run it again
    await vi.advanceTimersByTimeAsync(400);
    expect(seen).toHaveLength(1);
    expect(c.isGone()).toBe(true);
  });

  it('a press takes the card down and runs it too, once', async () => {
    const covered = vi.fn();
    const c = make(covered);
    await vi.advanceTimersByTimeAsync(300);
    c.banner.dismiss();
    c.banner.dismiss();
    await vi.advanceTimersByTimeAsync(300);
    expect(covered).toHaveBeenCalledTimes(1);
    expect(c.isGone()).toBe(true);
  });

  it('a hook that throws never keeps the card up', async () => {
    const c = make(() => {
      throw new Error('a stage that cannot park');
    });
    await vi.advanceTimersByTimeAsync(1900 + 400);
    expect(c.isGone()).toBe(true);
  });

  it('a card with no hook is the card it was', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const banner = new BattleStartBanner({ root, bossName: 'Bahamut', holdMs: 500 });
    let gone = false;
    void banner.show().then(() => void (gone = true));
    await vi.advanceTimersByTimeAsync(500 + 300);
    expect(gone).toBe(true);
  });
});

describe('coverOption and the wiring', () => {
  const src = (rel: string): string => readFileSync(join(__dirname, '..', '..', rel), 'utf8').replace(/\r\n/g, '\n');
  it('is the hook for an ordinary opening, nothing for a hurried one or `?opencover=off`', () => {
    const cover = (): void => undefined;
    expect(coverOption(false, cover, '')).toEqual({ covered: cover });
    expect(coverOption(true, cover, '')).toEqual({});
    expect(coverOption(false, cover, '?opencover=off')).toEqual({});
    expect(openingCovered('?demo=1')).toBe(true);
    expect(openingCovered('?opencover=off')).toBe(false);
  });

  it('BattleScreen.showBattleStart spreads coverOption(...) into the battle\'s own card and asks the presenter\'s moments to cover the opening for the party', () => {
    const battle = src('src/app/screens/BattleScreen.ts');
    const from = battle.indexOf('private async showBattleStart');
    const body = battle.slice(from, battle.indexOf('private async runEncounter'));
    const made = body.indexOf('new BattleStartBanner({');
    const closed = body.indexOf('});\n    this.battleStartBanner = banner', made);
    const spread = body.indexOf('...coverOption(!!this.opts.openingHurry,');
    expect(spread).toBeGreaterThan(made);
    expect(spread).toBeLessThan(closed);
    expect(body).toContain('this.presenter?.moments.coverOpening(state.activeIds)'); // the same ids the opening slides on (`BattlePresenter.openOn`)
    expect(body).toContain('if (!this.exited)'); // a screen torn down while the card is up does not touch the figures
  });
});
