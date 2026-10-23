// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HudF1Host } from '../../src/ui/hudf1/HudF1.ts';
import { F1_ACTING, GHOST_WAIT_MS, StepBack } from '../../src/ui/hudf1/HudF1StepBack.ts';
import { HUD_F1_TUNE } from '../../src/ui/hudf1/HudF1Switch.ts';

/**
 * The F1 HUD steps back in action (lane "hud-f1", decision 192): `f1-acting` goes on the HUD root at the action's start (after the target is confirmed), the command block's ghost slides out,
 * the HUD comes back `backAfterEndMs` (220) after the action's end and not before the damage number has gone; FFX-2 never steps back while a command menu is open (D-357, D-441);
 * a victory or a defeat takes everything back at once (the victory frame keeps the party plates and the turn strip up).
 */
let t = 0;
let root: HTMLElement;
let layer: HTMLElement;
let stack: HTMLElement;

const host = (game: 'ffx' | 'ffx2'): HudF1Host => ({
  game, root, stage: document.body, cmdStack: () => stack, cmdBlock: () => stack.parentElement, helpText: () => '', heroRow: () => null,
});
const make = (game: 'ffx' | 'ffx2'): StepBack => {
  const s = new StepBack(layer);
  s.attach(host(game));
  return s;
};
const advance = (s: StepBack, ms: number, menuOpen = false): void => {
  for (let i = 0; i < ms; i += 10) {
    t += 10;
    s.update(0.01, menuOpen);
  }
};

beforeEach(() => {
  t = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => t);
  document.body.innerHTML = '';
  root = document.createElement('div');
  layer = document.createElement('div');
  layer.innerHTML = '<div class="f1-hero">Tidus</div><div class="f1-cue">Hastega</div>';
  const area = document.createElement('div');
  stack = document.createElement('div');
  stack.className = 'ig-cmd-stack';
  stack.innerHTML = '<div class="ig-cmd">Attack</div><div class="ig-cmd">Special</div>';
  area.append(stack);
  document.body.append(root, area);
  root.append(layer);
});
afterEach(() => vi.restoreAllMocks());

describe('FFX: the block slides out at the action start and the HUD returns 220 ms after the end', () => {
  it('goes out at action-start, not before, and comes back 220 ms after action-end', () => {
    const s = make('ffx');
    advance(s, 300, true); // the menu is open: the snapshot is taken
    s.menuEdge(false); // the command is confirmed: the stack closes, a ghost stands where the block was
    stack.hidden = true;
    expect(layer.querySelector('.f1-ghost')).not.toBeNull();
    expect(root.classList.contains(F1_ACTING)).toBe(false); // the target is confirmed but the action has not started
    s.signal({ phase: 'action-start', actorId: 'tidus', targets: ['seymour'] });
    expect(root.classList.contains(F1_ACTING)).toBe(true);
    expect(layer.querySelector('.f1-ghost')!.classList.contains('f1-ghost--out')).toBe(true);
    advance(s, 800);
    expect(root.classList.contains(F1_ACTING)).toBe(true); // still out while the action plays
    s.signal({ phase: 'action-end', actorId: 'tidus' });
    advance(s, HUD_F1_TUNE.backAfterEndMs - 30);
    expect(root.classList.contains(F1_ACTING)).toBe(true);
    advance(s, 60);
    expect(root.classList.contains(F1_ACTING)).toBe(false);
  });

  it('does not come back before the damage number has gone, but never waits longer than the cap', () => {
    const s = make('ffx');
    s.signal({ phase: 'action-start', actorId: 'tidus', targets: ['seymour'] });
    const num = document.createElement('div');
    num.className = 'dnum';
    document.body.append(num);
    s.signal({ phase: 'action-end', actorId: 'tidus' });
    advance(s, 600);
    expect(root.classList.contains(F1_ACTING)).toBe(true); // 600 ms after the end: the number is still up
    num.remove();
    advance(s, 20);
    expect(root.classList.contains(F1_ACTING)).toBe(false);
    // and with a number that never goes (a stuck one), the cap lets the HUD back
    s.signal({ phase: 'action-start', actorId: 'tidus', targets: [] });
    document.body.append(num);
    s.signal({ phase: 'action-end', actorId: 'tidus' });
    advance(s, HUD_F1_TUNE.backMaxWaitMs + 100);
    expect(root.classList.contains(F1_ACTING)).toBe(false);
  });

  it('the signal and the event stream for the same action count once (and a second action keeps the HUD out)', () => {
    const s = make('ffx');
    s.observe({ type: 'action-start', actorId: 'seymour' } as never);
    s.signal({ phase: 'action-start', actorId: 'seymour', targets: ['tidus'] });
    s.observe({ type: 'action-end', actorId: 'seymour' } as never);
    s.signal({ phase: 'action-start', actorId: 'mortiorchis', targets: ['yuna'] }); // the next action begins inside the return window
    advance(s, 400);
    expect(root.classList.contains(F1_ACTING)).toBe(true);
    s.signal({ phase: 'action-end', actorId: 'mortiorchis' });
    advance(s, 300);
    expect(root.classList.contains(F1_ACTING)).toBe(false);
  });

  it('a ghost nobody slides fades by itself', () => {
    const s = make('ffx');
    advance(s, 300, true);
    s.menuEdge(false);
    advance(s, GHOST_WAIT_MS + 50);
    expect(layer.querySelector('.f1-ghost')!.classList.contains('f1-ghost--fade')).toBe(true);
    advance(s, 500);
    expect(layer.querySelector('.f1-ghost')).toBeNull();
  });

  it('a victory takes everything back at once', () => {
    const s = make('ffx');
    s.signal({ phase: 'action-start', actorId: 'tidus', targets: ['seymour'] });
    expect(root.classList.contains(F1_ACTING)).toBe(true);
    s.observe({ type: 'victory' } as never);
    expect(root.classList.contains(F1_ACTING)).toBe(false);
  });
});

describe('FFX-2 (Active ATB): the player is never slid away from while choosing', () => {
  it('an action that starts with a menu open steps nothing back', () => {
    const s = make('ffx2');
    advance(s, 50, true);
    s.signal({ phase: 'action-start', actorId: 'bahamut', targets: ['yuna'] });
    expect(root.classList.contains(F1_ACTING)).toBe(false);
  });
  it('a menu that opens during a step-back ends it at once', () => {
    const s = make('ffx2');
    advance(s, 50, false);
    s.signal({ phase: 'action-start', actorId: 'bahamut', targets: ['yuna'] });
    expect(root.classList.contains(F1_ACTING)).toBe(true);
    s.menuEdge(true);
    expect(root.classList.contains(F1_ACTING)).toBe(false);
  });
  it('with no menu the HUD steps back and returns like FFX\'s', () => {
    const s = make('ffx2');
    s.signal({ phase: 'action-start', actorId: 'rikku', targets: ['bahamut'] });
    expect(root.classList.contains(F1_ACTING)).toBe(true);
    s.signal({ phase: 'action-end', actorId: 'rikku' });
    advance(s, 300);
    expect(root.classList.contains(F1_ACTING)).toBe(false);
  });
});

describe('clear', () => {
  it('leaves nothing out and no ghost', () => {
    const s = make('ffx');
    advance(s, 300, true);
    s.menuEdge(false);
    s.signal({ phase: 'action-start', actorId: 'tidus', targets: [] });
    s.clear();
    expect(root.classList.contains(F1_ACTING)).toBe(false);
    expect(layer.querySelector('.f1-ghost')).toBeNull();
  });
});
