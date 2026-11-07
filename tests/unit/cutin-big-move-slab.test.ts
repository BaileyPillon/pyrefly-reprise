// @vitest-environment jsdom
/**
 * The portrait slab of a BIG MOVE (2026-11-07, Bailey's "A: only on big moves"; both games; `engine/BigMoveCutIn.ts`): the same approved slab as the turn cut-in, with the move's name in the name's place and its
 * owner and kind where "YOUR TURN" was. The turn slab (no `move`) is unchanged, which `cutin-waapi.test.ts` and `ui-ffx-cutin-lift.test.ts` pin.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { playTurnCutIn } from '../../src/ui/common/transitions/TurnCutInLayer.ts';
import { showTurnCutIn } from '../../src/ui/inkgold/cutin.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

const texts = (el: HTMLElement): { ctb: string; name: string; ghost: string; nameSize: string } => ({
  ctb: el.querySelector('.ig-cutin__ctb')!.textContent ?? '',
  name: el.querySelector('.ig-cutin__name')!.textContent ?? '',
  ghost: el.querySelector('.ig-cutin__ghost')!.textContent ?? '',
  nameSize: el.querySelector<HTMLElement>('.ig-cutin__name')!.style.fontSize,
});

describe('showTurnCutIn: the turn slab and the big-move slab', () => {
  it("the turn slab says YOUR TURN and the actor's name, as it always did", () => {
    const root = document.createElement('div');
    document.body.append(root);
    const h = showTurnCutIn(root, { name: 'Tidus', portraitUrl: 'p.png', ctbLabel: 'CTB 1 OF 3' });
    expect(texts(h.el)).toEqual({ ctb: 'YOUR TURN · CTB 1 OF 3', name: 'Tidus', ghost: 'Tidus', nameSize: '' });
  });

  it("the big-move slab says whose move and what kind above the move's name; the ghost behind it stays the actor's name", () => {
    const root = document.createElement('div');
    document.body.append(root);
    const h = showTurnCutIn(root, { name: 'Tidus', portraitUrl: 'p.png', ctbLabel: 'TIDUS · OVERDRIVE', headline: 'TIDUS · OVERDRIVE', title: 'Swordplay' });
    const t = texts(h.el);
    expect(t.ctb).toBe('TIDUS · OVERDRIVE'); // no "YOUR TURN"
    expect(t.name).toBe('Swordplay');
    expect(t.ghost).toBe('Tidus');
    expect(t.nameSize).toBe('40.89px'); // a short name keeps the slab's own size
  });

  it("a long move's name is set smaller so it fits the slab on one line", () => {
    const root = document.createElement('div');
    document.body.append(root);
    const h = showTurnCutIn(root, { name: 'Yuna', portraitUrl: 'p.png', ctbLabel: '', headline: 'YUNA · OVERDRIVE', title: 'Grand Summon Of The Fayth' });
    expect(Number.parseFloat(texts(h.el).nameSize)).toBeLessThan(40.89);
    expect(Number.parseFloat(texts(h.el).nameSize)).toBeGreaterThanOrEqual(40.89 / 2);
  });
});

describe('playTurnCutIn: a big move reaches the slab, and a repeat is the lighter flash', () => {
  const host = (): HTMLElement => {
    const h = document.createElement('div');
    h.className = 'pf-mom';
    Object.defineProperty(h, 'clientWidth', { value: 1600 });
    Object.defineProperty(h, 'clientHeight', { value: 900 });
    document.body.append(h);
    return h;
  };

  it('mounts the slab with the move, then takes it away (the hold is the request\'s)', async () => {
    const h = host();
    const p = playTurnCutIn(h, { actorId: 'tidus', name: 'Tidus', game: 'ffx', label: 'TIDUS · OVERDRIVE', side: 'left', holdMs: 5, move: { title: 'Swordplay', tag: 'TIDUS · OVERDRIVE' } });
    const layer = h.querySelector<HTMLElement>('[data-role="turn-cut-in"]')!;
    expect(layer.dataset['actor']).toBe('tidus');
    expect(texts(layer).name).toBe('Swordplay');
    expect(texts(layer).ctb).toBe('TIDUS · OVERDRIVE');
    await p;
    expect(h.querySelector('[data-role="turn-cut-in"]')).toBeNull();
  });

  it('a quick repeat has the lighter veil that comes and goes faster; the full slam the usual one', async () => {
    const veilOf = async (quick: boolean): Promise<string> => {
      const h = host();
      const p = playTurnCutIn(h, { actorId: 'paine', name: 'Paine', game: 'ffx2', label: 'PAINE · SPECIAL', side: 'left', holdMs: 5, move: { title: 'Sword Dance', tag: 'PAINE · SPECIAL' }, quick });
      const css = h.querySelector<HTMLElement>('[data-role="turn-cut-in"] > div')!.style.cssText;
      await p;
      return css;
    };
    expect(await veilOf(false)).toContain('rgba(11, 10, 18, 0.55)');
    expect(await veilOf(false)).toContain('140ms');
    expect(await veilOf(true)).toContain('rgba(11, 10, 18, 0.4)');
    expect(await veilOf(true)).toContain('70ms');
  });

  it('the turn slab (no move) is the usual one', async () => {
    const h = host();
    const p = playTurnCutIn(h, { actorId: 'yuna', name: 'Yuna', game: 'ffx', label: 'CTB 2 OF 3', side: 'left', holdMs: 5 });
    expect(texts(h.querySelector<HTMLElement>('[data-role="turn-cut-in"]')!).ctb).toBe('YOUR TURN · CTB 2 OF 3');
    await p;
  });
});
