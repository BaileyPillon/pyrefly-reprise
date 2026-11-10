// @vitest-environment jsdom
/**
 * Test 21, the pause half, of the FFX-2 Special look (step D2; game case: FFX-2 only in what is seen: the three Special dresspheres exist only in FFX-2; `plateMemberFor` and the tab
 * strip are shared pause plumbing, inert while the switch is OFF because no combatant has a form record then).
 *
 * D-32: the surfaces name the three plates (the girl, then the two parts by their own names) and nothing else; a part is never given a girl's plate, tab portrait or count; a girl who is
 * away is never named or counted. On the pause screen that means: three member tabs labelled `Yuna`, `Right Pistil`, `Left Pistil` (and the other two Specials' names), none for an away
 * girl; each part's tab shows its MAIN's plate (`yuna-ffx2`, `rikku-ffx2`, `paine`) with its own meters; and no request for a plate or portrait file whose name holds a part id, with a
 * manifest that lists the plates and with none. The REAL engine puts each girl in her Special (`formUp`); the REAL `PauseView` renders each tab.
 *
 * Removal check: without `plateMemberFor` in `PauseView.renderPlate` the part tab asks for `art/pause/floral-fallal-right-pistil.png` and the cases that read the requests fail.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { PauseView, type PauseViewDeps } from '../../src/app/screens/pause/PauseView.ts';
import { PortraitStage } from '../../src/app/screens/pause/PortraitStage.ts';
import { chromeSideForCombatant, plateIdFor, plateMemberFor } from '../../src/app/screens/pause/plates.ts';
import { FIXED_TAB_IDS, buildTabs } from '../../src/app/screens/pause/tabs.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { setArtManifest, type ArtManifest } from '../../src/engine/ArtManifest.ts';
import { awayGirlIds } from '../../src/engine/SpecialFormMembers.ts';
import { bahamutGroup, chapterIV, FORM_GIRLS, formUp } from './helpers/specialFormState.ts';
import { openSpecial } from './helpers/specialDrive.ts';
import { awayOf, PLATE_NAMES } from './helpers/specialSurfaces.ts';

const MAIN_PLATE = { yuna: 'yuna-ffx2', rikku: 'rikku-ffx2', paine: 'paine' } as const;
const PLATES: ArtManifest = { version: 1, generatedAt: 'test', subjects: {}, portraits: Object.values(MAIN_PLATE), backdrops: [], pause: Object.values(MAIN_PLATE), pause2x: [], title: [], title2x: [] };

beforeEach(() => {
  document.body.innerHTML = '';
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1600 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setArtManifest(null);
  document.body.innerHTML = '';
});

describe('the tab strip names the three plates', () => {
  for (const { girl, parts } of FORM_GIRLS) {
    it(`${girl}: three member tabs named by the plates, in the order main, right part, left part, then the fixed tabs; none for an away girl`, () => {
      const s = formUp(girl).state as BattleState;
      const tabs = buildTabs(s);
      expect(tabs.filter((t) => t.memberId).map((t) => t.label)).toEqual(PLATE_NAMES[girl]);
      expect(tabs.filter((t) => t.memberId).map((t) => t.memberId)).toEqual([girl, ...parts]);
      expect(tabs.slice(3).map((t) => t.id)).toEqual([...FIXED_TAB_IDS]);
      for (const away of awayOf(girl)) expect(tabs.map((t) => t.memberId), away).not.toContain(away);
      expect(tabs.slice(0, 3).every((t) => t.hp === 1)).toBe(true); // each part's tab reads its own meters
    });

    it(`${girl}: a part rides its main's plate (${MAIN_PLATE[girl]}); the main, an away girl, a foe and no battle are unchanged`, () => {
      const s = formUp(girl).state as BattleState;
      for (const part of parts) {
        expect(plateMemberFor(part, s), part).toBe(girl);
        expect(plateIdFor(plateMemberFor(part, s)!, 'ffx2'), part).toBe(MAIN_PLATE[girl]);
        expect(chromeSideForCombatant(plateMemberFor(part, s)!, 'ffx2')).toBe(chromeSideForCombatant(girl, 'ffx2'));
      }
      expect(plateMemberFor(girl, s)).toBe(girl);
      for (const id of [...awayGirlIds(s), 'bahamut', 'nobody-here']) expect(plateMemberFor(id, s), id).toBe(id);
      expect(plateMemberFor(null, s)).toBeNull();
      expect(plateMemberFor(parts[0], null)).toBe(parts[0]);
    });
  }

  it('OFF: the identity for every member of the real Chapter IV engine, and the three girls are the tabs', () => {
    const s = openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, specials: false }).state() as BattleState;
    for (const id of s.activeIds) expect(plateMemberFor(id, s), id).toBe(id);
    expect(buildTabs(s).filter((t) => t.memberId).map((t) => t.label)).toEqual(['Yuna', 'Rikku', 'Paine']);
  });
});

/** Every request a render makes: the arguments of `PortraitStage.show`, the `src` and `srcset` of every `<img>`, and every `fetch`. */
async function requestsOf(state: BattleState, tabs: readonly string[], manifest: ArtManifest | null): Promise<{ text: string; plates: Array<string | null>; mirrored: boolean[]; view: PauseView }> {
  setArtManifest(manifest);
  const fetched: string[] = [];
  vi.stubGlobal('fetch', async (url: unknown) => {
    fetched.push(String(url));
    return { ok: false, status: 404, json: async () => ({}), text: async () => '' } as unknown as Response;
  });
  const shown: unknown[][] = [];
  const show = PortraitStage.prototype.show;
  vi.spyOn(PortraitStage.prototype, 'show').mockImplementation(function (this: PortraitStage, ...args: Parameters<PortraitStage['show']>) {
    shown.push([...args]);
    return show.apply(this, args);
  });
  const root = document.createElement('div');
  document.body.appendChild(root);
  const deps: PauseViewDeps = {
    chapter: getChapter('ffx2-bahamut')!, meta: undefined, save: new SaveStore('d2-pause-surfaces', null), state: () => state, context: () => ({}) as never, turnOrder: () => null,
    canRestart: false, canChapterSelect: false, canQuit: false, extraRows: [],
  };
  const view = new PauseView(root, deps);
  const plates: Array<string | null> = [];
  const mirrored: boolean[] = [];
  for (const tabId of tabs) {
    view.render({ tabId, focus: 'tabs', rowId: null });
    plates.push(view.portrait.plateId);
    mirrored.push(view.mirrored);
  }
  for (let i = 0; i < 6; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  const imgs = [...document.querySelectorAll<HTMLImageElement>('img')].map((i) => [i.dataset['plate'], i.getAttribute('src'), i.getAttribute('srcset')]);
  return { text: JSON.stringify({ shown, imgs, fetched }), plates, mirrored, view };
}

describe('the pause screen asks for the main\'s plate on a part\'s tab', () => {
  for (const { girl, parts } of FORM_GIRLS) {
    for (const [name, manifest] of [['a manifest that lists the plates', PLATES], ['no manifest', null]] as const) {
      it(`${girl}, ${name}: each tab, started on it, shows ${MAIN_PLATE[girl]} and no request holds a part id`, async () => {
        const s = formUp(girl).state as BattleState;
        for (const start of [girl, ...parts]) {
          document.body.innerHTML = '';
          const out = await requestsOf(s, [`member:${start}`], manifest);
          for (const part of parts) expect(out.text, `${start}: ${part}`).not.toContain(part);
          expect(out.plates, start).toEqual([MAIN_PLATE[girl]]);
          expect(out.text, start).toContain(MAIN_PLATE[girl]);
          out.view.dispose();
          vi.restoreAllMocks();
        }
      });

      it(`${girl}, ${name}: cycling the three tabs keeps the main's plate, and the chrome side is the main's on every tab`, async () => {
        const s = formUp(girl).state as BattleState;
        const out = await requestsOf(s, [girl, ...parts].map((id) => `member:${id}`), manifest);
        expect(out.plates).toEqual([MAIN_PLATE[girl], MAIN_PLATE[girl], MAIN_PLATE[girl]]);
        expect(new Set(out.mirrored).size).toBe(1);
        expect(out.mirrored[0]).toBe(chromeSideForCombatant(girl, 'ffx2') === 'right');
        for (const part of parts) expect(out.text).not.toContain(part);
        out.view.dispose();
      });
    }

    it(`${girl}: a part's tab body is its own member's meters (its own HP pool), not the main's`, async () => {
      const s = formUp(girl).state as BattleState;
      const out = await requestsOf(s, [`member:${parts[0]}`], null);
      const body = document.querySelector('[data-role="body"]')!.textContent ?? '';
      const own = s.combatants[parts[0]]!;
      const main = s.combatants[girl]!;
      expect(body).toContain('HP' + own.hp + '/' + own.stats.maxHp);
      expect(own.stats.maxHp, 'the part and the main differ, so this reads the part').not.toBe(main.stats.maxHp);
      expect(body).not.toContain('HP' + main.hp + '/' + main.stats.maxHp);
      out.view.dispose();
    });
  }
});
