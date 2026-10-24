// @vitest-environment jsdom
/**
 * Release 61 (the conference demo build), VISUAL STYLE: the OPTIONS row "VISUAL STYLE: HD-2D / CLASSIC" (Bailey, 2026-10-21 ~00:15 EDT, "Yes, an Options
 * toggle (Recommended)": OPTIONS gets VISUAL STYLE: HD-2D / Classic, the default HD-2D in the chapters that have it; decision 168b, review PR-0493).
 *
 *  - HD-2D (the default) is release 60's behaviour: the bold HD-2D look is on in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2), nowhere else.
 *  - CLASSIC is no look anywhere, as `?look=off`.
 *  - A `?look=` key in the address still wins over the setting (the look stays the address's word, `lookState.auto` is false).
 *  - The setting is a new field of `Settings` (`src/app/SaveData.ts`), added without a version bump: an older save reads HD-2D, an invalid value reads HD-2D, a choice survives
 *    a save and a reload, and nothing else in the save moves.
 *
 * Game case: BOTH games (shared plumbing): the one look is authored for one chapter of each game, and the row is on the FFX and the FFX-2 pause alike; the FF7 pause drops it.
 * Save-data class: touches `Settings` in `src/app/SaveData.ts` (an additive field).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setProMode } from '../../src/engine/look/pro/ProSwitch.ts';

import { SAVE_KEY, SAVE_VERSION, SaveStore, defaultSave, defaultSettings, migrate } from '../../src/app/SaveData.ts';
import {
  DEFAULT_VISUAL_STYLE,
  VISUAL_STYLES,
  VISUAL_STYLE_LABELS,
  flipVisualStyle,
  isVisualStyle,
  visualStyleOf,
} from '../../src/app/saveVisualStyle.ts';
import { optionRows } from '../../src/app/screens/PauseScreenPanels.ts';
import { optionsColumns } from '../../src/app/screens/pause/panels.ts';
import { activateRow } from '../../src/app/screens/pause/actions.ts';
import { adjustSetting } from '../../src/app/screens/pause/settings.ts';
import { parseLook } from '../../src/engine/look/LookConfig.ts';
import { applyChapterLook, lookState, lookWanted } from '../../src/engine/look/LookState.ts';

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
const blob = (settings: Record<string, unknown>): string => JSON.stringify({ version: 1, updatedAt: 1, chapters: {}, unlocked: [], settings, seenCoach: [], flags: {} });

function resetLook(): void {
  lookState.auto = true;
  lookState.armed = false;
  lookState.name = null;
  lookState.strength = 'subtle';
  lookState.version = 1;
}
afterEach(resetLook);
// r64 (item 200b): the pro look (the arena's Cinematic grade) is the page's default in Chapter I and IV now; these claims are the PLAYER'S visual-style setting (HD-2D, Classic), release 60's, which `?pack=off` / `?look=today` keep.
beforeEach(() => setProMode('today'));
afterEach(() => setProMode(null));

describe('the setting, as data', () => {
  it('has two values, HD-2D first and the default, with the words the row prints', () => {
    expect([...VISUAL_STYLES]).toEqual(['hd2d', 'classic']);
    expect(DEFAULT_VISUAL_STYLE).toBe('hd2d');
    expect(VISUAL_STYLE_LABELS).toEqual({ hd2d: 'HD-2D', classic: 'CLASSIC' });
  });

  it('reads anything that is not one of the two as HD-2D, and flips between them', () => {
    for (const bad of [undefined, null, '', 'HD-2D', 'Classic', 'off', 0, 1, true, {}, []]) {
      expect(isVisualStyle(bad), String(bad)).toBe(false);
      expect(visualStyleOf(bad), String(bad)).toBe('hd2d');
    }
    expect(visualStyleOf('classic')).toBe('classic');
    expect(flipVisualStyle('hd2d')).toBe('classic');
    expect(flipVisualStyle('classic')).toBe('hd2d');
    expect(flipVisualStyle('nonsense')).toBe('classic'); // an unreadable value is HD-2D, so the flip is CLASSIC
  });
});

describe('the save: an additive field, no version bump', () => {
  it('a new save holds HD-2D, and SAVE_VERSION is where it was', () => {
    expect(defaultSettings().visualStyle).toBe('hd2d');
    expect(defaultSave().settings.visualStyle).toBe('hd2d');
    expect(SAVE_VERSION).toBe(1);
  });

  it('an older save (no field) gains HD-2D and keeps everything it had', () => {
    const m = migrate(JSON.parse(blob({ masterVolume: 0.25, titleArt: 'echo', chapterSelectMusic: 'c', textSpeed: 1.5 })) as never);
    expect(m.settings).toMatchObject({ visualStyle: 'hd2d', masterVolume: 0.25, titleArt: 'echo', chapterSelectMusic: 'c', textSpeed: 1.5 });
    expect(m.version).toBe(1);
  });

  it('keeps a stored CLASSIC, and reads an invalid stored value as HD-2D without touching any other setting (CHK-024)', () => {
    expect(new SaveStore(SAVE_KEY, new Slot(blob({ visualStyle: 'classic' }))).settings.visualStyle).toBe('classic');
    for (const bad of ['Classic', 'cinematic', 7, null, true, {}, ['classic']]) {
      const s = new SaveStore(SAVE_KEY, new Slot(blob({ visualStyle: bad, masterVolume: 0.25 }))).settings;
      expect(s.visualStyle, JSON.stringify(bad)).toBe('hd2d');
      expect(s.masterVolume).toBe(0.25);
    }
    for (const junk of ['', '{', 'null', '[]']) expect(new SaveStore(SAVE_KEY, new Slot(junk)).settings.visualStyle).toBe('hd2d');
  });

  it('a choice survives a save and a reload, and is the only thing the write changes', () => {
    const slot = new Slot();
    const a = new SaveStore(SAVE_KEY, slot);
    const before = { ...a.settings };
    adjustSetting(a, 'visualStyle', 1);
    expect(a.settings.visualStyle).toBe('classic');
    const stored = (JSON.parse(slot.items.get(SAVE_KEY)!) as { settings: Record<string, unknown> }).settings;
    expect(stored['visualStyle']).toBe('classic');
    const after = { ...a.settings };
    delete (after as Record<string, unknown>)['visualStyle'];
    delete (before as Record<string, unknown>)['visualStyle'];
    expect(after).toEqual(before);
    expect(new SaveStore(SAVE_KEY, slot).settings.visualStyle).toBe('classic');
  });
});

describe('the OPTIONS row', () => {
  it('is VISUAL STYLE, under EYE CANDY, reading HD-2D by default and CLASSIC when set, in the FFX and the FFX-2 pause', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      const rows = optionRows(defaultSettings(), game);
      const ids = rows.map((r) => r.id);
      expect(ids[ids.indexOf('eyeCandy') + 1], game).toBe('visualStyle');
      expect(rows.find((r) => r.id === 'visualStyle'), game).toMatchObject({ label: 'VISUAL STYLE', value: 'HD-2D', ratio: null });
      expect(optionRows({ ...defaultSettings(), visualStyle: 'classic' }, game).find((r) => r.id === 'visualStyle')?.value).toBe('CLASSIC');
      const settings = optionsColumns({ settings: defaultSettings(), battleHelpOn: true, canRestart: true, canChapterSelect: true, canQuit: true, extraRows: [], game }).find((c) => c.id === 'settings')!;
      expect(settings.rows.find((r) => r.id === 'visualStyle'), game).toMatchObject({ label: 'VISUAL STYLE', value: 'HD-2D', selectable: true });
    }
  });

  it('prints the default for a stored value that is not on the list', () => {
    expect(optionRows({ ...defaultSettings(), visualStyle: 'nonsense' as never }).find((r) => r.id === 'visualStyle')?.value).toBe('HD-2D');
  });

  it('is dropped from the FF7 pause, which draws no look (as EYE CANDY is)', () => {
    const ids = optionsColumns({ settings: defaultSettings(), battleHelpOn: true, canRestart: true, canChapterSelect: true, canQuit: true, extraRows: [], game: 'ff7' })
      .find((c) => c.id === 'settings')!
      .rows.map((r) => r.id);
    expect(ids).not.toContain('visualStyle');
    expect(ids).not.toContain('eyeCandy');
  });

  it('flips on Left, Right, Confirm and a tap (a two-way toggle), through the same activation every row takes', () => {
    const st = new SaveStore(SAVE_KEY, new Slot());
    let refreshed = 0;
    const host = { save: st, refresh: () => void refreshed++, replayBriefing: () => {} };
    activateRow(host, 'visualStyle', 1); // Right / Confirm
    expect(st.settings.visualStyle).toBe('classic');
    activateRow(host, 'visualStyle', -1); // Left
    expect(st.settings.visualStyle).toBe('hd2d');
    activateRow(host, 'visualStyle', 1, true); // a tap
    expect(st.settings.visualStyle).toBe('classic');
    expect(refreshed).toBe(3);
    expect(adjustSetting(st, 'visualStyle', 1)).toBe(true);
    expect(st.settings.visualStyle).toBe('hd2d');
  });

  it('the row is on the 11-row list (it fits where ten did: the settings column holds thirteen)', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      const rows = optionsColumns({ settings: defaultSettings(), battleHelpOn: true, canRestart: true, canChapterSelect: true, canQuit: true, extraRows: [], game }).find((c) => c.id === 'settings')!.rows;
      expect(rows).toHaveLength(11);
    }
  });
});

describe('the look it switches (applyChapterLook)', () => {
  it('HD-2D, the default: hd2d at bold strength in Chapter I and Chapter IV, nothing elsewhere (release 60, unchanged)', () => {
    applyChapterLook('seymour-flux'); // no second argument: the default style
    expect(lookState).toMatchObject({ name: 'hd2d', strength: 'bold', armed: true });
    resetLook();
    applyChapterLook('seymour-flux', 'hd2d');
    expect(lookState).toMatchObject({ name: 'hd2d', strength: 'bold', armed: true });
    expect(lookWanted()).toBe(true);
    applyChapterLook('ffx2-bahamut', 'hd2d');
    expect(lookState).toMatchObject({ name: 'hd2d', strength: 'bold', armed: true });
    applyChapterLook('yunalesca', 'hd2d');
    expect(lookState).toMatchObject({ name: null, armed: false });
  });

  it('CLASSIC: no look in any chapter, the frame release 59 drew (no armed flag: no relight define, no rig work)', () => {
    for (const id of ['seymour-flux', 'ffx2-bahamut', 'yunalesca', 'ffx2-leblanc', undefined]) {
      resetLook();
      applyChapterLook(id, 'classic');
      expect(lookState, String(id)).toMatchObject({ name: null, strength: 'subtle', armed: false });
      expect(lookWanted(), String(id)).toBe(false);
    }
  });

  it('turns back on when the player turns it back (the next chapter starts with the choice)', () => {
    applyChapterLook('seymour-flux', 'classic');
    expect(lookState).toMatchObject({ name: null, armed: false });
    const v = lookState.version;
    applyChapterLook('seymour-flux', 'hd2d');
    expect(lookState).toMatchObject({ name: 'hd2d', strength: 'bold', armed: true });
    expect(lookState.version).toBe(v + 1);
    applyChapterLook('seymour-flux', 'classic');
    expect(lookState).toMatchObject({ name: null, armed: false });
  });

  it('an address look key wins over the setting, both ways', () => {
    // CLASSIC in the setting, ?look=hd2d&lookstrength=bold in the address: the address forces the look (and the screen's call leaves it)
    const forced = parseLook('?look=hd2d&lookstrength=bold');
    lookState.auto = forced.auto;
    lookState.armed = forced.armed;
    lookState.name = forced.name;
    lookState.strength = forced.strength;
    applyChapterLook('seymour-flux', 'classic');
    applyChapterLook('yunalesca', 'classic');
    expect(lookState).toMatchObject({ auto: false, name: 'hd2d', strength: 'bold', armed: true });
    // HD-2D in the setting, ?look=off in the address: the address turns it off everywhere
    resetLook();
    const off = parseLook('?look=off');
    lookState.auto = off.auto;
    lookState.armed = off.armed;
    lookState.name = off.name;
    applyChapterLook('seymour-flux', 'hd2d');
    expect(lookState).toMatchObject({ auto: false, name: null });
  });

  it('is what the battle screen asks for: the stored setting, read when a chapter\'s battle is set up', () => {
    const src = readFileSync(resolve(__dirname, '..', '..', 'src', 'app', 'screens', 'BattleScreen.ts'), 'utf8');
    expect(src).toMatch(/applyChapterLook\(chapter\.id, visualStyleOf\(readSetting\('visualStyle'\)\)\)/);
  });
});
