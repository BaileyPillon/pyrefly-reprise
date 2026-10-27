/**
 * PR-0513 (deep review round 29 of release 64): 89 protected-art pins no longer matched the art of
 * releases 63 and 64 (verify-approved: 828 ok, 89 mismatched; round 28: 917 ok). The ledger now
 * records each as an explicit revision in its own house shape (docs/handoff/r64-art-ledger.md): the
 * new pin on top, the old record one `supersedes` down with its `backup`.
 *
 * What this pins, so the records cannot drift back or flatter themselves:
 * - 19 boss re-cut pins rest on Bailey's own yes (D-1285) and carry `approved`;
 * - 70 pins (49 of the 2026-10-22 art batch, 21 painted again by the r64 repaint) are DRIVER CALLS under his
 *   delegation, his to overturn: they carry `delegated` and never `approved`, and quote the words verbatim;
 * - the three sets that hold the words hold no pins of their own;
 * - when the art tree is present, every revised pin is the shipped file (the check this pass exists for).
 *
 * Records only (no art file changes). Both games: the ledger is shared plumbing; Seymour Flux, Tidus, Yuna
 * and Kimahri are FFX, Bahamut, Yuna White Mage, Rikku Dark Knight and Paine Warrior are FFX-2.
 */

import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');

type Pin = {
  sha256: string;
  mtime?: string;
  approved?: string;
  delegated?: string;
  replacedBy?: string;
  backup?: string;
  supersedes?: Pin;
};
type Ledger = { sets: Record<string, Record<string, unknown>> };

const ledger = JSON.parse(readFileSync(path.join(ROOT, 'docs/target/approved-hashes.json'), 'utf8')) as Ledger;

const SET_BOSS = 'bailey:2026-10-23-boss-recut';
const SET_BATCH = 'driver:2026-10-22-colour-lock (D-1182 to D-1292, delegated by Bailey)';
const SET_REPAINT = 'driver:2026-10-24-repaint-4-figures (D-1327, delegated by Bailey)';

const BOSS = /^bailey:2026-10-23 \(boss re-cut/;
const BATCH = /^driver:2026-10-24 \(art batch of 2026-10-22/;
const REPAINT = /^driver:2026-10-24 \(r64 repaint/;

const DELEGATION = 'you can make all the decisions for me, ill go with all your recommendations. i still cant play it unfortunately. time crunch.';

type Row = { set: string; file: string; pin: Pin };
function revised(re: RegExp): Row[] {
  const rows: Row[] = [];
  for (const [set, entries] of Object.entries(ledger.sets)) {
    for (const [file, v] of Object.entries(entries)) {
      const pin = v as Pin | string;
      if (typeof pin === 'object' && pin && typeof pin.replacedBy === 'string' && re.test(pin.replacedBy)) rows.push({ set, file, pin });
    }
  }
  return rows;
}

const boss = revised(BOSS);
const batch = revised(BATCH);
const repaint = revised(REPAINT);
const all = [...boss, ...batch, ...repaint];

function chain(pin: Pin): Pin[] {
  const out: Pin[] = [];
  for (let p: Pin | undefined = pin; p; p = p.supersedes) out.push(p);
  return out;
}

describe('docs/target/approved-hashes.json: the 89 revisions of PR-0513', () => {
  it('records 89 pins in 83 files: 19 boss re-cut, 49 art batch, 21 r64 repaint', () => {
    expect(boss).toHaveLength(19);
    expect(batch).toHaveLength(49);
    expect(repaint).toHaveLength(21);
    expect(new Set(all.map((r) => r.file)).size).toBe(83);
    expect(new Set(boss.map((r) => r.file.split('/')[3])).size).toBe(2);
  });

  it('only the boss re-cut is his own yes: the 70 driver calls carry `delegated` and never `approved`', () => {
    for (const r of boss) {
      expect(r.pin.approved, r.file).toBe('2026-10-23');
      expect(r.pin.delegated, r.file).toBeUndefined();
      expect(r.pin.replacedBy, r.file).toContain('verbatim "Yes, re-cut both (Recommended)"');
      expect(r.pin.replacedBy, r.file).toContain('D-1285');
    }
    for (const r of [...batch, ...repaint]) {
      expect(r.pin.delegated, r.file).toBe('2026-10-24');
      expect(r.pin.approved, r.file).toBeUndefined();
      expect(r.pin.replacedBy, r.file).toContain('DRIVER CALL under delegation, his to overturn, not his approval of the picture');
      expect(r.pin.replacedBy, r.file).toContain(`verbatim "${DELEGATION}"`);
    }
  });

  it('every chain is well formed: 64-hex hashes, each step a different file, a backup on every superseded record', () => {
    for (const r of all) {
      const c = chain(r.pin);
      expect(c.length, r.file).toBeGreaterThanOrEqual(2);
      for (const p of c) expect(p.sha256, r.file).toMatch(/^[0-9a-f]{64}$/);
      for (let i = 0; i + 1 < c.length; i++) {
        expect(c[i]!.sha256, `${r.file} step ${i}`).not.toBe(c[i + 1]!.sha256);
      }
      // the record this pass pushed down always says where its bytes are; a pin painted again by the
      // r64 repaint pushed two records down (the batch's, then the ledger's old pin)
      expect(c[1]!.backup, `${r.file} backup of the replaced record`).toBeTruthy();
      if (repaint.includes(r)) {
        expect(c.length, r.file).toBeGreaterThanOrEqual(3);
        expect(c[2]!.backup, `${r.file} backup of the ledger's old pin`).toBeTruthy();
      }
    }
  });

  it('the boss pins keep the original in the private art repo archive; the batch pins keep the release 62 art tree', () => {
    for (const r of boss) expect(r.pin.supersedes!.backup, r.file).toContain('archive/2026-10-23-boss-recut/');
    for (const r of batch) expect(r.pin.supersedes!.backup, r.file).toContain('D:/pyrefly-art-r61/');
  });

  it('a pin painted again by the r64 repaint nests the batch record one down, then the ledger\'s old pin', () => {
    for (const r of repaint) {
      const mid = r.pin.supersedes!;
      expect(mid.replacedBy, r.file).toMatch(BATCH);
      expect(mid.delegated, r.file).toBe('2026-10-24');
      expect(mid.backup, r.file).toContain('archive/2026-10-24-2026-10-24-repaint-4-figures/');
      expect(mid.supersedes!.backup, r.file).toContain('D:/pyrefly-art-r61/');
      expect(r.pin.replacedBy, r.file).toContain('D-1327');
    }
  });

  it('the three sets hold the words once and no pins of their own', () => {
    for (const name of [SET_BOSS, SET_BATCH, SET_REPAINT]) {
      const set = ledger.sets[name];
      expect(set, name).toBeDefined();
      expect(Object.keys(set!).sort(), name).toEqual(['decision', 'note', 'words']);
    }
    const boss1 = ledger.sets[SET_BOSS]!;
    expect(boss1.words).toBe('Yes, re-cut both (Recommended)');
    expect(boss1.decision).toBe('D-1285');
    expect(String(ledger.sets[SET_REPAINT]!.words)).toBe(DELEGATION);
    for (const name of [SET_BATCH, SET_REPAINT]) expect(String(ledger.sets[name]!.note), name).toContain('not Bailey\'s own approval');
    for (const name of [SET_BOSS, SET_BATCH, SET_REPAINT]) {
      expect(String(ledger.sets[name]!.note), name).toContain('Recorded on 2026-10-26 under item 205d');
    }
  });

  const artHere = existsSync(path.join(ROOT, 'public/art/characters'));
  it.skipIf(!artHere)('every revised pin is the file the art tree holds (the shipped art of release 64)', () => {
    const bad: string[] = [];
    const seen = new Set<string>();
    for (const r of all) {
      if (seen.has(r.file)) continue;
      seen.add(r.file);
      const p = path.join(ROOT, r.file);
      if (!existsSync(p)) { bad.push(`${r.file} missing`); continue; }
      const h = createHash('sha256').update(readFileSync(p)).digest('hex');
      if (h !== r.pin.sha256) bad.push(`${r.file} ${h.slice(0, 12)} != ${r.pin.sha256.slice(0, 12)}`);
    }
    expect(bad).toEqual([]);
    expect(seen.size).toBe(83);
  });
});
