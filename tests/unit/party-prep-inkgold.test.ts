// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { PartyPrepScreen } from '../../src/app/screens/PartyPrepScreen.ts';
import { partyRole } from '../../src/ui/common/party-roles.ts';
import { CHAPTERS, type Chapter } from '../../src/data/encounters.ts';

const CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../src/ui/common/party-prep.css'),
  'utf8',
);

/**
 * Mount the screen with no prep panel registered, which is the branch that
 * draws the shell's own Ink & Gold frame. (`src/ui/ffx/party-prep` registers a
 * full-screen FFX panel at import time and takes the frame over; this test file
 * never imports it, so both branches stay reachable.)
 */
function mount(chapter: Chapter): { screen: PartyPrepScreen; root: HTMLElement } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const screen = new PartyPrepScreen({ chapter });
  screen.root = root;
  // enter() only reaches App for the fade.
  screen.app = { fade: () => Promise.resolve() } as unknown as PartyPrepScreen['app'];
  screen.enter();
  return { screen, root };
}

const ffx = CHAPTERS.find((c) => c.game === 'ffx')!;
const ffx2 = CHAPTERS.find((c) => c.game === 'ffx2')!;

describe('party prep frame', () => {
  it('lists every member of the FFX build, not just the three who field', () => {
    const { root } = mount(ffx);
    const rows = root.querySelectorAll('.prep__member');
    expect(rows.length).toBe(ffx.buildRef.members.length);
    expect(rows.length).toBeGreaterThan(3);
  });

  it('cascades each roster row 10px (1440 grid) further right than the last', () => {
    const { root } = mount(ffx);
    const rows = [...root.querySelectorAll<HTMLElement>('.prep__member')];
    const indents = rows.map((r) => parseFloat(r.style.marginLeft));
    expect(indents[0]).toBe(0);
    for (let i = 1; i < indents.length; i += 1) {
      // The style attribute is written with toFixed(2), so steps alternate
      // 4.44 / 4.45 around the exact 10 / 2.25.
      expect(indents[i]! - indents[i - 1]!).toBeCloseTo(10 / 2.25, 1);
    }
  });

  it('fields exactly the build\'s three active slots along the bottom', () => {
    const { root } = mount(ffx);
    const slots = [...root.querySelectorAll('.prep__slot-name')].map((n) => n.textContent);
    const expected =
      ffx.buildRef.game === 'ffx'
        ? ffx.buildRef.activeSlots.map((id) => ffx.buildRef.members.find((m) => m.id === id)?.name)
        : [];
    expect(slots).toEqual(expected);
  });

  it('shows the selected member\'s ten FFX stats, and follows the cursor', () => {
    const { screen, root } = mount(ffx);
    const keys = () => [...root.querySelectorAll('.prep__stat-k')].map((k) => k.textContent);
    const values = () => [...root.querySelectorAll('.prep__stat-v')].map((v) => v.textContent);

    expect(keys()).toEqual([
      'HP',
      'MP',
      'STRENGTH',
      'DEFENSE',
      'MAGIC',
      'MAGIC DEF',
      'AGILITY',
      'LUCK',
      'EVASION',
      'ACCURACY',
    ]);

    const first = values();
    screen.trigger('prep:member-1');
    expect(root.querySelectorAll('.prep__member--sel').length).toBe(1);
    expect(values()).not.toEqual(first);
  });

  it('reports what an FFX-2 girl carries in, since she has no StatBlock', () => {
    const { root } = mount(ffx2);
    const keys = [...root.querySelectorAll('.prep__stat-k')].map((k) => k.textContent);
    expect(keys).toEqual(['LEVEL', 'DRESSPHERE', 'HP', 'MP', 'DRESSPHERES', 'ACCESSORIES']);
  });

  it('tags FFX slots from the archetype map and FFX-2 slots from the dressphere', () => {
    const ffxRoles = [...mount(ffx).root.querySelectorAll('.prep__slot-role')].map((r) => r.textContent);
    expect(ffxRoles).toContain(partyRole('tidus')!.toUpperCase());

    const ffx2Roles = [...mount(ffx2).root.querySelectorAll('.prep__slot-role')].map((r) => r.textContent);
    const spheres =
      ffx2.buildRef.game === 'ffx2'
        ? ffx2.buildRef.members.map((m) => m.currentDressphere.replace(/-/g, ' ').toUpperCase())
        : [];
    expect(ffx2Roles).toEqual(spheres);
  });

  it('marks an FFX-2 chapter for the pink accent and the mirrored slabs', () => {
    expect(mount(ffx2).root.querySelector('.prep')?.classList.contains('ig--ffx2')).toBe(true);
    expect(mount(ffx).root.querySelector('.prep')?.classList.contains('ig--ffx2')).toBe(false);
  });
});

describe('party-prep.css follows the approved mockup', () => {
  it('converts the 1440 grid onto the 640x360 stage (spec / 2.25)', () => {
    expect(CSS).toContain('width: 133.33px'); // roster row, 300
    expect(CSS).toContain('height: 27.56px'); // roster row, 62
    expect(CSS).toContain('width: 364.44px'); // stat sheet, 820
    expect(CSS).toContain('width: 177.78px'); // field slot, 400
    expect(CSS).toContain('height: 40.89px'); // field slot, 92
    expect(CSS).toContain('font-size: 13.33px'); // stat value, 30
  });

  it('takes every skew from the shared layer, so FFX-2 mirrors for free', () => {
    expect(CSS).toContain('skewX(var(--ig-skew, -12deg))');
    expect(CSS).toContain('skewX(var(--ig-skew-inverse, 12deg))');
    // The 8deg sheet needs its own pair; FFX-2 flips it as a co-class.
    expect(CSS).toMatch(/\.prep\.ig--ffx2 \{[^}]*--prep-sheet-skew: 8deg/);
  });

  // Decision 10 (no bare `.ig-*` in a consumer stylesheet) is enforced
  // repo-wide by tests/unit/inkgold-scoping.test.ts, not duplicated here.

  it('puts the roster accent edge on the leading side via --ig-edge, not an override', () => {
    expect(CSS).toContain('border-left-width: calc(2.67px * (1 - var(--ig-edge, 0)))');
    expect(CSS).toContain('border-right-width: calc(2.67px * var(--ig-edge, 0))');
  });
});

describe('party prep pointer input', () => {
  /** An input frame with nothing pressed and these `data-action` clicks. */
  const clicks = (...actions: string[]) =>
    ({ actions, justPressed: () => false, consume: () => false }) as unknown as Parameters<
      PartyPrepScreen['handleInput']
    >[0];

  it('moves the roster cursor when a row is clicked', () => {
    const { screen, root } = mount(ffx);
    screen.handleInput(clicks('prep:member-2'));
    const rows = [...root.querySelectorAll('.prep__member')];
    expect(rows[2]!.classList.contains('prep__member--sel')).toBe(true);
  });

  it('begins the battle when START BATTLE is clicked', async () => {
    const { screen } = mount(ffx);
    screen.handleInput(clicks('prep:begin'));
    await expect(screen.done).resolves.toBe(true);
  });

  it('carries the click target names on the frame itself', () => {
    const { root } = mount(ffx);
    expect(root.querySelector('.prep__start')?.getAttribute('data-action')).toBe('prep:begin');
    expect(root.querySelector('.prep__member')?.getAttribute('data-action')).toBe('prep:member-0');
  });
});

describe('party prep hint line', () => {
  const clicks = (...actions: string[]) =>
    ({ actions, justPressed: () => false, consume: () => false }) as unknown as Parameters<
      PartyPrepScreen['handleInput']
    >[0];

  it('goes back when "ESC BACK" is clicked', async () => {
    const { screen, root } = mount(ffx);
    expect(root.querySelector('[data-action="prep:back"]')?.textContent).toContain('BACK');
    screen.handleInput(clicks('prep:back'));
    await expect(screen.done).resolves.toBe(false);
  });
});
