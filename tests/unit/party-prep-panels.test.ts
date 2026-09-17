// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrepPanel, PrepPanelContext } from '../../src/app/screens/PartyPrepScreen.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';

/**
 * The prep-panel registry is module state, so every test loads a fresh copy of
 * the screen module; otherwise one test's registrations leak into the next.
 */
type ScreenModule = typeof import('../../src/app/screens/PartyPrepScreen.ts');
let mod: ScreenModule;

beforeEach(async () => {
  vi.resetModules();
  mod = await import('../../src/app/screens/PartyPrepScreen.ts');
});

const ffx = CHAPTERS.find((c) => c.game === 'ffx')!;

function mount(): { screen: InstanceType<ScreenModule['PartyPrepScreen']>; root: HTMLElement } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const screen = new mod.PartyPrepScreen({ chapter: ffx });
  screen.root = root;
  screen.app = { fade: () => Promise.resolve() } as unknown as typeof screen.app;
  screen.enter();
  return { screen, root };
}

/** A panel that writes a marker into whatever container it is given and records its calls. */
function panel(id: string, extra: Partial<PrepPanel> = {}): PrepPanel & { calls: string[]; ctx?: PrepPanelContext } {
  const p: PrepPanel & { calls: string[]; ctx?: PrepPanelContext } = {
    id,
    label: id,
    game: 'ffx',
    calls: [],
    mount(root, ctx) {
      p.calls.push('mount');
      p.ctx = ctx;
      const marker = document.createElement('div');
      marker.className = `marker-${id}`;
      marker.textContent = id;
      root.appendChild(marker);
    },
    selectMember(memberId) {
      p.calls.push(`select:${memberId}`);
    },
    ...extra,
  };
  return p;
}

describe('a single panel', () => {
  it('still takes the whole screen when it says nothing (the original rule)', () => {
    mod.registerPrepPanel(panel('party'));
    const { root } = mount();
    expect(root.querySelector('.prep')).toBeNull();
    expect(root.querySelector('.marker-party')).not.toBeNull();
  });

  it('composes into the Ink & Gold frame with fullScreen: false', () => {
    mod.registerPrepPanel(panel('party', { fullScreen: false }));
    const { root } = mount();
    // The shell's frame is drawn…
    expect(root.querySelector('.prep__roster')).not.toBeNull();
    expect(root.querySelector('.prep__start')).not.toBeNull();
    expect(root.querySelectorAll('.prep__slot')).toHaveLength(3);
    // …and the panel lives on the sheet, in place of the shell's own stats.
    const sheet = root.querySelector('.prep__sheet')!;
    expect(sheet.querySelector('.marker-party')).not.toBeNull();
    expect(sheet.querySelector('.prep__stat')).toBeNull();
  });

  it('is told which roster member is selected, at mount and on every move', () => {
    const p = panel('party', { fullScreen: false });
    mod.registerPrepPanel(p);
    const { screen } = mount();
    const members = ffx.buildRef.members;

    expect(p.ctx?.memberId).toBe(members[0]!.id);
    screen.trigger('prep:member-2');
    expect(p.calls).toContain(`select:${members[2]!.id}`);
  });
});

describe('one panel per tab', () => {
  it('lists every panel in the shell tab strip, in order', () => {
    mod.registerPrepPanel(panel('stats', { order: 0 }));
    mod.registerPrepPanel(panel('grid', { order: 1 }));
    const { root } = mount();
    const tabs = [...root.querySelectorAll('.prep__tab')].map((t) => t.textContent);
    expect(tabs).toEqual(['STATS', 'GRID']);
  });

  it('shows the right tab on a second visit instead of the last one drawn', () => {
    const stats = panel('stats', { order: 0 });
    const grid = panel('grid', { order: 1 });
    mod.registerPrepPanel(stats);
    mod.registerPrepPanel(grid);
    const { screen, root } = mount();

    const visible = (): string[] =>
      [...root.querySelectorAll<HTMLElement>('.prep__panel')].filter((el) => !el.hidden).map((el) => el.dataset['panel']!);

    expect(visible()).toEqual(['stats']);
    screen.trigger('prep:tab:grid');
    expect(visible()).toEqual(['grid']);
    screen.trigger('prep:tab:stats');
    expect(visible()).toEqual(['stats']);

    // Each panel was built once and never rebuilt.
    expect(stats.calls.filter((c) => c === 'mount')).toHaveLength(1);
    expect(grid.calls.filter((c) => c === 'mount')).toHaveLength(1);
  });

  it('keeps a hidden tab current, so switching to it shows the right member', () => {
    const stats = panel('stats', { order: 0 });
    const grid = panel('grid', { order: 1 });
    mod.registerPrepPanel(stats);
    mod.registerPrepPanel(grid);
    const { screen } = mount();
    screen.trigger('prep:tab:grid');
    screen.trigger('prep:tab:stats');

    screen.trigger('prep:member-1');
    const id = ffx.buildRef.members[1]!.id;
    expect(stats.calls).toContain(`select:${id}`);
    expect(grid.calls).toContain(`select:${id}`);
  });

  it('never reaches the shell\'s own stat sheet once any panel is registered', () => {
    mod.registerPrepPanel(panel('stats', { order: 0 }));
    mod.registerPrepPanel(panel('grid', { order: 1 }));
    const { screen, root } = mount();
    screen.trigger('prep:member-1');
    expect(root.querySelector('.prep__stat')).toBeNull();
  });

  it('goes full-screen if any one panel asks for it', () => {
    mod.registerPrepPanel(panel('stats', { order: 0 }));
    mod.registerPrepPanel(panel('menu', { order: 1, fullScreen: true }));
    const { root } = mount();
    expect(root.querySelector('.prep')).toBeNull();
  });
});
