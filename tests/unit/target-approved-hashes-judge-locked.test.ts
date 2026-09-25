/**
 * decisions-2026-09-25.md item 12 (decision B): sets Bailey picked the option
 * for on a sheet, then an agent judge passed and locked, but nobody recorded
 * that Bailey saw the exact installed files, live in
 * docs/target/judge-locked-hashes.json instead of docs/target/approved-hashes.json.
 * The lock itself does not change (D:/Tools/pyrefly-lora/tools/verify-approved.mjs
 * verifies both files the same way); only the label and the list move. This test
 * proves the split is a true partition: nothing lost, nothing duplicated, and the
 * two files Bailey did see with his own eyes (Yojimbo's longer blade, and the
 * byte-identical Den of Woe plate) stay recorded as his in approved-hashes.json.
 * Both games: this is bookkeeping over already-approved art, not a game-data change.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');

type FileEntry = { sha256: string; mtime?: string; approved?: string };
type ArtSet = Record<string, FileEntry | string | undefined> & { words?: string; note?: string };
type HashDoc = { sets: Record<string, ArtSet> };

function loadJson(relPath: string): HashDoc {
  return JSON.parse(readFileSync(path.join(ROOT, relPath), 'utf8')) as HashDoc;
}

function fileKeys(set: ArtSet): string[] {
  return Object.keys(set).filter((k) => k !== 'words' && k !== 'note');
}

function must(set: ArtSet | undefined, name: string): ArtSet {
  if (!set) throw new Error(`expected set ${name} to exist`);
  return set;
}

const approved = loadJson('docs/target/approved-hashes.json');
const judgeLocked = loadJson('docs/target/judge-locked-hashes.json');

// Sets the sheet moves entirely into the judge-locked list, with their sourced file counts.
const FULLY_LOCKED: Record<string, number> = {
  'chapter:isaaru:2026-09-25': 12,
  'chapter:omnis:2026-09-25': 5,
  'chapter:trema:2026-09-25': 5,
  'chapter:yojimbo:2026-09-24': 4,
  'chapter:natus:2026-09-24': 5,
  'chapter:fallen-aeons:2026-09-24': 10,
  'chapter:fallen-aeons-casts:2026-09-24': 2,
  'chapter:natus-cast:2026-09-24': 1,
};

describe('docs/target/judge-locked-hashes.json (decisions-2026-09-25 item 12)', () => {
  it('moves each fully-judged set out of approved-hashes.json entirely', () => {
    for (const [name, count] of Object.entries(FULLY_LOCKED)) {
      expect(approved.sets[name], `${name} should no longer be in approved-hashes.json`).toBeUndefined();
      expect(judgeLocked.sets[name], `${name} should be in judge-locked-hashes.json`).toBeDefined();
      expect(fileKeys(must(judgeLocked.sets[name], name))).toHaveLength(count);
    }
  });

  it('splits chapter:gippal:2026-09-25: the byte-identical Den of Woe plate stays Bailey\'s', () => {
    const stillApproved = approved.sets['chapter:gippal:2026-09-25'];
    const nowLocked = judgeLocked.sets['chapter:gippal:2026-09-25'];
    expect(stillApproved).toBeDefined();
    expect(nowLocked).toBeDefined();
    expect(fileKeys(must(stillApproved, 'chapter:gippal:2026-09-25 (approved)'))).toEqual(['public/art/backdrops/den-of-woe.png']);
    expect(fileKeys(must(nowLocked, 'chapter:gippal:2026-09-25 (locked)')).sort()).toEqual(
      [
        'public/art/characters/baralai-shade/idle.png',
        'public/art/characters/gippal-shade/cast.png',
        'public/art/characters/gippal-shade/idle.png',
      ].sort(),
    );
  });

  it('splits chapter:yojimbo-casts:2026-09-24: the longer-blade cast Bailey approved by name stays his', () => {
    const stillApproved = approved.sets['chapter:yojimbo-casts:2026-09-24'];
    const nowLocked = judgeLocked.sets['chapter:yojimbo-casts:2026-09-24'];
    expect(stillApproved).toBeDefined();
    expect(nowLocked).toBeDefined();
    expect(fileKeys(must(stillApproved, 'chapter:yojimbo-casts:2026-09-24 (approved)'))).toEqual(['public/art/characters/yojimbo-cavern/cast.png']);
    expect(fileKeys(must(nowLocked, 'chapter:yojimbo-casts:2026-09-24 (locked)'))).toEqual(['public/art/characters/daigoro/cast.png']);
  });

  it('is a true partition: no file path is recorded (with a hash) in both lists', () => {
    const seen = new Map<string, string>();
    for (const [setName, set] of Object.entries(approved.sets)) {
      for (const key of fileKeys(set)) seen.set(`${setName}::${key}`, 'approved');
    }
    for (const [setName, set] of Object.entries(judgeLocked.sets)) {
      for (const key of fileKeys(set)) {
        const existing = seen.get(`${setName}::${key}`);
        expect(existing, `${setName}::${key} should not also be in approved-hashes.json`).toBeUndefined();
      }
    }
  });

  it('keeps every locked hash a real sha256, so the lock still means something', () => {
    for (const set of Object.values(judgeLocked.sets)) {
      for (const key of fileKeys(set)) {
        const entry = set[key];
        expect(typeof entry).toBe('object');
        expect((entry as FileEntry).sha256).toMatch(/^[0-9a-f]{64}$/);
      }
    }
  });

  it('does not touch any set the sheet says stays Bailey\'s as it is', () => {
    for (const name of ['chapter:evrae:2026-09-23', 'chapter:macalania:2026-09-25', 'chapter:yojimbo-plate:2026-09-24', 'chapter:yojimbo-sakura:2026-09-25', 'chapter:leblanc-goons:2026-09-24', 'art4:2026-09-21']) {
      expect(approved.sets[name], `${name} should stay in approved-hashes.json`).toBeDefined();
      expect(judgeLocked.sets[name], `${name} should not appear in judge-locked-hashes.json`).toBeUndefined();
    }
  });
});
