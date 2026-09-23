/**
 * **The pause menu's X-2 BATTLE ACTIVE/WAIT row, read by the engine at last.**
 * FFX-2 only (AGENTS.md rule 14; FFX's CTB has no clock under a menu).
 *
 * Bailey, 2026-09-22 21:45 EDT (`docs/target/decisions.json` D-029): *"1. C Wait
 * mode. Also I want the default to be wait mode instead of active mode please."*
 * The row existed and was written, and nothing in the engine read it
 * (`docs/handoff/ffx2-active-menu.md`). Now: Wait on a fresh save, persisted like
 * the volumes, pushed to the engine at chapter start (`createEngine`) and when
 * the pause closes (`BattleScreen` → `applyAtbConfig`), before the clock is
 * released. `docs/plans/ffx2-wait-mode-review.md` §5 I8/I9.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { SaveStore, defaultSettings, migrate, type SaveData } from '../../src/app/SaveData.ts';
import { optionsColumns, type OptionsContext } from '../../src/app/screens/pause/panels.ts';
import { adjustSetting } from '../../src/app/screens/pause/settings.ts';
import { applyAtbConfig, applyAtbMode, createEngine } from '../../src/app/screens/BattleScreenWiring.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';

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
  save = new SaveStore('test:atb-mode', storage);
});

function modeRow() {
  const ctx: OptionsContext = {
    settings: save.settings,
    battleHelpOn: null,
    canRestart: true,
    canChapterSelect: true,
    canQuit: true,
    extraRows: [],
    game: 'ffx2',
  };
  return optionsColumns(ctx)[0]!.rows.find((r) => r.id === 'ffx2Atb')!;
}

describe('the X-2 BATTLE row (FFX-2 Config ATB Mode, §1.5)', () => {
  it('a fresh save reports Wait, and the row reads WAIT', () => {
    expect(defaultSettings().ffx2Atb).toBe('wait');
    expect(save.settings.ffx2Atb).toBe('wait');
    expect(modeRow().label).toBe('X-2 BATTLE');
    expect(modeRow().value).toBe('WAIT');
  });

  it('flips both ways and persists across a reload, like the volumes', () => {
    expect(adjustSetting(save, 'ffx2Atb', 1)).toBe(true);
    expect(save.settings.ffx2Atb).toBe('active');
    expect(modeRow().value).toBe('ACTIVE');
    expect(new SaveStore('test:atb-mode', storage).settings.ffx2Atb).toBe('active');
    adjustSetting(save, 'ffx2Atb', -1);
    expect(new SaveStore('test:atb-mode', storage).settings.ffx2Atb).toBe('wait');
  });

  it('no migration: a save from before the row gets Wait; a stored Active is kept', () => {
    const old = { settings: { masterVolume: 0.5 } } as unknown as Partial<SaveData>;
    expect(migrate(old).settings.ffx2Atb).toBe('wait');
    const stored = { settings: { ffx2Atb: 'active' } } as unknown as Partial<SaveData>;
    expect(migrate(stored).settings.ffx2Atb).toBe('active');
  });
});

describe('the engine hears the row (BattleScreenWiring)', () => {
  it('applyAtbMode tells an FFX-2 engine the stored mode', () => {
    const engine = new FFX2Engine({ atbMode: 'active' });
    applyAtbMode(engine);
    expect(engine.atbMode()).toBe('wait');
    save.setSettings({ ffx2Atb: 'active' });
    applyAtbMode(engine);
    expect(engine.atbMode()).toBe('active');
  });

  it('applyAtbConfig (the pause-close hook) carries mode and speed together', () => {
    save.setSettings({ ffx2Atb: 'active', ffx2AtbSpeed: 'slow' });
    const engine = new FFX2Engine();
    applyAtbConfig(engine);
    expect(engine.atbMode()).toBe('active');
    expect(engine.atbSpeed()).toBe('slow');
  });

  it('createEngine applies it at chapter start', async () => {
    const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut']!;
    const setup = { game: 'ffx2' as const, party: bevelleBuild, enemies: group, triggers: [], seed: 1, condition: 'normal' as const, canEscape: false };
    const fresh = (await createEngine('ffx2', setup)) as FFX2Engine;
    expect(fresh.atbMode()).toBe('wait');
    save.setSettings({ ffx2Atb: 'active' });
    const active = (await createEngine('ffx2', setup)) as FFX2Engine;
    expect(active.atbMode()).toBe('active');
  });

  it('is a no-op for FFX and for no engine at all', () => {
    save.setSettings({ ffx2Atb: 'active' });
    const engine = new FFXEngine();
    expect(() => applyAtbConfig(engine)).not.toThrow();
    expect('setAtbMode' in engine).toBe(false);
    expect(() => applyAtbConfig(null)).not.toThrow();
  });
});
