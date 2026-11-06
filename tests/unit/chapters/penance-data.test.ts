/**
 * The hidden Penance chapter's data (FFX only): pinned to the reverse-engineering note (`research/re-ffx-penance.md`, "RE n") and to the kernel fixtures, field by field; the chapter is registered hidden (number 35, the word
 * `judgment`), unlisted, with its metadata, scene and door; the battle layer's copies of the ids equal the data layer's; the Celestial weapon rows are `weapon.bin`'s.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as battleRules from '../../../src/battle/ffx/ai/penance-rules.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { COMMAND_RECORDS_PENANCE, PENANCE_ABILITIES } from '../../../src/data/ffx/enemies/penance-abilities.ts';
import { ARM_DOOM_TURNS, PENANCE_OVERKILL_THRESHOLD, PENANCE_ZANMATO_BYTE, RECORDS, penance, penanceGroup, penanceLeftArm, penanceRightArm } from '../../../src/data/ffx/enemies/penance.ts';
import * as ids from '../../../src/data/ffx/penance-ids.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { JUDGMENT_DOOR_WORD } from '../../../src/app/screens/frontend/judgmentDoor.ts';
import { penanceBuild } from '../../../src/data/ffx/builds/penance.ts';
import { dark } from './penanceHelpers.ts';

const fixture = (name: string): { columns: string[]; rows: unknown[][] } => JSON.parse(readFileSync(new URL(`../../fixtures/parity/ffx/${name}.json`, import.meta.url), 'utf8'));
const recordsFixture = fixture('command_records');
const statusFixture = fixture('command_status');
const byId = (f: { rows: unknown[][] }, id: number): unknown[] => f.rows.find((r) => r[0] === id) as unknown[];

describe('the battle layer keeps copies of the ids, and they equal the data layer\'s', () => {
  it('combatants, scripts, rows and the sprite of the split figure', () => {
    expect(battleRules.PENANCE_ID).toBe(ids.PENANCE_ID);
    expect(battleRules.PENANCE_RIGHT_ARM_ID).toBe(ids.PENANCE_RIGHT_ARM_ID);
    expect(battleRules.PENANCE_LEFT_ARM_ID).toBe(ids.PENANCE_LEFT_ARM_ID);
    expect(battleRules.PENANCE_GROUP_ID).toBe(ids.PENANCE_GROUP_ID);
    expect(battleRules.PENANCE_SCRIPT).toBe(ids.PENANCE_SCRIPT);
    expect(battleRules.PENANCE_RIGHT_ARM_SCRIPT).toBe(ids.PENANCE_RIGHT_ARM_SCRIPT);
    expect(battleRules.PENANCE_LEFT_ARM_SCRIPT).toBe(ids.PENANCE_LEFT_ARM_SCRIPT);
    expect(battleRules.PENANCE_SPLIT_SPRITE).toBe(ids.PENANCE_SPRITES.split);
    const rows = battleRules.PENANCE_ROWS;
    for (const key of Object.keys(rows) as Array<keyof typeof rows>) expect(rows[key], key).toBe(ids.PENANCE_ROWS[key]);
  });

  it('the arm\'s record Strength and Agility, which the death puts back, are the record\'s (RE 3)', () => {
    expect(battleRules.ARM_RECORD_STR).toBe(RECORDS.arm[2]);
    expect(battleRules.ARM_RECORD_AGI).toBe(RECORDS.arm[6]);
  });
});

describe('Penance and the arms equal the note (RE 3)', () => {
  it('Penance: 12,000,000 HP, MP 999, STR 255, DEF 240, MAG 255, MDEF 200, AGI 255, LUCK 10, EVA 0, ACC 255, overkill 99,999', () => {
    const p = penance();
    expect(p.stats).toMatchObject({ hp: 12_000_000, mp: 999, str: 255, def: 240, mag: 255, mdef: 200, agi: 255, luck: 10, eva: 0, acc: 255, maxHp: 12_000_000, maxMp: 999 });
    expect(RECORDS.penance).toEqual([12_000_000, 999, 255, 240, 255, 200, 255, 10, 0, 255]);
    expect(PENANCE_OVERKILL_THRESHOLD).toBe(99_999);
  });

  it('an arm: 500,000 HP, MP 999, STR 200, DEF 200, MAG 150, MDEF 200, AGI 150, LUCK 10, EVA 120, ACC 255; the two records are identical', () => {
    for (const a of [penanceRightArm(), penanceLeftArm()]) expect(a.stats).toMatchObject({ hp: 500_000, mp: 999, str: 200, def: 200, mag: 150, mdef: 200, agi: 150, luck: 10, eva: 120, acc: 255, maxHp: 500_000 });
    expect(RECORDS.arm).toEqual([500_000, 999, 200, 200, 150, 200, 150, 10, 120, 255]);
  });

  it('all three absorb all five elements and nothing else', () => {
    for (const e of [penance(), penanceRightArm(), penanceLeftArm()]) expect(e.affinities).toEqual({ fire: 'absorb', ice: 'absorb', lightning: 'absorb', water: 'absorb', holy: 'absorb' });
  });

  it('immune (255) to the fifteen status bytes and to Scan, Eject and Auto-Life; Penance alone to Doom (an arm can be Doomed, counter 200); the buffs land; Threaten never does', () => {
    const fifteen = ['ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow', 'scan', 'eject', 'auto-life'] as const;
    for (const e of [penance(), penanceRightArm(), penanceLeftArm()]) {
      for (const s of fifteen) expect(e.immunities[s], `${e.id} ${s}`).toBe(255);
      for (const s of ['shell', 'protect', 'reflect', 'regen', 'haste', 'nulblaze', 'nulfrost', 'nulshock', 'nultide'] as const) expect(e.immunities[s] ?? 0, `${e.id} ${s}`).toBe(0);
      expect(e.threatenChance).toBe(0);
      expect(e.zanmatoLevel).toBe(PENANCE_ZANMATO_BYTE + 1);
      expect(e.zanmatoLevel).toBe(6);
    }
    expect(penance().immunities['doom']).toBe(255);
    expect(penanceRightArm().immunities['doom'] ?? 0).toBe(0);
    expect(penanceLeftArm().immunities['doom'] ?? 0).toBe(0);
    expect(penanceRightArm().doomTurns).toBe(ARM_DOOM_TURNS);
    expect(ARM_DOOM_TURNS).toBe(200);
  });

  it('the flag bytes: immune to percentage damage, Life, Sensor, a second Scan, CTB damage and Bribe', () => {
    for (const e of [penance(), penanceRightArm(), penanceLeftArm()]) {
      for (const f of ['immune-to-percentage-damage', 'immune-to-life', 'immune-to-sensor', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe'] as const) expect(e.immunityFlags, `${e.id} ${f}`).toContain(f);
    }
  });

  it('rewards: Penance 60,000 AP (65,000), no gil, Master Sphere x3, steals Elixir (rare Megalixir x2); an arm 10,000 AP (12,000), Dark Matter (rare Master Sphere), steals Elixir', () => {
    const r = penance().rewards;
    expect([r.gil, r.ap, r.apOverkill, r.overkillThreshold]).toEqual([0, 60_000, 65_000, 99_999]);
    expect(r.drops).toEqual([{ itemId: 'master-sphere', count: 3 }]);
    expect(r.steal?.common).toEqual({ itemId: 'elixir', count: 1 });
    expect(r.steal?.rare).toEqual({ itemId: 'megalixir', count: 2 });
    for (const a of [penanceRightArm(), penanceLeftArm()]) {
      expect([a.rewards.gil, a.rewards.ap, a.rewards.apOverkill, a.rewards.overkillThreshold]).toEqual([0, 10_000, 12_000, 99_999]);
      expect(a.rewards.drops[0]).toMatchObject({ itemId: 'dark-matter', count: 1, rare: { itemId: 'master-sphere', count: 1 } });
      expect(a.rewards.steal?.common).toEqual({ itemId: 'elixir', count: 1 });
    }
  });

  it('the arms are parts of Penance (the victory test reads the non-part fighters); Penance has ONE form, so its death is a death and not a transformation', () => {
    for (const a of [penanceRightArm(), penanceLeftArm()]) expect(a.flags).toMatchObject({ isPart: true, partOf: ids.PENANCE_ID });
    expect(penance().flags.isPart).toBeUndefined();
    expect(penance().forms).toHaveLength(1);
  });

  it('the formation: Penance on slot 0, the Right Arm on 1, the Left Arm on 2; no Escape (the pick P6: the game allows it); the boss named for the opening beats', () => {
    const g = penanceGroup;
    expect(g.enemies.map((e) => e.id)).toEqual([ids.PENANCE_ID, ids.PENANCE_RIGHT_ARM_ID, ids.PENANCE_LEFT_ARM_ID]);
    expect(g.enemies.map((e) => e.slot)).toEqual([0, 1, 2]);
    expect(g.canEscape).toBe(false);
    expect(g.bossId).toBe(ids.PENANCE_ID);
    expect(ENEMY_GROUPS_BY_ID[g.id]).toBe(g);
  });

  it('the paintings\' keys are fixed (the stage draws its stand-in until the sets are installed); the left arm is a key of its own (the mirrored copy)', () => {
    expect(penance().spriteKey).toBe(ids.PENANCE_SPRITES.whole);
    expect(penanceRightArm().spriteKey).toBe('penance-arm-right');
    expect(penanceLeftArm().spriteKey).toBe('penance-arm-left');
  });
});

describe('the nine new rows equal the kernel fixtures word for word', () => {
  const cases: Array<[string, number]> = [
    [ids.PENANCE_ROWS.immolation, 0x411f],
    [ids.PENANCE_ROWS.obliteration, 0x4120],
    [ids.PENANCE_ROWS.judgmentDay, 0x4121],
    [ids.PENANCE_ROWS.separation, 0x4122],
    [ids.PENANCE_ROWS.death, 0x4124],
    [ids.PENANCE_ROWS.regeneration, 0x4125],
    [ids.PENANCE_ROWS.atrophy, 0x4126],
    [ids.PENANCE_ROWS.teraGraviton, 0x4129],
    [ids.PENANCE_ROWS.mightyGuard, 0x412a],
  ];
  for (const [rowId, game] of cases) {
    it(`${rowId} is 0x${game.toString(16)}`, () => {
      const rec = COMMAND_RECORDS_PENANCE[rowId]!;
      const a = byId(recordsFixture, game); // id, type, flagsMisc, flagsDamage, damageClass, critBonus, formula, accuracy, power, hits, shatter, element
      const b = byId(statusFixture, game); // id, rank, extra, stageMask, stageAmount, buff, chances, durations
      expect(rec.id).toBe(game);
      expect([rec.type, rec.flagsMisc, rec.flagsDamage, rec.damageClass]).toEqual([a[1], a[2], a[3], a[4]]);
      expect(rec.rank ?? 0).toBe(b[1]);
      expect(rec.shatter ?? 0).toBe(a[10]);
      expect(rec.extra ?? 0).toBe(b[2]);
      expect([...(rec.chances ?? [])].map((c) => [...c])).toEqual(b[6]);
      expect([...(rec.durations ?? [])].map((c) => [...c])).toEqual(b[7]);
      const ability = PENANCE_ABILITIES[rowId]!;
      expect(ability.power, 'power').toBe(a[8]);
      expect(ability.hits, 'hits').toBe(a[9]);
      expect(ALL_ABILITIES.find((x) => x.id === rowId)).toBe(ability);
    });
  }

  it('every row never misses (accuracy formula 0: bits 3 to 5 of the first flag word), and every damaging row carries the 99,999 cap', () => {
    for (const [rowId, game] of cases) {
      const a = byId(recordsFixture, game);
      expect(((a[2] as number) >> 3) & 7, `${rowId} accuracy formula`).toBe(0);
      expect(PENANCE_ABILITIES[rowId]!.canMiss, rowId).toBe(false);
    }
    for (const rowId of [ids.PENANCE_ROWS.obliteration, ids.PENANCE_ROWS.immolation, ids.PENANCE_ROWS.judgmentDay, ids.PENANCE_ROWS.teraGraviton]) {
      expect(PENANCE_ABILITIES[rowId]!.flags, rowId).toContain('always-break-damage-limit');
    }
  });

  it('what each does: Obliteration (physical, power 24, the front line, Slow), Immolation (physical, power 32, one target, HP and MP, Armor and Mental Break), Judgment Day (formula 15, power 240, neither physical nor magical, HP and MP)', () => {
    const a = PENANCE_ABILITIES;
    expect(a[ids.PENANCE_ROWS.obliteration]).toMatchObject({ power: 24, formula: 'strength', damageType: 'physical', targeting: 'all-enemies' });
    expect(a[ids.PENANCE_ROWS.obliteration]!.statusEffects.map((s) => s.status)).toEqual(['slow']);
    expect(a[ids.PENANCE_ROWS.immolation]).toMatchObject({ power: 32, formula: 'strength', damageType: 'physical', targeting: 'single-enemy' });
    expect(a[ids.PENANCE_ROWS.immolation]!.statusEffects.map((s) => s.status)).toEqual(['armor-break', 'mental-break']);
    expect(COMMAND_RECORDS_PENANCE[ids.PENANCE_ROWS.immolation]!.damageClass).toBe(3); // HP and MP
    expect(a[ids.PENANCE_ROWS.judgmentDay]).toMatchObject({ power: 240, formula: 'special-magic', damageType: 'other', targeting: 'all-enemies' });
    expect(COMMAND_RECORDS_PENANCE[ids.PENANCE_ROWS.judgmentDay]!.flagsDamage & 3).toBe(0); // neither physical nor magical: no Protect, Shell or Defense touches it
    expect(a[ids.PENANCE_ROWS.teraGraviton]).toMatchObject({ power: 12, formula: 'percent-total', damageType: 'magical' });
    expect(a[ids.PENANCE_ROWS.teraGraviton]!.statusEffects.map((s) => s.status)).toEqual(['sleep', 'silence', 'darkness', 'slow']);
    expect(COMMAND_RECORDS_PENANCE[ids.PENANCE_ROWS.teraGraviton]!.extra).toBe(0x4000); // Doom
    expect(a[ids.PENANCE_ROWS.mightyGuard]!.statusEffects.map((s) => s.status)).toEqual(['shell', 'protect', 'regen']);
  });

  it('the rows the arms reuse are the same game rows: 0x4127, 0x4104, 0x412B (the Dark Aeons\') and the party\'s Slowga 0x3039', () => {
    for (const [rowId, game] of [[ids.PENANCE_ROWS.armAttack, 0x4127], [ids.PENANCE_ROWS.calamity, 0x4104], [ids.PENANCE_ROWS.dispellingAttack, 0x412b], [ids.PENANCE_ROWS.slowga, 0x3039]] as Array<[string, number]>) {
      expect(ALL_ABILITIES.find((x) => x.id === rowId), rowId).toBeDefined();
      expect(byId(recordsFixture, game), `0x${game.toString(16)}`).toBeDefined();
    }
    expect(PENANCE_ABILITIES[ids.PENANCE_ROWS.armAttack]).toBeUndefined(); // not a new row
    expect(dark('dark-sandy-attack').power).toBe(36);
    expect(dark('dark-cindy-attack').power).toBe(36);
    expect(dark('dark-calamity').power).toBe(0);
  });

  it('the arms\' command lists are the note\'s (RE 3): Attack, Regeneration, Atrophy and their three rows', () => {
    expect(penanceRightArm().abilityIds).toEqual([ids.PENANCE_ROWS.armAttack, ids.PENANCE_ROWS.calamity, ids.PENANCE_ROWS.mightyGuard, ids.PENANCE_ROWS.regeneration, ids.PENANCE_ROWS.atrophy]);
    expect(penanceLeftArm().abilityIds).toEqual([ids.PENANCE_ROWS.dispellingAttack, ids.PENANCE_ROWS.teraGraviton, ids.PENANCE_ROWS.slowga, ids.PENANCE_ROWS.regeneration, ids.PENANCE_ROWS.atrophy]);
  });
});

describe('the chapter is registered hidden, and reachable by its word', () => {
  const chapter = getChapter('penance')!;

  it('number 35, FFX only, experimental; not on the board and not in the listed ids', () => {
    expect(chapter).toBeDefined();
    expect(chapter).toMatchObject({ id: 'penance', game: 'ffx', number: 35, experimental: true, sceneKey: 'penance' });
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain('penance');
    expect((CHAPTER_IDS as readonly string[]).includes('penance')).toBe(false);
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id as string)).toContain('penance');
  });

  it('is built from its own data: the group, the party, the story and the stand-in music', () => {
    expect(chapter.enemyGroupRef).toBe(penanceGroup);
    expect(chapter.buildRef).toBe(penanceBuild);
    expect(chapter.music).toEqual({ scene: 'scene-fahrenheit', battle: 'boss-challenge', victory: 'victory-ffx' });
    expect(chapter.sensorTexts?.['penance']).toBe(penance().sensorText);
  });

  it('has its pause metadata, with the deck\'s plate as the fallback until the pause plate is painted', () => {
    const meta = UNLISTED_CHAPTER_META.find((m) => m.id === 'penance')!;
    expect(meta).toBeDefined();
    expect(meta).toMatchObject({ gameLabel: 'FFX', numeral: 'EXP', heroArt: 'pause/ch35-penance', heroArtFallback: 'backdrops/evrae-airship-deck.png' });
    expect(meta.objectives.map((o) => o.rule.kind)).toEqual(['boss-hp-below', 'boss-hp-below', 'victory']);
  });

  it('has a scene on Chapter VIII\'s plate: the scene key names a backdrop that exists, and the slots stage the three figures', () => {
    expect(backdropFileOf('penance')).toBe('evrae-airship-deck');
    const scene = getScene('penance')!;
    expect(scene.key).toBe('penance');
    expect(scene.slots.enemy).toHaveLength(3);
    expect(Object.keys(scene.slots.enemySpots ?? {}).sort()).toEqual([ids.PENANCE_ID, ids.PENANCE_LEFT_ARM_ID, ids.PENANCE_RIGHT_ARM_ID].sort());
  });

  it('its door is the word `judgment`, last in the table, open on every device', () => {
    const door = CHAPTER_DOORS.find((d) => d.chapter === 'penance')!;
    expect(JUDGMENT_DOOR_WORD).toBe('judgment');
    expect(door.word).toBe('judgment');
    expect(door.gate).toBeUndefined();
    expect(door.secret).toBeUndefined();
  });
});
