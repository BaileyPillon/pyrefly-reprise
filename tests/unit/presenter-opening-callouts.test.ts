/**
 * PR-0061(a), the opening waits (both games): before the first command menu, a
 * callout made only of lines runs under the fight instead of holding it, and
 * a sensor read does not wait on its banner; a beat with a camera is still
 * held, and after the first menu every beat is held as before.
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { isLineOnly, OpeningCallouts } from '../../src/engine/OpeningCallouts.ts';
import type { BattleEvent, Decision } from '../../src/battle/common/types.ts';
import type { StoryScript } from '../../src/story/dsl.ts';
import { FakeEngine } from './helpers/FakeEngine.ts';
import { FakeHud, FakeStage, noSleep } from './helpers/FakeStage.ts';

const LINES: StoryScript = [
  { type: 'say', who: 'seymour', text: 'Let it in.', auto: 1000 } as never,
  { type: 'say', who: 'seymour', text: "It's quieter on the other side.", auto: 1300 } as never,
];
const CAMERA: StoryScript = [{ type: 'camera', rig: 'action', ms: 400 } as never, ...LINES];

/** A runner whose beats stay on screen until released. */
class HeldCutscenes {
  readonly started: string[] = [];
  private releases: Array<() => void> = [];
  async play(_s: StoryScript, opts?: { name?: string }): Promise<void> {
    this.started.push(opts?.name ?? '?');
    await new Promise<void>((r) => this.releases.push(r));
  }
  releaseAll(): void {
    for (const r of this.releases.splice(0)) r();
  }
  get open(): number {
    return this.releases.length;
  }
}

function setup(hud: FakeHud | null = null) {
  const stage = new FakeStage(['tidus', 'yuna', 'auron'], ['seymour-flux']);
  const cutscenes = new HeldCutscenes();
  const shown: string[] = [];
  let bannerDone: () => void = () => {};
  const messageBar = {
    show: (text: string) => {
      shown.push(text);
      return new Promise<void>((r) => (bannerDone = r));
    },
    clear: () => {},
  };
  const presenter = new BattlePresenter({
    stage,
    hud,
    cutscenes,
    messageBar,
    // Waits collapse, but the presenter's script budget (a long wait) never runs out,
    // so a held beat really holds until the runner releases it.
    sleep: (ms: number) => (ms >= 5000 ? new Promise<void>(() => {}) : noSleep()),
    midScripts: { lance: LINES, cam: CAMERA },
  });
  const seq = (events: Array<Record<string, unknown>>) => events.map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent);
  return { presenter, stage, cutscenes, shown, releaseBanner: () => bannerDone(), seq };
}

describe('which beats may run under the fight', () => {
  it('only a beat of lines', () => {
    expect(isLineOnly(LINES)).toBe(true);
    expect(isLineOnly(CAMERA)).toBe(false);
    expect(isLineOnly([])).toBe(false);
    expect(isLineOnly(undefined)).toBe(false);
  });

  it('only until the first menu', () => {
    const c = new OpeningCallouts();
    expect(c.detach(LINES, async () => {})).toBe(true);
    c.close();
    expect(c.detach(LINES, async () => {})).toBe(false);
  });
});

describe('the opening, through the presenter', () => {
  it('plays on under an opening callout of lines', async () => {
    const { presenter, stage, cutscenes, seq } = setup();
    await presenter.play(seq([
      { type: 'script-trigger', name: 'lance' },
      { type: 'damage', targetId: 'tidus', amount: 300, element: 'none', crit: false, hitIndex: 0, hitCount: 1 },
    ]));
    expect(cutscenes.open).toBe(1); // the callout is still up
    expect(stage.calls).toContain('recoil:tidus'); // and the hit after it played
    cutscenes.releaseAll();
  });

  it('still holds an opening beat with a camera cue', async () => {
    const { presenter, stage, cutscenes, seq } = setup();
    let done = false;
    const p = presenter.play(seq([
      { type: 'script-trigger', name: 'cam' },
      { type: 'damage', targetId: 'tidus', amount: 300, element: 'none', crit: false, hitIndex: 0, hitCount: 1 },
    ])).then(() => (done = true));
    for (let i = 0; i < 20; i++) await Promise.resolve();
    expect(done).toBe(false);
    expect(stage.calls).not.toContain('recoil:tidus');
    cutscenes.releaseAll();
    await p;
    expect(stage.calls).toContain('recoil:tidus');
  });

  it('never overlaps two beats, and the battle end waits for a callout on screen', async () => {
    const { presenter, cutscenes, seq } = setup();
    let done = false;
    const p = presenter.play(seq([
      { type: 'script-trigger', name: 'lance' },
      { type: 'victory', result: { outcome: 'victory' } },
    ])).then(() => (done = true));
    for (let i = 0; i < 20; i++) await Promise.resolve();
    expect(done).toBe(false);
    cutscenes.releaseAll();
    await p;
    expect(done).toBe(true);
  });

  it('does not wait on a sensor banner before the first menu', async () => {
    const { presenter, shown, seq, releaseBanner } = setup();
    await presenter.play(seq([{ type: 'sensor', targetId: 'seymour-flux', text: 'Seymour Flux: HP 70,000' }]));
    expect(shown).toEqual(['Seymour Flux: HP 70,000']);
    releaseBanner();
  });

  it('opens the first menu while the opening callout is still up, then holds beats again', async () => {
    const hud = new FakeHud();
    const { presenter, cutscenes } = setup(hud);
    let menuWithCallout = -1;
    class OpeningEngine extends FakeEngine {
      private first = true;
      override nextDecision(): Decision {
        if (this.first) {
          this.first = false;
          return { kind: 'resolved', events: [{ type: 'script-trigger', name: 'lance', seq: 0 } as unknown as BattleEvent] };
        }
        return super.nextDecision();
      }
    }
    presenter.setAutoPlay((_actorId, commands) => {
      if (menuWithCallout < 0) menuWithCallout = cutscenes.open;
      cutscenes.releaseAll();
      return commands.find((c) => c.command.kind === 'attack')?.command ?? null;
    });
    const outcome = await presenter.run(new OpeningEngine({ enemyHp: 1200 }));
    expect(menuWithCallout).toBe(1);
    expect(outcome.kind).toBe('victory');
  });
});
