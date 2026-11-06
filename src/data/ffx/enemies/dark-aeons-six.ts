/**
 * The six other Dark Aeons' bodies (FFX only; the hidden Dark Aeons chapter, number 34): **Dark Valefor** (m334), **Dark Ifrit** (m335), **Dark Ixion** (m336, two fights), **Dark Shiva** (m337), **Dark Bahamut** (m338) and
 * **Dark Anima** (m339). **Source: the game's own monster files**, `research/re-ffx-dark-aeons-six.md` sections 1 and 4 ("RE six n"; `[bytes]`): every number below is the stat record's or the loot record's, and
 * `tests/unit/chapters/dark-aeons-six-data.test.ts` pins this file to `tests/fixtures/parity/ffx/dark_aeons_six_rows.json` (the records as decoded fields with their offsets) field by field. **There is no stand-in and no
 * number of ours in this file.**
 *
 * ## The records (RE six 1.2)
 *
 * | | Valefor | Ifrit | Ixion (1st / 2nd fight) | Shiva | Bahamut | Anima |
 * |---|---:|---:|---:|---:|---:|---:|
 * | HP | 800,000 | 1,400,000 | 1,200,000 / current 1,300,000 | 1,100,000 | 4,000,000 | 8,000,000 |
 * | STR / DEF / MAG / MDEF | 148 / 120 / 186 / 220 | 220 / 173 / 177 / 163 | 176 / 220 / 133 / 188 (2nd: 182 / 222 / 146 / 198) | 173 / 163 / 244 / 255 | 245 / 234 / 222 / 233 | 155 / 230 / 255 / 255 |
 * | AGI / LCK / EVA / ACC | 105 / 48 / 10 / 250 | 124 / 27 / 8 / 230 | 180 / 36 / 0 / 250 | 255 / 73 / 0 / 250 | 255 / 102 / 0 / 250 | 183 / 85 / 0 / 255 |
 *
 * All six: MP 999; overkill threshold 99,999; **immune** (byte 255) to Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Slow; **Threaten never lands**; Shell, Protect,
 * Reflect, the four Nuls, Regen and Haste all land; immune to Scan, Eject, Auto-Life and Doom (the extra word 0x432F) and by the flag bytes to Sensor, percentage damage, Life, CTB damage and Bribe. **Dark Anima's flag byte
 * (0x5E) adds immunity to magical commands** (the engine's special-word bit 0x40: `immune-to-magical-damage`). Elements: Valefor resists all five; Ifrit absorbs Fire, is immune to Thunder and Water and resists Ice; Ixion
 * absorbs Thunder, is immune to Fire and Ice and resists Water; Shiva absorbs Ice, is immune to Thunder and Water and resists Fire; Bahamut has none; **Anima absorbs Fire, Ice, Thunder and Water**. Nothing is weak to anything.
 * **Zanmato byte 4** on all six (`zanmatoLevel` 5, the data's convention: the byte plus 1).
 *
 * **Dark Ixion's second fight** (RE six 4.3) writes STR 182, DEF 222, MAG 146 and MDEF 198 at set-up (the form's `statOverrides` here, so the data carries them) **and current HP 1,300,000 over the record's maximum 1,200,000**,
 * which the engine's HP setter does not clamp: `battle/ffx/ai/dark-aeons-six-setup.ts` writes that HP when the second fight's battle is built, as the game's own set-up does (`[bytes]`, unproved in play: live check L1). The
 * guides print 1,200,000.
 *
 * ## Rewards (RE six 1.3, each on its own death; the same shape as the Dark Yojimbo and Sisters rows)
 *
 * **No gil.** AP: Valefor 10,000 (15,000 on an Overkill), Ifrit, Ixion and Shiva 20,000 (30,000), Bahamut and Anima 30,000 (40,000). One drop slot that always drops: Dark Matter x1, or one time in eight a Master Sphere x1
 * (x2 of either on an Overkill). Steal (two common, one Elixir rare): Valefor X-Potion, Ifrit Mega Phoenix, Ixion Stamina Tablet, Shiva Mana Tablet, Bahamut Twin Stars, Anima Three Stars. Bribe blocked. **Not modelled:**
 * the gear drop (the weapon rows pool Break Damage Limit, the armour rows Break HP Limit and each aeon's own ability: the loot test pins them), the Pilfer / Nab Gil factor, the Monster Arena price.
 */

import type { EnemyDef, EnemyForm, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import { DARK_ANIMA_ID, DARK_BAHAMUT_ID, DARK_IFRIT_ID, DARK_IXION_2_ID, DARK_IXION_2_STATS, DARK_IXION_ID, DARK_SHIVA_ID, DARK_SIX_SCRIPTS, DARK_VALEFOR_ID } from '../dark-aeons-six-ids.ts';
import { DARK_MEGA_GRAVITON_ID } from './dark-aeons-abilities.ts';
import { DARK_SIX_ROWS as R } from './dark-aeons-six-abilities.ts';

/** Damage in a single killing blow that counts as an Overkill (RE six 1.2: 99,999 in all six). */
export const DARK_SIX_OVERKILL_THRESHOLD = 99_999;
/** The Zanmato resistance byte of all six rows (RE six 1.2: 4). */
export const DARK_SIX_ZANMATO_BYTE = 4;

/** One record: the columns of RE six 1.2's table, `hp mp str def mag mdef agi luck eva acc`. */
type Record10 = readonly [hp: number, mp: number, str: number, def: number, mag: number, mdef: number, agi: number, luck: number, eva: number, acc: number];

/** RE six 1.2 (`[bytes]`). */
export const SIX_RECORDS = {
  valefor: [800_000, 999, 148, 120, 186, 220, 105, 48, 10, 250],
  ifrit: [1_400_000, 999, 220, 173, 177, 163, 124, 27, 8, 230],
  ixion: [1_200_000, 999, 176, 220, 133, 188, 180, 36, 0, 250],
  shiva: [1_100_000, 999, 173, 163, 244, 255, 255, 73, 0, 250],
  bahamut: [4_000_000, 999, 245, 234, 222, 233, 255, 102, 0, 250],
  anima: [8_000_000, 999, 155, 230, 255, 255, 183, 85, 0, 255],
} as const satisfies Record<string, Record10>;

const statsOf = ([hp, mp, str, def, mag, mdef, agi, luck, eva, acc]: Record10): StatBlock => ({ hp, mp, str, def, mag, mdef, agi, luck, eva, acc, maxHp: hp, maxMp: mp });

/** Immune (255) on all six: RE six 1.2 (Death is the `ko` status here); the last four are the extra-immunity word 0x432F. */
const IMMUNE_255: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow',
  'scan', 'eject', 'auto-life', 'doom',
];
const immunities = (): StatusImmunities => Object.fromEntries(IMMUNE_255.map((s) => [s, 255])) as StatusImmunities;

/** The flag bytes' immunities (+0x28 = 0x1E, +0x29 = 0x07). `boss` (Escape and Flee off) is what the formation scripts do for five of the seven; Dark Ixion's two disable nothing (RE six 2.2). */
const FLAGS_BASE: EnemyDef['immunityFlags'] = ['immune-to-percentage-damage', 'immune-to-life', 'immune-to-sensor', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe'];

type Affinities = EnemyDef['affinities'];
/** RE six 1.2: the element row of each record. */
const AFFINITIES: Readonly<Record<string, Affinities>> = {
  valefor: { fire: 'resist', ice: 'resist', lightning: 'resist', water: 'resist', holy: 'resist' },
  ifrit: { fire: 'absorb', lightning: 'immune', water: 'immune', ice: 'resist' },
  ixion: { lightning: 'absorb', fire: 'immune', ice: 'immune', water: 'resist' },
  shiva: { ice: 'absorb', lightning: 'immune', water: 'immune', fire: 'resist' },
  bahamut: {},
  anima: { fire: 'absorb', ice: 'absorb', lightning: 'absorb', water: 'absorb' },
};

/** AP, AP on an Overkill and the Steal pair of each body (RE six 1.3). */
const LOOT = {
  valefor: { ap: 10_000, apOverkill: 15_000, steal: { itemId: 'x-potion' } },
  ifrit: { ap: 20_000, apOverkill: 30_000, steal: { itemId: 'mega-phoenix' } },
  ixion: { ap: 20_000, apOverkill: 30_000, steal: { itemId: 'stamina-tablet' } },
  shiva: { ap: 20_000, apOverkill: 30_000, steal: { itemId: 'mana-tablet' } },
  bahamut: { ap: 30_000, apOverkill: 40_000, steal: { itemId: 'twin-stars' } },
  anima: { ap: 30_000, apOverkill: 40_000, steal: { itemId: 'three-stars' } },
} as const;

function rewards(who: keyof typeof LOOT): EnemyDef['rewards'] {
  const loot = LOOT[who];
  return {
    ap: loot.ap,
    apOverkill: loot.apOverkill,
    gil: 0,
    overkillThreshold: DARK_SIX_OVERKILL_THRESHOLD,
    // ONE drop slot, one item (RE six 1.3): always drops (chance byte 255); a Master Sphere in the Dark Matter's place one time in eight, x2 of either on an Overkill.
    drops: [{ itemId: 'dark-matter', count: 1, rare: { itemId: 'master-sphere', count: 1, chance: 12.5 } }],
    steal: { baseChance: 100, common: { itemId: loot.steal.itemId, count: 2 }, rare: { itemId: 'elixir', count: 1 } }, // the record's chance byte 255, clamped to the contract's 0-100
  };
}

/** Our own words (scan and sensor lines), no number in them. */
const TEXT = {
  valefor: {
    sensor: 'Every blow feeds her fury. End it quickly, or send something else in to take the great blast.',
    scan: 'Valefor, turned dark. She flies fast and strikes at random, but each blow she takes brings her great blast nearer.',
  },
  ifrit: {
    sensor: 'He answers every blow. Fewer, heavier hits serve better than many light ones.',
    scan: 'Ifrit, turned dark. He strikes back at whoever strikes him, and a meteor falls on one of you every turn he takes.',
  },
  ixion: {
    sensor: 'His blade strikes back and can be dodged. Let nothing find you.',
    scan: 'Ixion, turned dark. He answers each blow with a blade that sleeps and breaks, and Aerospark strips your wards.',
  },
  /** The second fight is another script: no answer to a blow, a fury that fills faster (RE six 4.3). */
  ixion2: {
    sensor: 'Your blows draw no answer, but the thunder gathers fast. Send something else in for the hammer.',
    scan: 'Ixion, turned dark, a second time. He strikes at one of you every turn, and his fury fills fast and ends in Thor\'s Hammer.',
  },
  shiva: {
    sensor: 'She is quick. Her cold kiss can kill outright.',
    scan: 'Shiva, turned dark. She acts again and again before you can, and her killing touch comes one turn in three.',
  },
  bahamut: {
    sensor: 'Fortune favours him. Every fifth blow draws a curse on all of you.',
    scan: 'Bahamut, turned dark. He is hard to hit, and every fifth blow you land brings the Impulse down on the whole line.',
  },
  anima: {
    sensor: 'No spell touches her, and the elements feed her. Strike with steel.',
    scan: 'Anima, turned dark. She shrugs off every spell and drinks fire, ice, thunder and water; her Pain is death itself.',
  },
} as const;

interface BodyOpts {
  id: string;
  display: string;
  key: keyof typeof SIX_RECORDS;
  script: string;
  abilityIds: readonly string[];
  /** The two fights of Dark Ixion share one record; the second fight overrides these stats on its form and its HP at set-up. */
  statOverrides?: Partial<StatBlock>;
  /** False for Dark Ixion: his formations disable neither Escape nor Flee, so the files carry no `boss` flag for him. */
  boss?: boolean;
  slot?: number;
  /** The scan and sensor lines when they are not the record key's (the second Dark Ixion fight has its own). */
  text?: keyof typeof TEXT;
  /** The painting's name when it is not the id (Dark Ixion's second fight draws the first fight's painting). */
  sprite?: string;
}

function body(opts: BodyOpts): EnemyDef {
  const stats = statsOf(SIX_RECORDS[opts.key]);
  const text = TEXT[opts.text ?? opts.key];
  const sprite = opts.sprite ?? opts.id;
  const form: EnemyForm = { name: opts.display, spriteKey: sprite, hp: stats.hp, ...(opts.statOverrides !== undefined ? { statOverrides: opts.statOverrides } : {}) };
  return {
    id: opts.id,
    name: opts.display,
    spriteKey: sprite, // the Dark painting `characters/<id>/` (a Dark recolour of the player's aeon, painted at the r76 art install); never the aeon's own
    slot: opts.slot ?? 0,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: { ...AFFINITIES[opts.key] },
    immunities: immunities(),
    immunityFlags: [...(opts.boss === false ? [] : (['boss'] as const)), ...FLAGS_BASE, ...(opts.key === 'anima' ? (['immune-to-magical-damage'] as const) : [])],
    forms: [form],
    aiScriptId: opts.script,
    rewards: rewards(opts.key),
    abilityIds: [...opts.abilityIds],
    flags: { isBoss: true },
    sensorText: text.sensor,
    scanText: text.scan,
    threatenChance: 0,
    zanmatoLevel: DARK_SIX_ZANMATO_BYTE + 1,
  };
}

export const darkValefor = (): EnemyDef => body({ id: DARK_VALEFOR_ID, display: 'Dark Valefor', key: 'valefor', script: DARK_SIX_SCRIPTS.valefor, abilityIds: [R.valeforAttack, R.energyBlast, R.energyRay, R.sonicWings] });
export const darkIfrit = (): EnemyDef => body({ id: DARK_IFRIT_ID, display: 'Dark Ifrit', key: 'ifrit', script: DARK_SIX_SCRIPTS.ifrit, abilityIds: [R.ifritAttack, R.hellfire, R.meteorStrike] });
/** Dark Ixion, first fight (`kami03_70`): the record as it is; Thundaja, Aerospark and his counter. */
export const darkIxion1 = (): EnemyDef => body({ id: DARK_IXION_ID, display: 'Dark Ixion', key: 'ixion', script: DARK_SIX_SCRIPTS['ixion-1'], abilityIds: [R.ixionAttack1, R.aerospark, R.thundaja], boss: false });
/** Dark Ixion, second fight (`kami03_71`): STR 182, DEF 222, MAG 146, MDEF 198 on the form (RE six 4.3); the current HP 1,300,000 is written at set-up (`DARK_IXION_2_CURRENT_HP`). */
export const darkIxion2 = (): EnemyDef =>
  body({ id: DARK_IXION_2_ID, sprite: DARK_IXION_ID, display: 'Dark Ixion', key: 'ixion', text: 'ixion2', script: DARK_SIX_SCRIPTS['ixion-2'], abilityIds: [R.ixionAttack2, R.aerospark, R.thorsHammer], boss: false, statOverrides: { ...DARK_IXION_2_STATS } });
export const darkShiva = (): EnemyDef => body({ id: DARK_SHIVA_ID, display: 'Dark Shiva', key: 'shiva', script: DARK_SIX_SCRIPTS.shiva, abilityIds: [R.shivaAttack, R.heavenlyStrike, R.diamondDust] });
export const darkBahamut = (): EnemyDef => body({ id: DARK_BAHAMUT_ID, display: 'Dark Bahamut', key: 'bahamut', script: DARK_SIX_SCRIPTS.bahamut, abilityIds: [R.ifritAttack, R.megaFlare, R.impulse] });
export const darkAnima = (): EnemyDef => body({ id: DARK_ANIMA_ID, display: 'Dark Anima', key: 'anima', script: DARK_SIX_SCRIPTS.anima, abilityIds: [R.animaAttack, DARK_MEGA_GRAVITON_ID, R.pain, R.oblivion] });

/** Every body of the chapter in link order (the second Ixion last of his pair). */
export const DARK_SIX_BODIES: readonly EnemyDef[] = [darkValefor(), darkIfrit(), darkIxion1(), darkIxion2(), darkShiva(), darkAnima(), darkBahamut()];
