/**
 * **The pause menu's ATB SPEED row** — FFX-2's Config "ATB Mode and Speed"
 * (`research/ffx2-combat-core.md` §1.2; `research/ffx-vs-ffx2-presentation.md:278`).
 *
 * FFX-2 chapters only (AGENTS.md rule 14): FFX's CTB has no tick rate, so an
 * FFX pause never prints the row. Persisted exactly the way the volumes are —
 * `SaveStore.setSettings` — as an **optional** `Settings.ffx2AtbSpeed` with no
 * migration: an old save reads as Normal, the engine as it always played.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { SaveStore, migrate, readSetting, type SaveData } from '../../src/app/SaveData.ts';
import { optionsColumns, type OptionsContext } from '../../src/app/screens/pause/panels.ts';
import { ATB_SPEEDS, adjustSetting } from '../../src/app/screens/pause/settings.ts';
import { applyAtbSpeed } from '../../src/app/screens/BattleScreenWiring.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';

class MemoryStorage {
  readonly items = new Map<string, string>();
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
}

let storage: MemoryStorage;
let save: SaveStore;

beforeEach(() => {
  storage = new MemoryStorage();
  save = new SaveStore('test:atb-speed', storage);
});

function ctx(game: OptionsContext['game']): OptionsContext {
  return {
    settings: save.settings,
    battleHelpOn: null,
    canRestart: true,
    canChapterSelect: true,
    canQuit: true,
    extraRows: [],
    ...(game ? { game } : {}),
  };
}

const settingRows = (c: OptionsContext) => optionsColumns(c)[0]!.rows;

describe('the ATB SPEED row (FFX-2 only)', () => {
  it('is printed in an FFX-2 pause, under the X-2 row, reading NORMAL on a fresh save', () => {
    const rows = settingRows(ctx('ffx2'));
    const ids = rows.map((r) => r.id);
    expect(ids).toContain('ffx2AtbSpeed');
    expect(ids.indexOf('ffx2AtbSpeed')).toBe(ids.indexOf('ffx2Atb') + 1);
    const row = rows.find((r) => r.id === 'ffx2AtbSpeed')!;
    expect(row.label).toBe('ATB SPEED');
    expect(row.value).toBe('NORMAL');
    expect(row.selectable).toBe(true);
  });

  it('is absent from an FFX pause, and from a pause that names no game', () => {
    expect(settingRows(ctx('ffx')).map((r) => r.id)).not.toContain('ffx2AtbSpeed');
    expect(settingRows(ctx(undefined)).map((r) => r.id)).not.toContain('ffx2AtbSpeed');
  });

  it('steps Slow / Normal / Fast and wraps, so Confirm is never a dead press', () => {
    expect(ATB_SPEEDS).toEqual(['slow', 'normal', 'fast']);
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      expect(adjustSetting(save, 'ffx2AtbSpeed', 1)).toBe(true);
      seen.push(save.settings.ffx2AtbSpeed ?? 'normal');
    }
    expect(seen).toEqual(['fast', 'slow', 'normal']);
    adjustSetting(save, 'ffx2AtbSpeed', -1);
    expect(save.settings.ffx2AtbSpeed).toBe('slow');
    expect(settingRows(ctx('ffx2')).find((r) => r.id === 'ffx2AtbSpeed')!.value).toBe('SLOW');
  });

  it('persists through setSettings like the volumes, and survives a reload', () => {
    adjustSetting(save, 'ffx2AtbSpeed', 1);
    adjustSetting(save, 'masterVolume', -1);
    const reloaded = new SaveStore('test:atb-speed', storage);
    expect(reloaded.settings.ffx2AtbSpeed).toBe('fast');
    expect(reloaded.settings.masterVolume).toBe(save.settings.masterVolume);
  });

  it('needs no migration: a save from before the setting reads as Normal', () => {
    const raw = { settings: { masterVolume: 0.5 } } as unknown as Partial<SaveData>;
    const out = migrate(raw);
    expect(out.settings.ffx2AtbSpeed).toBeUndefined();
    expect(out.settings.masterVolume).toBe(0.5);
    expect(readSetting('ffx2AtbSpeed') ?? 'normal').toBe('normal');
  });
});

describe('the engine hears the setting (BattleScreenWiring.applyAtbSpeed)', () => {
  it('tells an FFX-2 engine the stored speed, and Normal when nothing is stored', () => {
    const engine = new FFX2Engine();
    applyAtbSpeed(engine);
    expect(engine.atbSpeed()).toBe('normal');
    save.setSettings({ ffx2AtbSpeed: 'slow' });
    applyAtbSpeed(engine);
    expect(engine.atbSpeed()).toBe('slow');
  });

  it('is a no-op for FFX, whose CTB has no tick rate', () => {
    save.setSettings({ ffx2AtbSpeed: 'fast' });
    const engine = new FFXEngine();
    expect(() => applyAtbSpeed(engine)).not.toThrow();
    expect('setAtbSpeed' in engine).toBe(false);
    expect(() => applyAtbSpeed(null)).not.toThrow();
  });
});
