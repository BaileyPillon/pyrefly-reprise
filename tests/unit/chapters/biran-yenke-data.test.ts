/**
 * Biran and Yenke Ronso (the hidden FFX chapter): the data pinned to the game's own files (`research/re-ffx-biran-yenke.md`, "RE section n"), field by field, and the copies the battle layer keeps of the data's
 * ids pinned to the data. **FFX only.** Every number below carries the note's section as its source.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { RAGE_LESSONS } from '../../../src/battle/ffx/ronso-rage.ts';
import * as RULES from '../../../src/battle/ffx/ai/biran-yenke-rules.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { ABILITIES as KIMAHRI_RAGES_1 } from '../../../src/data/ffx/abilities/overdrive-kimahri-1.ts';
import { ABILITIES as KIMAHRI_RAGES_2 } from '../../../src/data/ffx/abilities/overdrive-kimahri-2.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';
import { KIMAHRI_GAUGE_AT_THE_GATE, KIMAHRI_KEEPS_THE_PRESETS_RAGES, buildKimahriTrialParty, kimahriTrialBuild } from '../../../src/data/ffx/builds/kimahri-trial.ts';
import * as IDS from '../../../src/data/ffx/biran-yenke-ids.ts';
import { BIRAN_YENKE_ABILITIES } from '../../../src/data/ffx/enemies/biran-yenke-abilities.ts';
import { OVERKILL_THRESHOLD, RECORD, biran, biranYenkeGroup, yenke } from '../../../src/data/ffx/enemies/biran-yenke.ts';

const ability = (id: string) => ALL_ABILITIES.find((a) => a.id === id);

describe('the two monster records (RE section 2)', () => {
  it('carry the records\' own numbers, the placeholders the battle\'s opening overwrites: HP 9,999, MP 200, STR 25, DEF 30, MAG 30, MDF 10, AGI 32, LCK 15, EVA 0, ACC 100', () => {
    expect(RECORD).toEqual({ hp: 9_999, mp: 200, str: 25, def: 30, mag: 30, mdef: 10, agi: 32, luck: 15, eva: 0, acc: 100 });
    for (const b of [biran, yenke]) {
      expect(b.stats).toEqual({ ...RECORD, maxHp: 9_999, maxMp: 200 });
      expect([b.hp, b.mp]).toEqual([9_999, 200]);
      expect(b.affinities).toEqual({}); // no elemental absorb, immune, resist or weak (+0x2B to +0x2E)
    }
    expect(OVERKILL_THRESHOLD).toBe(2_500);
  });

  it('are immune (255) to Death, Zombie, Petrify, Poison, Confuse, Provoke, Sleep, Silence, Darkness, Reflect and Slow, and to Eject and Auto-Life; Biran can be Berserked and Yenke is immune', () => {
    const immune = ['ko', 'zombie', 'petrify', 'poison', 'confuse', 'provoke', 'sleep', 'silence', 'darkness', 'reflect', 'slow', 'eject', 'auto-life'] as const;
    for (const b of [biran, yenke]) for (const s of immune) expect(b.immunities[s], `${b.id} ${s}`).toBe(255);
    expect(biran.immunities['berserk']).toBeUndefined(); // byte 0: lands
    expect(yenke.immunities['berserk']).toBe(255);
  });

  it('let the four Breaks, Shell, Protect, the four Nuls, Regen and Haste land (byte 0), and Doom (no immunity listed)', () => {
    const lands = ['power-break', 'magic-break', 'armor-break', 'mental-break', 'shell', 'protect', 'nultide', 'nulblaze', 'nulshock', 'nulfrost', 'regen', 'haste', 'doom'] as const;
    for (const b of [biran, yenke]) for (const s of lands) expect(b.immunities[s], `${b.id} ${s}`).toBeUndefined();
  });

  it('are immune to Life, to CTB damage and to Bribe, are bosses (the formation disables Escape and Flee), cannot be Threatened and carry the Doom counter 20', () => {
    for (const b of [biran, yenke]) {
      expect(b.immunityFlags).toEqual(expect.arrayContaining(['immune-to-life', 'immune-to-delay', 'immune-to-bribe', 'boss']));
      expect(b.threatenChance).toBe(0); // the byte is a success percentage and it is 0
      expect(b.doomTurns).toBe(20);
      expect(b.zanmatoLevel).toBe(4); // the Zanmato byte 3
      expect(b.flags.isBoss).toBe(true);
      expect(b.flags.isPart).toBeUndefined();
    }
  });

  it('pay each on his own death 1,500 gil, 4,500 AP (6,750 on an Overkill), a Return Sphere x1 or one time in eight a Friend Sphere x1, a Lv. 3 Key Sphere to steal (rare x2) and block Bribe', () => {
    for (const b of [biran, yenke]) {
      expect(b.rewards).toMatchObject({ ap: 4_500, apOverkill: 6_750, gil: 1_500, overkillThreshold: 2_500 });
      // ONE drop slot, one item: the Return Sphere, or in its place one time in eight the Friend Sphere (the loot record's common and rare item; `tests/unit/chapters/biran-yenke-rewards.test.ts` plays it out).
      expect(b.rewards.drops).toEqual([{ itemId: 'return-sphere', count: 1, rare: { itemId: 'friend-sphere', count: 1, chance: 12.5 } }]);
      expect(b.rewards.steal).toEqual({ baseChance: 100, common: { itemId: 'lv-3-key-sphere', count: 1 }, rare: { itemId: 'lv-3-key-sphere', count: 2 } });
      expect(b.rewards.bribe).toEqual({ item: { itemId: 'potion', count: 1 }, immune: true });
      for (const id of [...b.rewards.drops.flatMap((d) => [d.itemId, ...(d.rare ? [d.rare.itemId] : [])]), b.rewards.steal!.common.itemId, b.rewards.bribe!.item.itemId]) expect(ITEMS[id], `${id} is an item`).toBeDefined();
    }
  });

  it('are two enemies of one formation, Biran in slot 0 and Yenke in slot 1, with no part, Escape and Flee off and the generic boss cue', () => {
    expect(ENEMY_GROUPS_BY_ID['biran-yenke-duel']).toBe(biranYenkeGroup);
    expect(biranYenkeGroup).toMatchObject({ id: 'biran-yenke-duel', game: 'ffx', canEscape: false, bossId: 'biran-ronso', headline: 'Biran and Yenke' });
    expect(biranYenkeGroup.enemies.map((e) => [e.id, e.slot])).toEqual([['biran-ronso', 0], ['yenke-ronso', 1]]);
    expect(biranYenkeGroup.parts).toBeUndefined();
    expect(biranYenkeGroup.nextGroupId).toBeUndefined();
    expect(biranYenkeGroup.musicCues).toEqual([{ at: 'start', track: 'boss-challenge', fadeMs: 1200 }]);
    expect(biran.aiScriptId).toBe('biran-ronso');
    expect(yenke.aiScriptId).toBe('yenke-ronso');
  });
});

describe("the move rows (RE section 6)", () => {
  it("Bulldoze is physical, formula 1, power 16, can crit, rank 3, and NEVER MISSES (accuracy formula 0: AGENTS.md rule 5); it swaps the user's side", () => {
    const b = BIRAN_YENKE_ABILITIES['ronso-bulldoze']!;
    expect(b).toMatchObject({ id: 'ronso-bulldoze', name: 'Bulldoze', category: 'enemy', rank: 3, power: 16, formula: 'strength', damageType: 'physical', targeting: 'single-enemy', hits: 1, canMiss: false });
    expect(b.flags).toContain('crit-eligible');
    expect(b.extra?.['swapsSide']).toBe(true);
    expect(ability('ronso-bulldoze')).toBe(b); // registered with the rest
  });

  it("Fire Breath and Aqua Breath are neither physical nor magical, formula 3, power 16, one enemy, rank 3, never miss; Fire and Water", () => {
    for (const [id, element] of [['ronso-fire-breath', 'fire'], ['ronso-aqua-breath', 'water']] as const) {
      const a = BIRAN_YENKE_ABILITIES[id]!;
      expect(a).toMatchObject({ rank: 3, power: 16, formula: 'magic', damageType: 'other', targeting: 'single-enemy', canMiss: false, element: [element] });
      expect(ability(id)).toBe(a);
    }
  });

  it("Berserk is Biran's own, on himself: chance 120 against his byte of 0, rank 3, no damage", () => {
    const a = BIRAN_YENKE_ABILITIES['ronso-berserk']!;
    expect(a).toMatchObject({ rank: 3, power: 0, formula: 'none', targeting: 'self', statusEffects: [{ status: 'berserk', chance: 120, duration: 254 }] });
  });

  it("the half-HP Rages are Kimahri's own rows performed by a monster (the same numbers), naming their own group, with no Rage picker", () => {
    const pairs = [['biran-mighty-guard', KIMAHRI_RAGES_2['mighty-guard']!], ['yenke-white-wind', KIMAHRI_RAGES_2['white-wind']!]] as const;
    for (const [id, rage] of pairs) {
      const a = BIRAN_YENKE_ABILITIES[id]!;
      expect(a).toMatchObject({ category: 'enemy', rank: rage.rank, power: rage.power, formula: rage.formula, targeting: 'all-allies', statusEffects: rage.statusEffects, flags: rage.flags });
      expect(a.minigame).toBeUndefined();
      expect(a.extra?.['groupTarget']).toBe(true);
    }
    expect(BIRAN_YENKE_ABILITIES['biran-mighty-guard']).toMatchObject({ rank: 4, power: 0 }); // Shell and Protect 254, the four Nuls with one charge each
    expect(BIRAN_YENKE_ABILITIES['yenke-white-wind']).toMatchObject({ rank: 3, power: 40, formula: 'healing' });
    expect(KIMAHRI_RAGES_2['mighty-guard']!.category).toBe('overdrive'); // Kimahri's own rows are untouched
  });

  it('the scripts borrow three party rows that exist: Thunder, Blizzard and Haste', () => {
    for (const id of ['thunder', 'blizzard', 'haste']) expect(ability(id), id).toBeDefined();
    expect([biran.abilityIds, yenke.abilityIds]).toEqual([
      ['thunder', 'blizzard', 'ronso-bulldoze', 'biran-mighty-guard', 'ronso-berserk'],
      ['ronso-fire-breath', 'ronso-aqua-breath', 'ronso-bulldoze', 'yenke-white-wind', 'haste'],
    ]);
    for (const id of [...biran.abilityIds, ...yenke.abilityIds]) expect(ability(id), id).toBeDefined();
  });
});

describe('the Ronso Rage lessons (RE section 7)', () => {
  it("lists Biran's Mighty Guard (only after his own), Thrust Kick, Self-Destruct, Doom and Yenke's White Wind (only after his own), Fire Breath, Aqua Breath, Stone Breath, in that order", () => {
    expect(RAGE_LESSONS['biran-ronso']).toEqual([
      { rage: 'mighty-guard', afterQueued: true }, { rage: 'thrust-kick', afterQueued: false }, { rage: 'self-destruct', afterQueued: false }, { rage: 'doom', afterQueued: false },
    ]);
    expect(RAGE_LESSONS['yenke-ronso']).toEqual([
      { rage: 'white-wind', afterQueued: true }, { rage: 'fire-breath', afterQueued: false }, { rage: 'aqua-breath', afterQueued: false }, { rage: 'stone-breath', afterQueued: false },
    ]);
    expect(Object.keys(RAGE_LESSONS).sort()).toEqual(['biran-ronso', 'yenke-ronso']); // nobody else teaches anything
  });

  it("every lesson is one of Kimahri's twelve Rage rows, an Overdrive-class row that exists", () => {
    const rows = { ...KIMAHRI_RAGES_1, ...KIMAHRI_RAGES_2 };
    for (const lessons of Object.values(RAGE_LESSONS)) for (const l of lessons) expect(rows[l.rage]?.category, l.rage).toBe('overdrive');
  });
});

describe("the battle layer's copies of the data's ids agree with the data (it does not import src/data)", () => {
  it('combatant, script and move ids', () => {
    expect([RULES.BIRAN_ID, RULES.YENKE_ID, RULES.KIMAHRI_ID]).toEqual([IDS.BIRAN_ID, IDS.YENKE_ID, IDS.KIMAHRI_ID]);
    expect([RULES.BIRAN_SCRIPT, RULES.YENKE_SCRIPT]).toEqual([IDS.BIRAN_SCRIPT, IDS.YENKE_SCRIPT]);
    expect([biran.aiScriptId, yenke.aiScriptId]).toEqual([RULES.BIRAN_SCRIPT, RULES.YENKE_SCRIPT]);
    expect([RULES.BULLDOZE, RULES.FIRE_BREATH, RULES.AQUA_BREATH, RULES.BERSERK_SELF, RULES.BIRAN_MIGHTY_GUARD, RULES.YENKE_WHITE_WIND]).toEqual(Object.keys(BIRAN_YENKE_ABILITIES));
    expect(Object.keys(RAGE_LESSONS)).toEqual([IDS.BIRAN_ID, IDS.YENKE_ID]);
    expect(Object.values(RULES.OWN_RAGE).map((r) => r.move)).toEqual([IDS.BIRAN_ID, IDS.YENKE_ID].map((id) => (id === IDS.BIRAN_ID ? 'biran-mighty-guard' : 'yenke-white-wind')));
    expect(RULES.BASE_DEF).toBe(RECORD.def); // the swap's release puts Defense back to the record's 30
    expect(RULES.GUARD_DEF).toBe(254);
  });

  it("the cycles name rows that exist: Biran Thunder, Bulldoze, Blizzard, Bulldoze; Yenke Fire Breath, Aqua Breath, Bulldoze", () => {
    expect(RULES.CYCLE['biran-ronso']).toEqual(['thunder', 'ronso-bulldoze', 'blizzard', 'ronso-bulldoze']);
    expect(RULES.CYCLE['yenke-ronso']).toEqual(['ronso-fire-breath', 'ronso-aqua-breath', 'ronso-bulldoze']);
    for (const steps of Object.values(RULES.CYCLE)) for (const id of steps) expect(ability(id), id).toBeDefined();
  });
});

describe("the party: Kimahri alone, Chapter I's preset with what this duel teaches taken off", () => {
  const preset = gagazetBuild.members.find((m) => m.id === 'kimahri')!;
  const k = kimahriTrialBuild.members[0]!;

  it('is one member, no bench, no aeon: Escape, Flee and Switch have nothing to act on', () => {
    expect(kimahriTrialBuild.members.map((m) => m.id)).toEqual(['kimahri']);
    expect(kimahriTrialBuild.activeSlots).toEqual(['kimahri']);
    expect(kimahriTrialBuild.reserve).toEqual([]);
    expect(kimahriTrialBuild.aeons).toEqual([]);
    expect(kimahriTrialBuild.game).toBe('ffx');
  });

  it("keeps Chapter I's numbers (STR 26, MAG 22, AGI 18, HP 2,310) and his Lancet and Jump", () => {
    expect(k.stats).toEqual(preset.stats);
    expect(k.hp).toBe(preset.hp);
    expect(k.equipment).toEqual(preset.equipment);
    expect(k.learnedAbilityIds).toEqual(expect.arrayContaining(['lancet', 'jump']));
  });

  it("starts WITHOUT the three Rages this duel teaches (Mighty Guard, White Wind, Self-Destruct) and without Seymour Flux's Talk, keeping Jump, with the gauge of a Kimahri who has learned nothing fresh (45)", () => {
    expect(KIMAHRI_KEEPS_THE_PRESETS_RAGES).toBe(false);
    expect(k.overdrive!.unlockedOverdriveIds).toEqual(['jump']);
    for (const id of ['mighty-guard', 'white-wind', 'self-destruct', 'talk']) expect(k.learnedAbilityIds).not.toContain(id);
    expect(k.overdrive!.gauge).toBe(KIMAHRI_GAUGE_AT_THE_GATE);
    expect(KIMAHRI_GAUGE_AT_THE_GATE).toBe(45);
    expect(preset.overdrive!.unlockedOverdriveIds).toEqual(['jump', 'mighty-guard', 'white-wind']); // the preset is the post-duel Kimahri
  });

  it("the one switch puts the preset's Rages back (Jump, Mighty Guard, White Wind; gauge 100), and nothing else changes", () => {
    const kept = buildKimahriTrialParty(true).members[0]!;
    expect(kept.overdrive!.unlockedOverdriveIds).toEqual(['jump', 'mighty-guard', 'white-wind']);
    expect(kept.overdrive!.gauge).toBe(100);
    expect(kept.stats).toEqual(k.stats);
  });

  it("leaves the mountain's pickups behind: two Mega-Potions and 20,000 gil are found on the trail after the duel", () => {
    const mega = (b: { inventory: ReadonlyArray<{ itemId: string; count: number }> }) => b.inventory.find((e) => e.itemId === 'mega-potion')?.count ?? 0;
    expect(mega(kimahriTrialBuild)).toBe(mega(gagazetBuild) - 2);
    expect(kimahriTrialBuild.gil).toBe(gagazetBuild.gil - 20_000);
  });
});

describe('the research fix of the same pass', () => {
  it("ffx-combat-core section 5.8's White Wind row lists Yenke among its teachers (the note, section 8)", () => {
    const text = readFileSync(new URL('../../../research/ffx-combat-core.md', import.meta.url), 'utf8');
    const line = text.split(/\r?\n/).find((l) => l.startsWith('| White Wind | 112'));
    expect(line, 'the row exists').toBeDefined();
    expect(line).toContain('Yenke Ronso');
  });
});
