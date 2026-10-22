// @vitest-environment jsdom
/**
 * Release 61 (the conference demo build), TITLE: The Echo is the DEFAULT title screen and the Farplane painting (the Gullwings) is the
 * selectable one, from the OPTIONS row and from a T TITLE ART entry in the title's own hint row (Bailey, 2026-10-21 ~00:15 EDT, verbatim:
 * "you need to incorporate the new title screen picture as the default the echoes of spira concept art looking one but make the current one
 * selectable at the title menu itself also please."; pick "A key in the bottom row (Recommended)", decision 168a).
 *
 * Pinned here: what a save of every shape reads as (a new player, a save of release 39.5 to 60 that stored the old default without ever choosing,
 * a save that chose The Echo, a save that chose the Farplane painting after this release, hand-edited blobs); the T key, a click and a tap on the
 * entry, all through the real `Input` and the real `TitleScreen`; the cross-fade (a ghost of the leaving picture over the new one for about
 * 300 ms, gone after it, none under REDUCE MOTION); the pick saved in the setting the OPTIONS row writes, so the two stay one setting, and kept
 * across a reload; the entry's place and style in the hint row; and that T is not also BEHIND THE SCENES' key while that switch is on.
 *
 * Game case: BOTH games (the title is the front door to FFX and FFX-2 alike; nothing here is true of one and not the other).
 * Save-data class: touches `Settings` in `src/app/SaveData.ts` (an additive field, no version bump).
 */
import { afterEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { Input } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore, defaultSettings, migrate } from '../../src/app/SaveData.ts';
import { BTS_KEY, BTS_LIVE } from '../../src/app/changelog/behindTheScenes.ts';
import { DEFAULT_TITLE_ART, TITLE_ARTS, TITLE_ART_LABELS, stepTitleArt, titleArtPick } from '../../src/app/saveFrontend.ts';
import { optionRows } from '../../src/app/screens/PauseScreenPanels.ts';
import { adjustSetting } from '../../src/app/screens/pause/settings.ts';
import { TITLE_CROSSFADE_MS, TitleScreen } from '../../src/app/screens/TitleScreen.ts';
import { CHANGELOG_KEY, TITLE_ART_ACTION, TITLE_ART_KEY, infoEntriesHtml, titleArtEntryHtml } from '../../src/app/screens/frontend/titleInfoHtml.ts';
import { TITLE_PLACEHOLDERS } from '../../src/app/screens/frontend/titleReveal.ts';

const blob = (settings: Record<string, unknown>): string =>
  JSON.stringify({ version: 1, updatedAt: 1, chapters: {}, unlocked: [], settings, seenCoach: [], flags: {} });

class Slot {
  readonly items = new Map<string, string>();
  constructor(raw?: string) {
    if (raw !== undefined) this.items.set(SAVE_KEY, raw);
  }
  getItem(k: string): string | null {
    return this.items.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.items.set(k, v);
  }
  removeItem(k: string): void {
    this.items.delete(k);
  }
}
const stored = (slot: Slot): Record<string, unknown> => (JSON.parse(slot.items.get(SAVE_KEY)!) as { settings: Record<string, unknown> }).settings;

describe('what a save reads as: The Echo unless the player chose the Farplane painting', () => {
  const read = (settings: Record<string, unknown> | undefined): { art: string; picked: boolean } => {
    const s = migrate(settings === undefined ? {} : (JSON.parse(blob(settings)) as never)).settings;
    return { art: s.titleArt, picked: s.titleArtPicked };
  };

  it('the default is The Echo, first on the list, and nobody has picked yet', () => {
    expect(DEFAULT_TITLE_ART).toBe('echo');
    expect([...TITLE_ARTS]).toEqual(['echo', 'farplane']);
    expect(defaultSettings()).toMatchObject({ titleArt: 'echo', titleArtPicked: false });
    expect(read(undefined)).toEqual({ art: 'echo', picked: false }); // a new player
    expect(read({})).toEqual({ art: 'echo', picked: false });
  });

  it('a save of release 39.5 to 60 stored titleArt "farplane" for every player who ever saved, chosen or not: it never picked, so it gets The Echo', () => {
    expect(read({ titleArt: 'farplane' })).toEqual({ art: 'echo', picked: false });
    expect(read({ titleArt: 'farplane', masterVolume: 0.3 })).toEqual({ art: 'echo', picked: false });
  });

  it('a stored "echo" without the new field was a deliberate pick (the default was the Farplane painting then): kept, and now marked picked', () => {
    expect(read({ titleArt: 'echo' })).toEqual({ art: 'echo', picked: true });
  });

  it('a pick made in this release is kept: the Farplane painting too, and The Echo chosen back', () => {
    expect(read({ titleArt: 'farplane', titleArtPicked: true })).toEqual({ art: 'farplane', picked: true });
    expect(read({ titleArt: 'echo', titleArtPicked: true })).toEqual({ art: 'echo', picked: true });
  });

  it('an unpicked save is held at the default whatever the blob says, and an invalid art never reaches the title (CHK-024)', () => {
    expect(read({ titleArt: 'echo', titleArtPicked: false })).toEqual({ art: 'echo', picked: false });
    expect(read({ titleArt: 'farplane', titleArtPicked: false })).toEqual({ art: 'echo', picked: false });
    for (const bad of ['ECHO', 'Farplane', '', 7, null, true, {}, ['echo']]) {
      expect(read({ titleArt: bad, titleArtPicked: true }), JSON.stringify(bad)).toEqual({ art: 'echo', picked: false });
      expect(read({ titleArt: bad }), JSON.stringify(bad)).toEqual({ art: 'echo', picked: false });
    }
    for (const notBool of ['true', 1, null, {}]) expect(read({ titleArt: 'farplane', titleArtPicked: notBool }), JSON.stringify(notBool)).toEqual({ art: 'echo', picked: false });
  });

  it('leaves every other setting as it was, and does not bump the save version', () => {
    const m = migrate(JSON.parse(blob({ titleArt: 'farplane', masterVolume: 0.25, chapterSelectMusic: 'c', visualStyle: 'classic' })) as never);
    expect(m.settings).toMatchObject({ masterVolume: 0.25, chapterSelectMusic: 'c', visualStyle: 'classic' });
    expect(m.version).toBe(1);
  });

  it('a save, a reload and a second reload keep the answer (the first load writes the field, so the rule does not run twice on a pick)', () => {
    const slot = new Slot(blob({ titleArt: 'farplane' }));
    const a = new SaveStore(SAVE_KEY, slot);
    expect(a.settings).toMatchObject({ titleArt: 'echo', titleArtPicked: false });
    a.setSettings(titleArtPick('farplane')); // the player presses T
    expect(stored(slot)).toMatchObject({ titleArt: 'farplane', titleArtPicked: true });
    const b = new SaveStore(SAVE_KEY, slot);
    expect(b.settings).toMatchObject({ titleArt: 'farplane', titleArtPicked: true });
    const c = new SaveStore(SAVE_KEY, slot);
    expect(c.settings).toMatchObject({ titleArt: 'farplane', titleArtPicked: true });
  });

  it('stepTitleArt wraps and saves the pick; the OPTIONS row writes the same thing', () => {
    const slot = new Slot();
    const st = new SaveStore(SAVE_KEY, slot);
    expect(stepTitleArt(st)).toBe('farplane');
    expect(stored(slot)).toMatchObject({ titleArt: 'farplane', titleArtPicked: true });
    expect(stepTitleArt(st)).toBe('echo');
    expect(stepTitleArt(st, -1)).toBe('farplane');
    const row = new SaveStore(SAVE_KEY, new Slot());
    adjustSetting(row, 'titleArt', 1);
    expect({ titleArt: row.settings.titleArt, picked: row.settings.titleArtPicked }).toEqual({ titleArt: 'farplane', picked: true });
    expect(optionRows(row.settings).find((r) => r.id === 'presentation')?.value).toBe(`${TITLE_ART_LABELS.farplane} · B`);
  });
});

// ---------------------------------------------------------------- the real title screen

const detach: (() => void)[] = [];
afterEach(() => {
  while (detach.length) detach.pop()?.();
  document.body.innerHTML = '';
});

interface Shown {
  input: Input;
  screen: TitleScreen;
  root: HTMLElement;
  parent: HTMLElement;
  save: SaveStore;
  slot: Slot;
}

async function showTitle(settings: Record<string, unknown> = {}, slot: Slot = new Slot(blob({ reduceMotion: true, ...settings }))): Promise<Shown> {
  const uiRoot = document.body.appendChild(document.createElement('div'));
  const input = new Input({ pointerRoot: uiRoot, keyboardTarget: window });
  input.attach();
  detach.push(() => input.detach());
  const save = new SaveStore(SAVE_KEY, slot);
  const app = { uiRoot, input, save, fade: () => Promise.resolve() };
  const screen = new TitleScreen();
  screen.app = app as unknown as App;
  screen.root = uiRoot.appendChild(document.createElement('div'));
  await screen.enter();
  detach.push(() => screen.exit());
  return { input, screen, root: screen.root, parent: uiRoot, save, slot };
}

const press = (code: string, init: KeyboardEventInit = {}): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true, cancelable: true }));
};
const settle = (ms = 60): Promise<void> => new Promise((r) => setTimeout(r, ms));
const art = (s: Shown): unknown => s.screen.snapshot()['art'];
const isEcho = (root: HTMLElement): boolean => root.classList.contains('fe-title--echo');

describe('the title screen starts on The Echo, and T changes it', () => {
  it('a fresh profile (nothing stored) is The Echo: its class, one plane, its own placeholder, no HTML wordmark', async () => {
    const s = await showTitle({}, new Slot());
    expect(art(s)).toBe('echo');
    expect(isEcho(s.root)).toBe(true);
    expect(s.root.querySelectorAll('.fe-title__plane')).toHaveLength(1);
    expect(s.root.querySelector('.fe-title__plane img')?.getAttribute('src')).toContain('art/title/echo.png');
    expect(s.root.querySelectorAll('.fe-title__name')).toHaveLength(0);
    expect(s.root.style.getPropertyValue('--fe-title-ph')).toContain(TITLE_PLACEHOLDERS.echo);
  });

  it('a save of release 60 that holds the old default "farplane" (never chosen) starts on The Echo; one that picked it after this release starts on it', async () => {
    expect(art(await showTitle({ titleArt: 'farplane' }))).toBe('echo');
    const kept = await showTitle({ titleArt: 'farplane', titleArtPicked: true });
    expect(art(kept)).toBe('farplane');
    expect(isEcho(kept.root)).toBe(false);
    expect([...kept.root.querySelectorAll('.fe-title__name')].map((n) => n.textContent)).toEqual(['Echoes', 'of Spira']);
  });

  it('T switches to the Farplane painting at once (its class, its two planes, its wordmark, its placeholder), saves it as a pick, and T again returns', async () => {
    const s = await showTitle();
    press(TITLE_ART_KEY);
    expect(art(s), 'the next picture is mounted in the same tick').toBe('farplane');
    expect(isEcho(s.root)).toBe(false);
    expect(s.root.querySelectorAll('.fe-title__plane')).toHaveLength(2);
    expect(s.root.querySelector('.fe-title__plane img')?.getAttribute('src')).toContain('art/title/keyart.png');
    expect([...s.root.querySelectorAll('.fe-title__name')].map((n) => n.textContent)).toEqual(['Echoes', 'of Spira']);
    expect(s.root.style.getPropertyValue('--fe-title-ph')).toContain(TITLE_PLACEHOLDERS.farplane);
    expect(s.save.settings).toMatchObject({ titleArt: 'farplane', titleArtPicked: true });
    expect(stored(s.slot), 'written to the save before the fade ends').toMatchObject({ titleArt: 'farplane', titleArtPicked: true });
    await settle();
    press(TITLE_ART_KEY);
    expect(art(s)).toBe('echo');
    expect(isEcho(s.root)).toBe(true);
    expect(s.root.querySelectorAll('.fe-title__plane')).toHaveLength(1);
    expect(s.root.querySelectorAll('.fe-title__name')).toHaveLength(0);
    expect(stored(s.slot)).toMatchObject({ titleArt: 'echo', titleArtPicked: true });
  });

  it('the pick survives a reload: a second title on the same storage opens on the picture the first left', async () => {
    const first = await showTitle();
    press(TITLE_ART_KEY);
    await settle();
    first.screen.exit();
    document.body.innerHTML = '';
    const second = await showTitle({}, first.slot);
    expect(art(second)).toBe('farplane');
    press(TITLE_ART_KEY);
    await settle();
    const third = await showTitle({}, first.slot);
    expect(art(third)).toBe('echo');
  });

  it('the OPTIONS row and the T key are one setting: a pick in either is what the title shows next, and what the other reads', async () => {
    const slot = new Slot(blob({ reduceMotion: true }));
    const s = await showTitle({}, slot);
    // the row picks the Farplane painting; the next time the title is drawn it is up
    adjustSetting(s.save, 'titleArt', 1);
    s.screen.exit();
    document.body.innerHTML = '';
    const b = await showTitle({}, slot);
    expect(art(b)).toBe('farplane');
    // T picks The Echo; the row reads it
    press(TITLE_ART_KEY);
    await settle();
    expect(optionRows(b.save.settings).find((r) => r.id === 'presentation')?.value).toBe('THE ECHO · B');
    adjustSetting(b.save, 'titleArt', 1); // the row, from The Echo
    expect(b.save.settings.titleArt).toBe('farplane');
  });

  it('a held T cycles once, a modifier does nothing, and a second press while the cross-fade runs waits for it', async () => {
    const s = await showTitle({ reduceMotion: false });
    press(TITLE_ART_KEY, { repeat: true });
    expect(art(s), 'a repeat is not a press').toBe('echo');
    press(TITLE_ART_KEY, { ctrlKey: true });
    press(TITLE_ART_KEY, { altKey: true });
    press(TITLE_ART_KEY, { metaKey: true });
    expect(art(s)).toBe('echo');
    press(TITLE_ART_KEY);
    expect(art(s)).toBe('farplane');
    press(TITLE_ART_KEY); // inside the fade
    expect(art(s), 'the fade has not finished: the press waits').toBe('farplane');
    await settle(TITLE_CROSSFADE_MS + 200);
    press(TITLE_ART_KEY);
    expect(art(s)).toBe('echo');
  });

  it('a click or a tap on the entry cycles it (the action the entry carries), and never starts the game', async () => {
    const s = await showTitle();
    const entry = s.root.querySelector<HTMLElement>(`.fe-hint__entry[data-action="${TITLE_ART_ACTION}"]`)!;
    expect(entry).not.toBeNull();
    s.input.injectAction(TITLE_ART_ACTION); // what Input.onClick hands the screen for a click on [data-action="title:art"]
    s.input.update();
    s.screen.handleInput(s.input);
    s.input.endFrame();
    expect(art(s)).toBe('farplane');
    expect(s.screen.snapshot()['advancing']).toBe(false);
  });

  it('the click is resolved to the entry, not to the plate\'s confirm', async () => {
    const s = await showTitle();
    const entry = s.root.querySelector<HTMLElement>(`[data-action="${TITLE_ART_ACTION}"]`)!;
    expect(entry.closest('[data-action]')).toBe(entry);
    expect(entry.closest('.fe-hint')).not.toBeNull();
  });

  it('nothing happens while the changelog panel is open (it holds the keyboard) or once the title is leaving', async () => {
    const s = await showTitle();
    press(CHANGELOG_KEY);
    expect(s.input.keyboardClaimed).toBe(true);
    press(TITLE_ART_KEY);
    await settle();
    expect(art(s), 'T inside the panel is not a title-art press').toBe('echo');
    s.input.injectAction(TITLE_ART_ACTION);
    s.input.update();
    s.screen.handleInput(s.input);
    s.input.endFrame();
    expect(art(s)).toBe('echo');
    press('Escape');
    expect(s.input.keyboardClaimed).toBe(false);
    // leaving
    (s.screen as unknown as { advancing: boolean }).advancing = true;
    press(TITLE_ART_KEY);
    expect(art(s)).toBe('echo');
  });

  it('does not start the game, claim the keyboard or open a panel', async () => {
    const s = await showTitle();
    press(TITLE_ART_KEY);
    await settle();
    expect(s.screen.snapshot()['advancing']).toBe(false);
    expect(s.input.keyboardClaimed).toBe(false);
    expect((s.screen.snapshot()['info'] as { open: string | null }).open).toBeNull();
    expect(s.root.querySelector('.fe-info')).toBeNull();
  });
});

describe('the cross-fade', () => {
  it('lays the leaving picture over the new one as a ghost that fades out in about 300 ms, then removes it', async () => {
    expect(TITLE_CROSSFADE_MS).toBe(300);
    const s = await showTitle({ reduceMotion: false });
    const before = s.root.querySelector('.fe-title__plane img');
    press(TITLE_ART_KEY);
    await settle(5); // the new picture is mounted, its decode (none in jsdom) has settled, the ghost fade has begun
    const ghosts = s.parent.querySelectorAll<HTMLElement>('.fe-title__ghost');
    expect(ghosts, 'one ghost beside the root').toHaveLength(1);
    const ghost = ghosts[0]!;
    expect(ghost.parentElement).toBe(s.parent);
    expect(ghost.getAttribute('aria-hidden')).toBe('true');
    expect(ghost.style.pointerEvents).toBe('none');
    expect(ghost.classList.contains('screen'), 'not a second screen root: no `screen` class, no data-screen').toBe(false);
    expect(ghost.hasAttribute('data-screen')).toBe(false);
    expect(ghost.classList.contains('fe-title--echo'), 'it is the screen that is leaving: The Echo').toBe(true);
    expect(ghost.contains(before), 'the leaving picture\'s own node, not a copy re-requested').toBe(true);
    expect(ghost.style.transition).toContain(`${TITLE_CROSSFADE_MS}ms`);
    expect(ghost.style.opacity).toBe('0');
    // the new screen is in the root, under it
    expect(isEcho(s.root)).toBe(false);
    expect(s.root.querySelectorAll('.fe-title__plane')).toHaveLength(2);
    await settle(TITLE_CROSSFADE_MS + 120);
    expect(s.parent.querySelector('.fe-title__ghost'), 'gone after the fade').toBeNull();
  });

  it('is instant under REDUCE MOTION: no ghost at all', async () => {
    const s = await showTitle({ reduceMotion: true });
    press(TITLE_ART_KEY);
    await settle(5);
    expect(s.parent.querySelector('.fe-title__ghost')).toBeNull();
    expect(art(s)).toBe('farplane');
  });

  it('leaves no ghost behind when the title is left mid-fade', async () => {
    const s = await showTitle({ reduceMotion: false });
    press(TITLE_ART_KEY);
    await settle(5);
    expect(s.parent.querySelector('.fe-title__ghost')).not.toBeNull();
    s.screen.exit();
    expect(s.parent.querySelector('.fe-title__ghost')).toBeNull();
  });

  it('gives the new screen its own motes and parallax (the old ones are dropped, not left running)', async () => {
    const s = await showTitle({ reduceMotion: false });
    const oldMotes = s.root.querySelector('.fe-title__motes');
    press(TITLE_ART_KEY);
    const newMotes = s.root.querySelector('.fe-title__motes');
    expect(newMotes).not.toBeNull();
    expect(newMotes).not.toBe(oldMotes);
    expect((s.screen.snapshot()['motes'] as number) > 0).toBe(true);
    await settle(TITLE_CROSSFADE_MS + 120);
  });
});

describe('the entry in the hint row', () => {
  it('is "T Title Art" in the hint row\'s own style, after CHANGELOG, in the same markup shape (a hint-row entry, a button, its own action)', () => {
    const html = titleArtEntryHtml();
    // the key, and (release 61, decision 169) the pad's Y beside it, shown by html[data-input]: both halves in the one <b>
    expect(html.startsWith('<span class="fe-hint__entry" data-action="title:art" role="button" tabindex="0" data-has-pad><b><span class="kh-k">T</span><span class="kh-p"><kbd class="pg" data-pg="triangle"')).toBe(true);
    expect(html.endsWith('</b> Title Art</span>')).toBe(true);
    expect(infoEntriesHtml().indexOf('title:changelog')).toBeLessThan(infoEntriesHtml().indexOf('title:art'));
    const row = document.createElement('div');
    row.innerHTML = infoEntriesHtml();
    expect([...row.children].map((c) => c.className || c.getAttribute('data-action'))).toEqual(['fe-hint__sep', 'fe-hint__entry', 'fe-hint__entry']);
  });

  it('is on the real title in both pictures, last in the row (BEHIND THE SCENES would follow it, off)', async () => {
    for (const art of ['echo', 'farplane']) {
      const s = await showTitle({ titleArt: art, titleArtPicked: true });
      const entries = [...s.root.querySelectorAll('.fe-hint .fe-hint__entry')];
      expect(entries.map((e) => e.getAttribute('data-action')), art).toEqual(['title:changelog', 'title:art']);
      expect(entries[1]!.textContent?.replace(/\s+/g, ' ').trim()).toBe('T Title Art');
    }
  });

  it('the row has no gamepad hints, so the entry has none either (the pad keeps its place on the plate: confirm still begins)', async () => {
    const s = await showTitle();
    const row = s.root.querySelector('.fe-hint')!.textContent ?? '';
    expect(row).not.toMatch(/\b(?:A|B|X|Y|LB|RB|L1|R1)\s+(?:begin|confirm|cancel)/i);
  });
});

describe('T is not also BEHIND THE SCENES\' letter while that page is on', () => {
  it('fails here, on purpose, if the switch is turned on without moving one of the two keys', () => {
    expect(TITLE_ART_KEY).toBe('KeyT');
    expect(BTS_LIVE === false || BTS_KEY !== TITLE_ART_KEY, 'BTS_LIVE is on and BTS_KEY is the TITLE ART key: give one of them another letter').toBe(true);
  });
});
