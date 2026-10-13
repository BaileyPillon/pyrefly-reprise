// @vitest-environment jsdom
/**
 * PR-0295 at phone width, option PREP-A "one long page" (Bailey, 2026-10-12, D-781; both games: the prep shell and its
 * eight tab panels are shared, the FFX and FFX-2 tabs differ). This file checks what jsdom can see of the panels: every
 * heavy tab draws a phone page beside its desktop markup, the page follows the roster cursor and keeps what the player
 * folded, the one control on these tabs (the Overdrive mode) works from the phone page, and the keys (L1 and R1 page,
 * Triangle folds all) act only on the phone-width scroller. The views' own numbers are `prep-phone-views.test.ts`; the
 * shell and the stylesheets are `prep-phone-shell.test.ts`; the real layout is checked in a browser at 390x844 and
 * 430x932 (docs/screenshots/r43-prepphone/).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InputSnapshot } from '../../src/app/Input.ts';
import { prepPanelsFor, type PrepPanel, type PrepPanelContext } from '../../src/app/screens/PartyPrepScreen.ts';
import type { FFXPartyBuild } from '../../src/battle/common/types.ts';
import { effectiveStats } from '../../src/battle/ffx/effectiveStats.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { appendPhoneHost, pagePhone, phoneKeys, phonePage, readOpen, setSectionOpen, toggleAllSections, wireFold } from '../../src/ui/common/prepPhoneFold.ts';
import { PHONE_PAGE_TABS, isPhonePageTab } from '../../src/ui/common/prepPhoneKit.ts';
import { makeEquipmentPanel, makeItemsPanel, makeOverdrivePanel, makeStatsPanel } from '../../src/ui/ffx/party-prep/panels.ts';
import { makeAccessoryPanel, makeDresspherePanel, makeItemsPanel as makeX2ItemsPanel } from '../../src/ui/ffx2/party-prep/panels.ts';
import { makeStatsPanel as makeX2StatsPanel } from '../../src/ui/ffx2/party-prep/StatsPanel.ts';
import '../../src/ui/ffx/party-prep/index.ts'; // registers every panel of both games, as main.ts does

const chapterOf = (id: string) => CHAPTERS.find((c) => c.id === id)!;
const text = (el: Element | null | undefined): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

/** `.prep` as the media query makes it on a phone (a scroller carrying `data-phone='page'`), around one panel's container. */
function mountPanel(panel: PrepPanel, chapterId: string, memberId: string) {
  const prep = document.createElement('div');
  prep.className = 'prep';
  prep.dataset['phone'] = 'page';
  prep.style.overflowY = 'auto';
  const root = document.createElement('div');
  root.className = 'prep__panel';
  prep.appendChild(root);
  document.body.appendChild(prep);
  panel.mount(root, { chapter: chapterOf(chapterId), memberId } as PrepPanelContext);
  const host = root.querySelector<HTMLElement>(':scope > .prph');
  return { prep, root, host: host! };
}

function keys(...pressed: string[]): InputSnapshot {
  const left = new Set(pressed);
  return {
    actions: [],
    justPressed: (b: string) => left.has(b),
    consume: (b: string) => left.delete(b),
    pressed: () => false,
    justReleased: () => false,
    axis: { x: 0, y: 0 },
    gamepadConnected: false,
    lastDevice: 'keyboard',
  } as unknown as InputSnapshot;
}

function stubScroll(el: HTMLElement, scrollHeight: number, clientHeight: number): void {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => clientHeight });
}

afterEach(() => {
  document.body.innerHTML = '';
});

const FFX_TABS: ReadonlyArray<[string, () => PrepPanel]> = [
  ['stats', makeStatsPanel],
  ['equipment', makeEquipmentPanel],
  ['items', makeItemsPanel],
  ['overdrive', makeOverdrivePanel],
];
const X2_TABS: ReadonlyArray<[string, () => PrepPanel]> = [
  ['dresspheres', makeDresspherePanel],
  ['stats', makeX2StatsPanel],
  ['accessories', makeAccessoryPanel],
  ['items', makeX2ItemsPanel],
];

describe('every heavy prep tab draws a phone page beside its desktop markup (both games)', () => {
  it.each(FFX_TABS)('FFX %s', (id, make) => {
    const panel = make();
    expect(panel.id).toBe(id);
    const { root, host } = mountPanel(panel, 'seymour-flux', 'tidus');
    expect(host).not.toBeNull();
    // Beside, never inside: the host is the container's last child, and the desktop markup is still there before it.
    expect(root.lastElementChild).toBe(host);
    expect(root.children.length).toBeGreaterThan(1);
    expect(host.querySelector('[data-fold], .prph-empty')).not.toBeNull();
    expect(root.querySelectorAll('.prph')).toHaveLength(1);
    panel.unmount?.();
  });

  it.each(X2_TABS)('FFX-2 %s', (id, make) => {
    const panel = make();
    expect(panel.id).toBe(id);
    const { root, host } = mountPanel(panel, 'ffx2-bahamut', 'yuna');
    expect(host).not.toBeNull();
    expect(root.lastElementChild).toBe(host);
    expect(root.children.length).toBeGreaterThan(1);
    expect(host.querySelector('[data-fold], .prph-empty')).not.toBeNull();
    panel.unmount?.();
  });

  it('is a contract: every registered tab of both games has a phone page, except the two that ship their own (a new tab cannot be left a shrunken board)', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      const chapter = chapterOf(game === 'ffx' ? 'seymour-flux' : 'ffx2-bahamut');
      const member = chapter.buildRef.members[0]!.id;
      const ids = prepPanelsFor(game).map((p) => p.id);
      expect(ids.length).toBeGreaterThanOrEqual(5);
      for (const panel of prepPanelsFor(game)) {
        const { root, host } = mountPanel(panel, chapter.id, member);
        const own = panel.id === 'chapter' || panel.id === 'sphere-grid';
        expect(isPhonePageTab(panel.id), `${game} ${panel.id}`).toBe(!own);
        expect(!!host, `${game} ${panel.id} draws a phone page`).toBe(!own);
        expect(root.querySelectorAll('.prph').length).toBe(own ? 0 : 1);
        panel.unmount?.();
        document.body.innerHTML = '';
      }
    }
    // The six ids cover the eight panels: `stats` and `items` are in both games.
    expect([...PHONE_PAGE_TABS].sort()).toEqual(['accessories', 'dresspheres', 'equipment', 'items', 'overdrive', 'stats']);
  });
});

describe('the phone page follows the roster cursor and keeps what the player folded', () => {
  it('FFX Stats: selectMember redraws the name and the numbers for the new member, and a section keeps its state', () => {
    const panel = makeStatsPanel();
    const { host } = mountPanel(panel, 'seymour-flux', 'tidus');
    const build = chapterOf('seymour-flux').buildRef as FFXPartyBuild;
    expect(text(host.querySelector('.prph-who em'))).toBe('Tidus');
    const defense = (): HTMLElement => host.querySelector('[data-fold="defense"]')!;
    expect(defense().classList.contains('is-open')).toBe(false);
    host.querySelector<HTMLElement>('[data-fold="defense"] [data-fold-head]')!.click();
    expect(defense().classList.contains('is-open')).toBe(true);
    expect(defense().querySelector('[data-fold-head]')!.getAttribute('aria-expanded')).toBe('true');

    const yuna = build.members.find((m) => m.id === 'yuna')!;
    panel.selectMember?.('yuna');
    expect(text(host.querySelector('.prph-who em'))).toBe('Yuna');
    expect(defense().classList.contains('is-open')).toBe(true);
    expect(text(defense().querySelector('.prph-dg'))).toBe(
      `DEF ${effectiveStats(yuna).byKey.def.effective} · MDEF ${effectiveStats(yuna).byKey.mdef.effective}`,
    );
    panel.unmount?.();
  });

  it('FFX-2 Stats: switching to another girl keeps an unfolded dressphere unfolded', () => {
    const panel = makeX2StatsPanel();
    const { host } = mountPanel(panel, 'ffx2-bahamut', 'yuna');
    const gunner = (): HTMLElement | null => host.querySelector('[data-fold="s:gunner"]');
    expect(gunner()).not.toBeNull();
    expect(gunner()!.classList.contains('is-open')).toBe(false);
    gunner()!.querySelector<HTMLElement>('[data-fold-head]')!.click();
    expect(gunner()!.classList.contains('is-open')).toBe(true);
    panel.selectMember?.('rikku');
    expect(text(host.querySelector('.prph-who em'))).toBe('Rikku');
    expect(gunner()!.classList.contains('is-open')).toBe(true);
    panel.unmount?.();
  });

  it('the notes under a page are the desktop sheet\'s own words, character for character', () => {
    const ffx = mountPanel(makeStatsPanel(), 'seymour-flux', 'tidus');
    expect(ffx.host.querySelector('.prph-note')!.textContent).toBe(ffx.root.querySelector('.ffxprep-stats__note')!.textContent);
    const x2s = mountPanel(makeX2StatsPanel(), 'ffx2-bahamut', 'yuna');
    expect(x2s.host.querySelector('.prph-note')!.textContent).toBe(x2s.root.querySelector('.x2prep-foot')!.textContent);
    const x2a = mountPanel(makeAccessoryPanel(), 'ffx2-bahamut', 'yuna');
    expect(x2a.host.querySelector('.prph-note')!.textContent).toBe(x2a.root.querySelector('.x2prep-foot')!.textContent);
  });

  it('a tap in a section body does not fold it; a tap on its header does, and so does a second tap', () => {
    const { host } = mountPanel(makeStatsPanel(), 'seymour-flux', 'tidus');
    const pool = host.querySelector<HTMLElement>('[data-fold="pool"]')!;
    expect(pool.classList.contains('is-open')).toBe(true);
    pool.querySelector<HTMLElement>('.prph-row')!.click();
    expect(pool.classList.contains('is-open')).toBe(true);
    pool.querySelector<HTMLElement>('[data-fold-head]')!.click();
    expect(pool.classList.contains('is-open')).toBe(false);
    pool.querySelector<HTMLElement>('.prph-k')!.click(); // the label inside the header is part of the header
    expect(pool.classList.contains('is-open')).toBe(true);
  });
});

describe('FFX Overdrive: the one control on these tabs works from the phone page', () => {
  it('a tap on a mode row equips that mode, and the desktop row and the phone row agree', () => {
    const build = chapterOf('seymour-flux').buildRef as FFXPartyBuild;
    const member = build.members.find((m) => m.overdrive.unlockedModes.length >= 2)!;
    const before = member.overdrive.mode;
    const other = member.overdrive.unlockedModes.find((m) => m !== before)!;
    try {
      const panel = makeOverdrivePanel();
      const { root, host } = mountPanel(panel, 'seymour-flux', member.id);
      expect(host.querySelector(`.prph-mode.is-sel`)!.getAttribute('data-mode')).toBe(before);
      host.querySelector<HTMLElement>(`.prph-mode[data-mode="${other}"]`)!.click();
      expect(member.overdrive.mode).toBe(other);
      expect(host.querySelector('.prph-mode.is-sel')!.getAttribute('data-mode')).toBe(other);
      expect(host.querySelectorAll('.prph-mode.is-sel')).toHaveLength(1);
      expect(root.querySelector('.ffxprep-mode-row--selected')!.getAttribute('data-mode')).toBe(other);
      // Tapping the equipped mode again leaves it equipped.
      host.querySelector<HTMLElement>(`.prph-mode[data-mode="${other}"]`)!.click();
      expect(member.overdrive.mode).toBe(other);
      panel.unmount?.();
    } finally {
      member.overdrive.mode = before;
    }
  });
});

describe('the fold helpers', () => {
  const sec = (key: string, open: boolean) =>
    `<section data-fold="${key}" class="${open ? 'is-open' : ''}"><div data-fold-head aria-expanded="${open}"></div></section>`;

  it('toggleAllSections opens every folded section, and folds them all once none is folded', () => {
    const host = document.createElement('div');
    host.innerHTML = sec('a', true) + sec('b', false) + sec('c', false);
    expect(toggleAllSections(host)).toBe(true);
    expect([...host.querySelectorAll('[data-fold]')].every((s) => s.classList.contains('is-open'))).toBe(true);
    expect(toggleAllSections(host)).toBe(false);
    expect([...host.querySelectorAll('[data-fold]')].some((s) => s.classList.contains('is-open'))).toBe(false);
    expect([...host.querySelectorAll('[data-fold-head]')].every((h) => h.getAttribute('aria-expanded') === 'false')).toBe(true);
    expect(toggleAllSections(document.createElement('div'))).toBe(false);
  });

  it('readOpen reads the state back from the DOM, so a redraw never keeps a second copy', () => {
    const host = document.createElement('div');
    host.innerHTML = sec('a', true) + sec('b', false);
    setSectionOpen(host.querySelector('[data-fold="b"]')!, true);
    expect([...readOpen(host)]).toEqual([['a', true], ['b', true]]);
  });

  it('appendPhoneHost wires the fold once: wiring the same host again does not make one tap fold a section twice', () => {
    const root = document.createElement('div');
    const host = appendPhoneHost(root);
    expect(root.lastElementChild).toBe(host);
    expect(host.className).toBe('prph');
    wireFold(host);
    wireFold(host);
    host.innerHTML = sec('a', true);
    host.querySelector<HTMLElement>('[data-fold-head]')!.click();
    expect(host.querySelector('[data-fold="a"]')!.classList.contains('is-open')).toBe(false);
  });
});

describe('the keys: L1 and R1 page the stacked page, Triangle folds or opens every section, and only on the phone-width scroller', () => {
  it('pages by what the pinned bar and the START BATTLE dock leave visible, clamps at both ends, and reports no move at the end', () => {
    const { prep } = mountPanel(makeStatsPanel(), 'seymour-flux', 'tidus');
    stubScroll(prep, 1138, 844);
    expect(phonePage(prep.querySelector('.prph'))).toBe(prep);
    expect(pagePhone(prep, 1)).toBe(true);
    expect(prep.scrollTop).toBe(294);
    expect(pagePhone(prep, 1)).toBe(false);
    expect(pagePhone(prep, -1)).toBe(true);
    expect(prep.scrollTop).toBe(0);
    expect(pagePhone(prep, -1)).toBe(false);
  });

  it('a panel hears R1, L1 and Triangle through handleInput, and never claims the frame', () => {
    const panel = makeStatsPanel();
    const { prep, host } = mountPanel(panel, 'seymour-flux', 'tidus');
    stubScroll(prep, 1138, 844);
    expect(panel.handleInput!(keys('r1'))).toBe(false);
    expect(prep.scrollTop).toBe(294);
    expect(panel.handleInput!(keys('l1'))).toBe(false);
    expect(prep.scrollTop).toBe(0);
    // Triangle: two sections are folded, so it opens every one; again, and it folds them all.
    expect(host.querySelectorAll('.is-open')).toHaveLength(2);
    panel.handleInput!(keys('triangle'));
    expect(host.querySelectorAll('.is-open')).toHaveLength(4);
    panel.handleInput!(keys('triangle'));
    expect(host.querySelectorAll('.is-open')).toHaveLength(0);
  });

  it('does nothing and consumes nothing on a desktop board, where `.prep` is not a scroller', () => {
    const panel = makeStatsPanel();
    const { prep, host } = mountPanel(panel, 'seymour-flux', 'tidus');
    prep.style.overflowY = 'hidden';
    stubScroll(prep, 1138, 844);
    const input = keys('r1', 'l1', 'triangle');
    const consume = vi.spyOn(input, 'consume');
    expect(phoneKeys(input, host)).toBe(false);
    expect(consume).not.toHaveBeenCalled();
    expect(prep.scrollTop).toBe(0);
    expect(host.querySelectorAll('.is-open')).toHaveLength(2);
    // And with no host at all (an unmounted panel).
    expect(phoneKeys(keys('r1'), null)).toBe(false);
  });
});
