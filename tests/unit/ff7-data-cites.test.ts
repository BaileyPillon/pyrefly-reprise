/**
 * FF7 data and engine hygiene (plan §4 step 2 and invariants I4, I6):
 * - every FF7 data file cites a research section with a confidence tag, and every
 *   registry record carries its own `cite` (AGENTS.md rule 6);
 * - every id the data references resolves in the registry;
 * - `src/battle/ff7/**` imports no DOM, no `three`, nothing from `src/data`,
 *   `src/engine` or `src/ui`, never calls `Math.random` (rule 1);
 * - every FF7 file stays under 400 lines (rule 7).
 * FF7 only.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ff7Registry, guardScorpion, sector1ReactorBuild } from '../../src/data/ff7/index.ts';

const TAGS = /\[(verified: \d sources?|single source|derived|estimate|unsourced|conflict)/;
const DATA = join(process.cwd(), 'src/data/ff7');
const ENGINE = join(process.cwd(), 'src/battle/ff7');
const EXEMPT = new Set(['ids.ts', 'index.ts']);

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...tsFiles(full));
    else if (e.isFile() && e.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

const reg = ff7Registry();

describe('FF7 data cites its research (rule 6)', () => {
  for (const file of tsFiles(DATA)) {
    const name = file.slice(DATA.length + 1);
    if (EXEMPT.has(name)) continue;
    it(`${name} has a § reference and a confidence tag`, () => {
      const text = readFileSync(file, 'utf8');
      expect(text.includes('§'), `${name}: no §`).toBe(true);
      expect(TAGS.test(text), `${name}: no tag`).toBe(true);
    });
  }
  const records: Array<[string, { cite: string }]> = [
    ...Object.entries(reg.abilities),
    ...Object.entries(reg.items),
    ...Object.entries(reg.materia),
    ...Object.entries(reg.limits),
  ];
  it(`every registry record (${records.length}) carries a cite with § and a tag`, () => {
    for (const [id, rec] of records) {
      expect(rec.cite.includes('§'), `${id}: cite has no §`).toBe(true);
      expect(TAGS.test(rec.cite), `${id}: cite has no tag`).toBe(true);
    }
  });
});

describe('FF7 data references resolve', () => {
  it('Materia spells, item effects, learned Limits and the boss abilities are all registered', () => {
    for (const m of Object.values(reg.materia)) for (const s of m.spells) expect(reg.abilities[s], `spell ${s}`).toBeDefined();
    for (const i of Object.values(reg.items)) expect(reg.abilities[i.effect], `item effect ${i.effect}`).toBeDefined();
    for (const m of sector1ReactorBuild.members) {
      for (const l of m.limit.learnedLimitIds) expect(reg.abilities[l]?.kind, `limit ${l}`).toBe('limit');
      for (const orb of [...m.materia.weapon, ...m.materia.armour]) if (orb) expect(reg.materia[orb.id], `materia ${orb.id}`).toBeDefined();
      expect(reg.limits[m.id], `limit table ${m.id}`).toBeDefined();
      expect(reg.equipment[m.weapon.id]).toBe(m.weapon);
    }
    for (const a of guardScorpion.abilityIds ?? []) expect(reg.abilities[a]?.kind, `boss ability ${a}`).toBe('enemy');
    for (const d of guardScorpion.ff7?.drops ?? []) expect(reg.equipment[d.itemId] ?? reg.items[d.itemId], `drop ${d.itemId}`).toBeDefined();
    for (const i of sector1ReactorBuild.inventory) expect(reg.items[i.itemId], `item ${i.itemId}`).toBeDefined();
  });
  it('canMiss is only ever false or absent (the engine reads === false)', () => {
    for (const a of Object.values(reg.abilities)) expect([undefined, false]).toContain(a.canMiss);
  });
  it('every damaging action has a hit rule or canMiss false', () => {
    for (const a of Object.values(reg.abilities)) {
      if (a.formula === 'none') continue;
      expect(a.hit !== undefined || a.canMiss === false, a.id).toBe(true);
    }
  });
  it('the boss: 800 HP, Lv 12, tail-up form Def 255 / MDf 384, Lightning weak, Gravity void (gs §2.1, §3)', () => {
    const f = guardScorpion.ff7;
    expect(f?.stats.maxHp).toBe(800);
    expect(f?.level).toBe(12);
    expect(f?.stats.def).toBe(40);
    expect(f?.stats.mdf).toBe(256);
    expect(f?.formStats?.[1]).toEqual({ def: 255, mdf: 384 });
    expect(f?.elements).toEqual({ lightning: 'weak', gravity: 'void' });
    expect(f?.drops).toEqual([{ itemId: 'assault-gun', count: 1, chanceClass: 63 }]);
    expect([f?.exp, f?.ap, f?.gil]).toEqual([100, 10, 100]);
  });
});

describe('FF7 engine layering (rule 1) and size (rule 7)', () => {
  const FORBIDDEN_IMPORT = /from\s+['"](three|[./]*\/(data|engine|ui|app)\/[^'"]*)['"]/;
  for (const file of tsFiles(ENGINE)) {
    const name = file.slice(ENGINE.length + 1);
    it(`src/battle/ff7/${name} is pure`, () => {
      const text = readFileSync(file, 'utf8');
      const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(FORBIDDEN_IMPORT.test(code), `${name}: forbidden import`).toBe(false);
      expect(/Math\.random|\bdocument\.|\bwindow\.|\bDate\.now|performance\.now/.test(code), `${name}: impure call`).toBe(false);
    });
  }
  for (const file of [...tsFiles(ENGINE), ...tsFiles(DATA)]) {
    it(`${file.slice(process.cwd().length + 1)} is under 400 lines`, () => {
      expect(readFileSync(file, 'utf8').split('\n').length).toBeLessThan(400);
    });
  }
});
