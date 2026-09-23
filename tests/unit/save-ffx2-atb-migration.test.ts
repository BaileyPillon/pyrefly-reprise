/**
 * **Every existing save moves to Wait once, and a choice made after that is kept.**
 *
 * Bailey, 2026-09-23 00:00 EDT (`docs/target/decisions.json` D-029, follow-up 1):
 * *"1, 2, 3 I'll take your recommendations on all please"* — the recommendation was
 * a one-time migration, because Active was the only behaviour before release 09 and
 * `'active'` was the stored default, so no save's `'active'` is a choice anybody made.
 * Preflight: `docs/plans/ffx2-wait-migration-review.md` (save-data class).
 *
 * FFX-2 only (AGENTS.md rule 14): only the FFX-2 engine reads `ffx2Atb`.
 */

import { describe, expect, it } from 'vitest';
import { defaultSave, defaultSettings, migrate, SaveStore, type SaveData } from '../../src/app/SaveData.ts';
import { adjustSetting } from '../../src/app/screens/pause/settings.ts';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function memoryStorage(): Store & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const KEY = 'test:ffx2-atb-migration';

/**
 * A save in release 08's shape, written by the **current** writer: a real
 * `SaveStore` with progress in every field, `ffx2Atb: 'active'` (release 08's
 * stored default), and then the marker removed from the JSON, because release
 * 08 never wrote one.
 */
function release08Blob(): string {
  const storage = memoryStorage();
  const s = new SaveStore(KEY, storage);
  s.recordAttempt('seymour-flux');
  s.recordClear('seymour-flux', 184_000, 17);
  s.recordAttempt('ffx2-bahamut');
  s.addPlayTime('ffx2-bahamut', 900);
  s.flushPlayTime();
  s.unlock('bestiary:bahamut');
  s.setFlag('titleSeen', true);
  s.markCoachSeen('briefing');
  s.setSettings({
    masterVolume: 0.4,
    musicVolume: 0.25,
    sfxVolume: 0.6,
    textSpeed: 1.5,
    guideVisible: false,
    ffx2AtbSpeed: 'fast',
    pausePanelsHidden: true,
    ffx2Atb: 'active',
  });
  const blob = JSON.parse(storage.map.get(KEY)!) as SaveData;
  delete (blob.settings as unknown as Record<string, unknown>)['ffx2AtbMigrated'];
  return JSON.stringify(blob);
}

function storeWith(blob: string): { storage: ReturnType<typeof memoryStorage>; save: SaveStore } {
  const storage = memoryStorage();
  storage.setItem(KEY, blob);
  return { storage, save: new SaveStore(KEY, storage) };
}

describe('the one-time FFX-2 Wait migration (D-029 follow-up 1)', () => {
  it('a release-08 save stored as Active loads as Wait, with the marker', () => {
    const { save } = storeWith(release08Blob());
    expect(save.settings.ffx2Atb).toBe('wait');
    expect(save.settings.ffx2AtbMigrated).toBe(true);
  });

  it('nothing else in the save changes (deep equality against the fixture)', () => {
    // One blob, parsed twice: `updatedAt` is the wall clock at the last write.
    const blob = release08Blob();
    const before = JSON.parse(blob) as SaveData;
    const after = migrate(JSON.parse(blob) as Partial<SaveData>);
    const expected: SaveData = {
      ...before,
      settings: { ...before.settings, ffx2Atb: 'wait', ffx2AtbMigrated: true },
    };
    expect(after).toStrictEqual(expected);
    // The progress fields, named, so a failure says what was lost.
    expect(after.chapters['seymour-flux']).toStrictEqual(before.chapters['seymour-flux']);
    expect(after.chapters['ffx2-bahamut']?.playTimeMs).toBe(900);
    expect(after.unlocked).toStrictEqual(['bestiary:bahamut']);
    expect(after.seenCoach).toStrictEqual(['briefing']);
    expect(after.flags).toStrictEqual({ titleSeen: true });
    expect(after.settings.ffx2AtbSpeed).toBe('fast');
  });

  it('whatever ffx2Atb held, an unmarked save gets Wait', () => {
    for (const held of ['active', 'wait', undefined, 'banana', 7]) {
      const raw = { settings: { ffx2Atb: held } } as unknown as Partial<SaveData>;
      const out = migrate(raw).settings;
      expect(out.ffx2Atb, `held ${String(held)}`).toBe('wait');
      expect(out.ffx2AtbMigrated).toBe(true);
    }
    // A non-boolean marker is not a marker.
    const odd = { settings: { ffx2Atb: 'active', ffx2AtbMigrated: 'yes' } } as unknown as Partial<SaveData>;
    expect(migrate(odd).settings.ffx2Atb).toBe('wait');
    expect(migrate(odd).settings.ffx2AtbMigrated).toBe(true);
    // No settings at all, or null ones.
    expect(migrate({}).settings.ffx2Atb).toBe('wait');
    const nulls = { settings: null } as unknown as Partial<SaveData>;
    expect(migrate(nulls).settings.ffx2AtbMigrated).toBe(true);
  });

  it('a marked save keeps what the player chose since', () => {
    const chose = { settings: { ffx2Atb: 'active', ffx2AtbMigrated: true } } as unknown as Partial<SaveData>;
    expect(migrate(chose).settings.ffx2Atb).toBe('active');
    const wait = { settings: { ffx2Atb: 'wait', ffx2AtbMigrated: true } } as unknown as Partial<SaveData>;
    expect(migrate(wait).settings.ffx2Atb).toBe('wait');
    // A corrupt value under the marker reads as the default, never leaks.
    const junk = { settings: { ffx2Atb: 'banana', ffx2AtbMigrated: true } } as unknown as Partial<SaveData>;
    expect(migrate(junk).settings.ffx2Atb).toBe('wait');
  });

  it('is idempotent: migrate twice equals migrate once', () => {
    const once = migrate(JSON.parse(release08Blob()) as Partial<SaveData>);
    const twice = migrate(JSON.parse(JSON.stringify(once)) as Partial<SaveData>);
    expect(twice).toStrictEqual(once);
  });

  it('flip to ACTIVE after the migration, reload: ACTIVE holds (the marker holds), twice', () => {
    const { storage, save } = storeWith(release08Blob());
    expect(save.settings.ffx2Atb).toBe('wait');
    expect(adjustSetting(save, 'ffx2Atb', 1)).toBe(true);
    expect(save.settings.ffx2Atb).toBe('active');
    const reload1 = new SaveStore(KEY, storage);
    expect(reload1.settings.ffx2Atb).toBe('active');
    const reload2 = new SaveStore(KEY, storage);
    expect(reload2.settings.ffx2Atb).toBe('active');
    expect(reload2.settings.ffx2AtbMigrated).toBe(true);
  });

  it('a load with no write migrates again, to the same answer', () => {
    const { storage } = storeWith(release08Blob());
    expect(new SaveStore(KEY, storage).settings.ffx2Atb).toBe('wait');
    expect(new SaveStore(KEY, storage).settings.ffx2Atb).toBe('wait');
  });

  it('a fresh save is Wait with the marker, and the rule never fires on it', () => {
    expect(defaultSettings().ffx2Atb).toBe('wait');
    expect(defaultSettings().ffx2AtbMigrated).toBe(true);
    expect(defaultSave().settings.ffx2AtbMigrated).toBe(true);
    const fresh = new SaveStore(KEY, memoryStorage());
    expect(fresh.settings.ffx2Atb).toBe('wait');
    expect(fresh.settings.ffx2AtbMigrated).toBe(true);
  });
});
