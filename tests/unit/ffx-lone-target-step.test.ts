// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { CommandMenu } from '../../src/ui/ffx/CommandMenu.ts';
import { ffxTargetMode } from '../../src/ui/ffx/loneTarget.ts';
import type { CursorSelection } from '../../src/ui/ffx/TargetCursor.ts';
import type { AnyCombatant, AvailableCommand, CombatantId, Command } from '../../src/battle/common/types.ts';

/**
 * PR-0170: in FFX, one valid target still opens the target step.
 *
 * Source: `research/observed-ffx-steam-2026-09-26.md` §2.1: with Spherimorph the
 * only enemy, Attack showed the red cursor over it and waited for a second
 * confirm. Our menu read one valid target as a finished aim (`mode: 'auto'`)
 * and fired at once, and the next Escape opened the pause (round 13).
 *
 * GAME-AWARE (rule 14): **FFX only.** The FFX-2 half is unsourced (plan §2.1:
 * Steam part 2), so the shared `resolveTargetMode` keeps `auto` and only the
 * FFX menu opens the step.
 */

const COMBATANTS = {
  tidus: { id: 'tidus', name: 'Tidus', side: 'party' },
  yuna: { id: 'yuna', name: 'Yuna', side: 'party' },
  auron: { id: 'auron', name: 'Auron', side: 'party' },
  isaaru: { id: 'isaaru', name: 'Isaaru', side: 'enemy' },
} as unknown as Record<CombatantId, AnyCombatant>;

const ATTACK: AvailableCommand = {
  command: { kind: 'attack', targets: [] },
  label: 'Attack',
  category: 'attack',
  mpCost: 0,
  enabled: true,
  validTargets: ['isaaru'],
  targeting: 'single-enemy',
};

const STEAL: AvailableCommand = {
  command: { kind: 'ability', id: 'steal', targets: [] },
  label: 'Steal',
  category: 'skill',
  mpCost: 0,
  enabled: true,
  validTargets: ['isaaru'],
  targeting: 'single-enemy',
};

function key(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
}

function open(commands: AvailableCommand[]) {
  const menu = new CommandMenu();
  menu.setProjector((id) => ({ x: id.length * 40, y: 300, w: 120, h: 260 }));
  document.body.append(menu.stackEl, menu.targetCursor.el);
  const seen: Array<CursorSelection | null> = [];
  let result: Command | null | undefined;
  const done = menu
    .open({
      actorId: 'tidus',
      commands,
      previewRank: () => [],
      combatants: COMBATANTS,
      setHelp: () => {},
      onSelection: (sel) => seen.push(sel),
    })
    .then((c) => {
      result = c as Command | null;
      return c;
    });
  return { menu, seen, done, result: () => result };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('ffxTargetMode', () => {
  it('turns a lone enemy into a one-candidate target step', () => {
    expect(ffxTargetMode(ATTACK)).toEqual({ mode: 'choose', candidates: ['isaaru'] });
  });

  it('keeps self, random and resolved commands as they were', () => {
    expect(ffxTargetMode({ ...ATTACK, targeting: 'self', validTargets: ['tidus'] }).mode).toBe('auto');
    expect(ffxTargetMode({ ...ATTACK, targeting: 'random-enemy' }).mode).toBe('auto');
    expect(ffxTargetMode({ ...ATTACK, command: { kind: 'attack', targets: ['isaaru'] } }).mode).toBe('none');
  });
});

describe('PR-0170 by real keys: Attack on a lone boss (Ch II, XII)', () => {
  it('Enter on Attack shows the bracket on the boss and does not fire', async () => {
    const h = open([ATTACK]);
    key('Enter');
    await Promise.resolve();
    expect(h.result()).toBeUndefined();
    expect(h.seen.at(-1)?.mode).toBe('single');
    expect(h.seen.at(-1)?.activeId).toBe('isaaru');
    key('Enter');
    await h.done;
    expect(h.result()).toEqual({ kind: 'attack', targets: ['isaaru'] });
  });

  it('Escape at the step returns to the command menu, not out of it', async () => {
    const h = open([ATTACK]);
    key('Enter');
    key('Escape');
    await Promise.resolve();
    expect(h.result()).toBeUndefined();
    expect(h.seen.at(-1)).toBeNull();
    // Back on the command stack: Enter opens the step again.
    key('Enter');
    expect(h.seen.at(-1)?.activeId).toBe('isaaru');
  });

  it("Ch VIII: a one-item Special group opens its target step (Rikku's Steal)", async () => {
    const h = open([ATTACK, STEAL]);
    key('ArrowDown');
    key('Enter');
    await Promise.resolve();
    expect(h.result()).toBeUndefined();
    expect(h.seen.at(-1)?.activeId).toBe('isaaru');
  });
});
