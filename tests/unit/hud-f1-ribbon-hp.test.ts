// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AtbSnapshot, BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { HudF1, type HudF1Host } from '../../src/ui/hudf1/HudF1.ts';
import { setHudF1Mode } from '../../src/ui/hudf1/HudF1Switch.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

/**
 * The F1 boss ribbon's HP bar follows TODAY'S rule for each game (r63-play, hard rule 14, the faithful core; hud-f1's open point m4). The ribbon always keeps the boss's name.
 *
 *  - FFX only: an enemy has no HP bar until Sensor has read it (`SensorPanel.isScanned`, round 02 #28; a Sensor-immune enemy never is). So the first menu of Chapter I draws the name alone.
 *  - FFX-2 only: today's enemy strip (`ui/ffx2/BossGauges.ts`) draws every enemy's bar from the first frame and keeps only the numerals for Scan; the ribbon prints no numerals, so its bar is there from the first menu.
 *
 * The layer is tested with the host's rule given, then through the real HUD of each game.
 */
let root: HTMLElement;
let stage: HTMLElement;

const state = (hp: number): BattleState =>
  ({
    enemyIds: ['seymour'],
    combatants: { seymour: { id: 'seymour', name: 'Seymour Flux', side: 'enemy', hp, stats: { maxHp: 70000 }, removed: false, flags: {} } },
  }) as unknown as BattleState;

const host = (game: 'ffx' | 'ffx2', hpKnown?: (id: string) => boolean): HudF1Host => ({
  game, root, stage, cmdStack: () => null, cmdBlock: () => null, helpText: () => '', heroRow: () => null,
  ...(hpKnown ? { hpKnown } : {}),
});

const ribbon = (el: ParentNode): HTMLElement => el.querySelector<HTMLElement>('.f1-ribbon')!;
const blind = (el: ParentNode): boolean => ribbon(el).classList.contains('f1-ribbon--blind');

beforeEach(() => {
  document.body.innerHTML = '';
  root = document.createElement('div');
  stage = document.createElement('div');
  root.append(stage);
  document.body.append(root);
  setHudF1Mode('f1');
});
afterEach(() => {
  setHudF1Mode(null);
  setDemoChapter(undefined);
  document.body.innerHTML = '';
});

describe('the layer, with the host naming the rule', () => {
  it('FFX: the ribbon names the boss but hides its bar until the host says its HP is known, then shows it in place with the current value', () => {
    setDemoChapter('seymour-flux');
    const scanned = new Set<string>();
    const f1 = new HudF1('ffx');
    f1.mount(host('ffx', (id) => scanned.has(id)));
    f1.sync(state(70000));
    expect(ribbon(stage).querySelector('.f1-ribbon__name')!.textContent).toBe('Seymour Flux'); // the name is always there
    expect(blind(stage)).toBe(true); // the first menu: no bar
    f1.sync(state(60000)); // damage while unread: the numbers keep following, unseen
    expect(blind(stage)).toBe(true);
    expect(stage.querySelector<HTMLElement>('.f1-ribbon__fill')!.style.width).toBe(`${(60000 / 70000) * 100}%`);
    scanned.add('seymour'); // Sensor lands between two syncs
    f1.update(0.016);
    expect(blind(stage)).toBe(false);
    f1.sync(state(60000));
    expect(blind(stage)).toBe(false);
    f1.unmount();
  });

  it('FFX-2: a host that answers yes (today\'s strip draws every bar) never hides it, from the first frame', () => {
    setDemoChapter('ffx2-bahamut');
    const f1 = new HudF1('ffx2');
    f1.mount(host('ffx2', () => true));
    f1.sync(state(70000));
    expect(blind(stage)).toBe(false);
    f1.unmount();
  });

  it('a host that names no rule keeps the bar (the layer\'s behaviour before r63-play)', () => {
    setDemoChapter('seymour-flux');
    const f1 = new HudF1('ffx');
    f1.mount(host('ffx'));
    f1.sync(state(70000));
    expect(blind(stage)).toBe(false);
    f1.unmount();
  });

  it('no enemy on the field: the ribbon is hidden and nothing is blind', () => {
    setDemoChapter('seymour-flux');
    const f1 = new HudF1('ffx');
    f1.mount(host('ffx', () => false));
    f1.sync({ enemyIds: [], combatants: {} } as unknown as BattleState);
    expect(ribbon(stage).hasAttribute('hidden')).toBe(true);
    expect(blind(stage)).toBe(false);
    f1.unmount();
  });
});

describe('through the real HUD of each game', () => {
  it('FFX (Chapter I): the first menu shows the name and no bar; a Sensor event on the boss brings the bar; a Sensor on the other enemy does not', () => {
    setDemoChapter('seymour-flux');
    const el = document.createElement('div');
    document.body.append(el);
    const hud = new FFXBattleHud();
    hud.mount(el);
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    expect(ribbon(el).querySelector('.f1-ribbon__name')!.textContent).toBe('Seymour');
    expect(blind(el)).toBe(true);
    hud.onEvent({ seq: 1, type: 'sensor', actorId: 'yuna', targetId: 'mortiorchis' } as unknown as BattleEvent); // another enemy: the headline enemy is still unread
    hud.update(0.016);
    expect(blind(el)).toBe(true);
    hud.onEvent({ seq: 2, type: 'sensor', actorId: 'yuna', targetId: 'seymour-flux' } as unknown as BattleEvent);
    hud.update(0.016);
    expect(blind(el)).toBe(false);
    hud.unmount();
  });

  it('FFX-2 (Chapter IV): the bar is there from the first menu, with nothing scanned', () => {
    setDemoChapter('ffx2-bahamut');
    const el = document.createElement('div');
    document.body.append(el);
    const hud = new FFX2BattleHud();
    hud.mount(el);
    const snap: AtbSnapshot = { elapsedMs: 0, bars: [] };
    hud.sync(makeFakeBattleState(), snap);
    hud.update(0.016);
    expect(ribbon(el).hasAttribute('hidden')).toBe(false);
    expect(blind(el)).toBe(false);
    hud.unmount();
  });
});
