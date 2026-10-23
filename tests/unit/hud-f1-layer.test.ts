// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { F1_CMD_OPEN, F1_INTEL, HUD_F1_CLASS, HudF1, type HudF1Host } from '../../src/ui/hudf1/HudF1.ts';
import { setHudF1Mode } from '../../src/ui/hudf1/HudF1Switch.ts';

/**
 * The F1 HUD's layer (lane "hud-f1", `ui/hudf1/HudF1.ts`): off it adds nothing; on it draws the boss ribbon from the headline enemy, the hero over the open menu (the menu's own actor, not the party list's
 * "acting" row), the one cue from the advisor card, the prompt bar, and the Intel class from the guide; the selected verb prints its help on its own row.
 */
let root: HTMLElement;
let stage: HTMLElement;
let stack: HTMLElement;
let help = '';

const state = (hp: number, maxHp = 70000, name = 'Seymour Flux'): BattleState =>
  ({
    enemyIds: ['seymour'],
    combatants: { seymour: { id: 'seymour', name, side: 'enemy', hp, stats: { maxHp }, removed: false, flags: {} } },
  }) as unknown as BattleState;

const host = (game: 'ffx' | 'ffx2'): HudF1Host => ({
  game, root, stage, cmdStack: () => stack, cmdBlock: () => stack.parentElement, helpText: () => help,
  heroRow: (id) => stage.querySelector<HTMLElement>(id ? `.ig-stat[data-actor="${id}"]` : '.ig-stat--acting'),
});

beforeEach(() => {
  document.body.innerHTML = '';
  root = document.createElement('div');
  stage = document.createElement('div');
  root.append(stage);
  document.body.append(root);
  stack = document.createElement('div');
  stack.className = 'ig-cmd-stack';
  stack.hidden = true;
  stack.innerHTML = '<div class="ig-cmd ig-cmd--selected"><span class="ffx-cmd__label">Attack</span></div><div class="ig-cmd"><span class="ffx-cmd__label">White Magic</span></div>';
  stage.append(stack);
  stage.insertAdjacentHTML('beforeend', `
    <div class="ig-stat ig-stat--acting" data-actor="tidus"><span class="ig-stat__face"><img alt=""></span><span class="ig-stat__name">Tidus</span></div>
    <div class="ig-stat" data-actor="yuna"><span class="ig-stat__face"><img alt=""></span><span class="ig-stat__name">Yuna</span></div>
    <div class="mad"><div class="mad__card"><p class="mad__line"><span class="mad__actor">Yuna</span><span class="mad__label">Hastega</span><span class="mad__arrow">→</span><span class="mad__target">the party</span><span class="mad__where">White Magic</span></p><p class="mad__stats"><span class="mad__stat">in White Magic</span><span class="mad__stat">30 MP</span></p></div></div>
    <div class="sgd sgd--off"></div>`);
  setDemoChapter('seymour-flux');
  setHudF1Mode('f1');
  help = 'Physical damage';
});
afterEach(() => {
  setHudF1Mode(null);
  setDemoChapter(undefined);
});

describe('off: a HUD that is not in a demo chapter gets nothing', () => {
  it('adds no class and shows no layer', () => {
    setDemoChapter('braska-final-aeon');
    const f1 = new HudF1('ffx');
    f1.mount(host('ffx'));
    f1.sync(state(70000));
    f1.update(0.016);
    expect(f1.on).toBe(false);
    expect(root.classList.contains(HUD_F1_CLASS)).toBe(false);
    expect(stage.querySelector<HTMLElement>('.f1-layer')!.hidden).toBe(true);
  });
  it('and the switch in "today" mode too', () => {
    setHudF1Mode('today');
    const f1 = new HudF1('ffx');
    f1.mount(host('ffx'));
    expect(root.classList.contains(HUD_F1_CLASS)).toBe(false);
  });
});

describe('on', () => {
  it('puts the class on the root and unmount takes it off', () => {
    const f1 = new HudF1('ffx');
    f1.mount(host('ffx'));
    expect(root.classList.contains(HUD_F1_CLASS)).toBe(true);
    expect(root.style.getPropertyValue('--f1-floor')).toBe('7px');
    f1.unmount();
    expect(root.classList.contains(HUD_F1_CLASS)).toBe(false);
    expect(stage.querySelector('.f1-layer')).toBeNull();
  });

  it('the ribbon names the headline enemy and its bar follows the HP; a hit leaves the white bite behind', () => {
    const f1 = new HudF1('ffx');
    f1.mount(host('ffx'));
    f1.sync(state(70000));
    expect(stage.querySelector('.f1-ribbon__name')!.textContent).toBe('Seymour Flux');
    expect(stage.querySelector<HTMLElement>('.f1-ribbon__fill')!.style.width).toBe('100%');
    const fill = stage.querySelector<HTMLElement>('.f1-ribbon__fill')!;
    const drain = stage.querySelector<HTMLElement>('.f1-ribbon__drain')!;
    expect(fill.style.width).toBe('100%');
    f1.sync(state(69268)); // Tidus's 732
    expect(Number.parseFloat(fill.style.width)).toBeCloseTo(98.954, 2);
    // the drain eases to the new value (its CSS transition); a heal does not leave a bite
    f1.sync(state(70000));
    expect(fill.style.width).toBe('100%');
    expect(drain.style.width).toBe('100%');
  });

  it('the ribbon hides when no enemy is on the field', () => {
    const f1 = new HudF1('ffx');
    f1.mount(host('ffx'));
    f1.sync({ enemyIds: [], combatants: {} } as unknown as BattleState);
    expect(stage.querySelector<HTMLElement>('.f1-ribbon')!.hasAttribute('hidden')).toBe(true);
  });

  it('with a menu open: the command block shows, the hero is the menu\'s actor, the cue is the advisor\'s lead move, the help is on the selected verb, the verb that holds the move has the star', () => {
    const f1 = new HudF1('ffx');
    f1.mount(host('ffx'));
    f1.setMenuActor('yuna'); // a Switch can change the actor under the menu: the party list still marks Tidus as acting
    stack.hidden = false;
    f1.update(0.016);
    expect(root.classList.contains(F1_CMD_OPEN)).toBe(true);
    expect(stage.querySelector('.f1-hero__name')!.textContent).toBe('Yuna');
    expect(stage.querySelector('.f1-hero__tile')).not.toBeNull();
    expect(stage.querySelector('.f1-cue__spell')!.textContent).toBe('Hastega'); // the advisor names Yuna, the hero is Yuna: no prefix
    expect(stage.querySelector('.f1-cue__target')!.textContent).toBe('the party');
    expect(stage.querySelector('.f1-cue__mp')!.textContent).toBe('30 MP');
    expect(stack.querySelector<HTMLElement>('.ig-cmd--selected')!.dataset['help']).toBe('Physical damage');
    expect(stack.querySelectorAll('.ig-cmd')[1]!.classList.contains('f1-rec')).toBe(true);
    expect(stack.querySelectorAll('.ig-cmd')[0]!.classList.contains('f1-rec')).toBe(false);
  });

  it('names the advisor\'s hero when the move is another hero\'s', () => {
    const f1 = new HudF1('ffx');
    f1.mount(host('ffx'));
    f1.setMenuActor('tidus');
    stack.hidden = false;
    f1.update(0.016);
    expect(stage.querySelector('.f1-cue__spell')!.textContent).toBe('Yuna: Hastega');
  });

  it('a closed menu takes the block away; the cue hides with no advisor line', () => {
    const f1 = new HudF1('ffx');
    f1.mount(host('ffx'));
    stack.hidden = false;
    f1.update(0.016);
    stack.hidden = true;
    f1.update(0.016);
    expect(root.classList.contains(F1_CMD_OPEN)).toBe(false);
    stack.hidden = false;
    stage.querySelector('.mad')!.classList.add('mad--off');
    f1.update(0.3);
    expect(stage.querySelector('.f1-cue')!.classList.contains('f1-cue--none')).toBe(true);
  });

  it('a switch flipped off and on again brings the block of the open menu back at once', () => {
    const f1 = new HudF1('ffx');
    f1.mount(host('ffx'));
    f1.setMenuActor('yuna');
    stack.hidden = false;
    f1.update(0.016);
    expect(root.classList.contains(F1_CMD_OPEN)).toBe(true);
    setHudF1Mode('today');
    expect(root.classList.contains(F1_CMD_OPEN)).toBe(false);
    expect(root.classList.contains(HUD_F1_CLASS)).toBe(false);
    setHudF1Mode('f1');
    f1.update(0.016);
    expect(root.classList.contains(HUD_F1_CLASS)).toBe(true);
    expect(root.classList.contains(F1_CMD_OPEN)).toBe(true);
    expect(stage.querySelector('.f1-hero__name')!.textContent).toBe('Yuna');
  });

  it('Intel is the strategy guide being shown', () => {
    const f1 = new HudF1('ffx');
    f1.mount(host('ffx'));
    f1.update(0.016);
    expect(root.classList.contains(F1_INTEL)).toBe(false);
    stage.querySelector('.sgd')!.classList.remove('sgd--off');
    f1.update(0.016);
    expect(root.classList.contains(F1_INTEL)).toBe(true);
  });

  it('the prompt bar is the game\'s own key/pad chips: Chapter I names Defend, Chapter IV does not', () => {
    const a = new HudF1('ffx');
    a.mount(host('ffx'));
    expect(stage.querySelector('.f1-prompts')!.textContent).toMatch(/Select.*Intel.*Defend.*Pause/s);
    a.unmount();
    document.body.innerHTML = '';
    root = document.createElement('div');
    stage = document.createElement('div');
    root.append(stage);
    document.body.append(root);
    stack = document.createElement('div');
    stage.append(stack);
    setDemoChapter('ffx2-bahamut');
    const b = new HudF1('ffx2');
    b.mount(host('ffx2'));
    const text = stage.querySelector('.f1-prompts')!.textContent!;
    expect(text).toMatch(/Select.*Intel.*Pause/s);
    expect(text).not.toMatch(/Defend/);
  });
});
