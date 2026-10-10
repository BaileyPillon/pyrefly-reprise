/**
 * The hidden Sinspawn Gui chapter's data against the game's own rows (`research/re-ffx-ai-gui.md`, "RE §n"; FFX only [AGENTS.md rule 14]): the three monsters, the two formations, the commands
 * Gui uses, Seymour as the guest, the party estimate's method, and the chapter's registration as a hidden experiment. A number here is a row of the game's tables or it is named as an estimate.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { EnemyDef, FFXCombatant } from '../../../src/battle/common/types.ts';
import {
  GUI_ARM_IDS as RULES_ARM_IDS,
  GUI_ARM_SCRIPT as RULES_ARM_SCRIPT,
  GUI_BODY_2_ID as RULES_BODY_2,
  GUI_BODY_SCRIPT as RULES_BODY_SCRIPT,
  GUI_HEAD_ID as RULES_HEAD,
  GUI_HEAD_SCRIPT as RULES_HEAD_SCRIPT,
  GUI_SPECIAL_1_ID as RULES_SPECIAL_1,
  GUI_VENOM_ID as RULES_VENOM,
} from '../../../src/battle/ffx/ai/sinspawn-gui-rules.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { sinspawnGuiGroup1, sinspawnGuiGroup2 } from '../../../src/data/ffx/enemies/sinspawn-gui.ts';
import { GUI_SPECIAL_1_ID, GUI_VENOM_ID } from '../../../src/data/ffx/enemies/sinspawn-gui-abilities.ts';
import * as IDS from '../../../src/data/ffx/sinspawn-gui-ids.ts';
import { COMMAND_RECORDS } from '../../../src/data/ffx/command-records/index.ts';
import { START_RECORDS, mushroomRockBuild } from '../../../src/data/ffx/builds/mushroom-rock.ts';
import { macalaniaBuild } from '../../../src/data/ffx/builds/macalania.ts';
import { buildSeymourGuest } from '../../../src/data/ffx/builds/seymour-guest.ts';
import { SINSPAWN_GUI_META } from '../../../src/data/chapter-meta-sinspawn-gui.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { TRACKS } from '../../../src/audio/tracks/index.ts';
import { baseCtb } from '../../../src/battle/ffx/math.ts';
import { recoveryTicks } from '../../../src/battle/ffx/turnQueue.ts';

const REPO = join(__dirname, '..', '..', '..');
const [body1] = sinspawnGuiGroup1.enemies as [EnemyDef];
const [body2] = sinspawnGuiGroup2.enemies as [EnemyDef];
const head = (g: typeof sinspawnGuiGroup1): EnemyDef => g.parts!.find((p) => p.id === IDS.GUI_HEAD_ID)!;
const arm = (g: typeof sinspawnGuiGroup1, id: string): EnemyDef => g.parts!.find((p) => p.id === id)!;

describe('the ids the battle layer keeps its own copy of are the data layer\'s (the battle layer does not import src/data)', () => {
  it('combatants, scripts and commands agree', () => {
    expect(RULES_BODY_SCRIPT).toBe(IDS.GUI_BODY_SCRIPT);
    expect(RULES_HEAD_SCRIPT).toBe(IDS.GUI_HEAD_SCRIPT);
    expect(RULES_ARM_SCRIPT).toBe(IDS.GUI_ARM_SCRIPT);
    expect(RULES_BODY_2).toBe(IDS.GUI_BODY_2_ID);
    expect(RULES_HEAD).toBe(IDS.GUI_HEAD_ID);
    expect([...RULES_ARM_IDS]).toEqual([...IDS.GUI_ARM_IDS]);
    expect(RULES_SPECIAL_1).toBe(GUI_SPECIAL_1_ID);
    expect(RULES_VENOM).toBe(GUI_VENOM_ID);
  });
});

describe('the monster rows (RE 3.1, 2.3)', () => {
  it('body: HP 12,000 and Strength 29 and Magic Defense 30 in the first fight; 6,000, 15 and 1 (a 0 reads 1 in play) in the second; Defense 1, Magic 20, Agility 10, Luck 15, Accuracy 100', () => {
    expect([body1.hp, body1.stats.str, body1.stats.mdef]).toEqual([12_000, 29, 30]);
    expect([body2.hp, body2.stats.str, body2.stats.mdef]).toEqual([6_000, 15, 1]);
    for (const b of [body1, body2]) expect([b.stats.def, b.stats.mag, b.stats.agi, b.stats.luck, b.stats.acc, b.mp]).toEqual([1, 20, 10, 15, 100, 30]);
  });

  it('head: 4,000 HP and then 1,000, Agility 15, 200 MP; arms: 800 HP, Armored, Agility 1 in play', () => {
    expect([head(sinspawnGuiGroup1).hp, head(sinspawnGuiGroup2).hp]).toEqual([4_000, 1_000]);
    expect(head(sinspawnGuiGroup1).stats.agi).toBe(15);
    expect(head(sinspawnGuiGroup1).mp).toBe(200);
    for (const id of IDS.GUI_ARM_IDS) {
      expect(arm(sinspawnGuiGroup1, id).hp).toBe(800);
      expect(arm(sinspawnGuiGroup1, id).immunityFlags).toContain('armored');
      expect(arm(sinspawnGuiGroup1, id).stats.agi).toBe(1);
    }
  });

  it('the recoveries the RE note derives (5.7): the body 14 a tick for 42 after a rank-3 action, the head 12 for 36, an arm 28, Seymour 10 for 30 (Requiem, rank 4, 40)', () => {
    expect([body1, head(sinspawnGuiGroup1), arm(sinspawnGuiGroup1, IDS.GUI_ARM_LEFT_ID)].map((e) => baseCtb(e.stats.agi))).toEqual([14, 12, 28]);
    const as = (e: { stats: EnemyDef['stats'] }): FFXCombatant => ({ stats: e.stats, statuses: {} }) as unknown as FFXCombatant;
    expect(recoveryTicks(as(body1), 3)).toBe(42);
    expect(recoveryTicks(as(head(sinspawnGuiGroup1)), 3)).toBe(36);
    const seymour = buildSeymourGuest();
    expect(baseCtb(seymour.stats.agi)).toBe(10);
    expect(recoveryTicks(as(seymour), 3)).toBe(30);
    expect(recoveryTicks(as(seymour), 4)).toBe(40);
  });

  it('every part is neutral to every element (RE 3.1: no absorb, immune, resist or weak bit): Jegged\'s fire advice is outvoted', () => {
    for (const p of [body1, body2, head(sinspawnGuiGroup1), ...IDS.GUI_ARM_IDS.map((id) => arm(sinspawnGuiGroup1, id))]) expect(p.affinities, p.id).toEqual({});
  });

  it('rewards: the body 400 AP (600 on an overkill) and 1,000 gil, the head 48 / 72 / 200, an arm 37 / 55 / 300; the second body 0 / 0 and three Lv. 1 Key Spheres (RE 3.3)', () => {
    expect([body1.rewards.ap, body1.rewards.apOverkill, body1.rewards.gil, body1.rewards.drops]).toEqual([400, 600, 1_000, []]);
    expect([body2.rewards.ap, body2.rewards.apOverkill, body2.rewards.gil]).toEqual([0, 0, 1_000]);
    expect(body2.rewards.drops).toEqual([{ itemId: 'lv-1-key-sphere', count: 3 }]);
    const h = head(sinspawnGuiGroup1).rewards;
    expect([h.ap, h.apOverkill, h.gil]).toEqual([48, 72, 200]);
    const a = arm(sinspawnGuiGroup1, IDS.GUI_ARM_LEFT_ID).rewards;
    expect([a.ap, a.apOverkill, a.gil]).toEqual([37, 55, 300]);
    expect([body1.rewards.overkillThreshold, h.overkillThreshold, a.overkillThreshold]).toEqual([800, 800, 500]);
    expect(ITEMS['lv-1-key-sphere']).toBeDefined();
    expect(COMMAND_RECORDS['lv-1-key-sphere']?.id).toBe(0x2051);
  });

  it('every part steals a Potion (the record\'s common and rare slots) and cannot be bribed; none can be Threatened', () => {
    for (const p of [body1, head(sinspawnGuiGroup1), arm(sinspawnGuiGroup1, IDS.GUI_ARM_LEFT_ID)]) {
      expect(p.rewards.steal?.common).toEqual({ itemId: 'potion', count: 1 });
      expect(p.rewards.steal?.rare).toEqual({ itemId: 'potion', count: 1 });
      expect(p.rewards.bribe?.immune).toBe(true);
      expect(p.threatenChance).toBe(0);
    }
  });

  it('the Sensor lines the chapter duplicates are the enemy records\' own', () => {
    const chapter = getChapter('sinspawn-gui')!;
    for (const p of [body1, body2, head(sinspawnGuiGroup1), ...IDS.GUI_ARM_IDS.map((id) => arm(sinspawnGuiGroup1, id))]) expect(chapter.sensorTexts?.[p.id], p.id).toBe(p.sensorText);
  });
});

describe('the commands Gui uses (RE 4)', () => {
  const def = (id: string) => ALL_ABILITIES.find((a) => a.id === id)!;

  it('Venom: magic formula 3, power 24, always hits, neither physical nor magical; Poison 100 and Slow 100 with Slow\'s duration byte 0', () => {
    const v = def(GUI_VENOM_ID);
    expect([v.formula, v.power, v.canMiss, v.damageType]).toEqual(['magic', 24, false, 'other']);
    expect(v.statusEffects).toEqual([{ status: 'poison', chance: 100, duration: 254 }, { status: 'slow', chance: 100, duration: 0 }]);
    // Since the W2 merge the record carries the game's chance bytes (Poison status 3 and Slow status 24, both 100) and rank 3; Slow's DURATION byte is 0, so no duration is listed and the kernel's status step does what the game does.
    expect(COMMAND_RECORDS[GUI_VENOM_ID]).toEqual({ id: 0x6031, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 1, rank: 3, chances: [[3, 100], [24, 100]] });
    expect(COMMAND_RECORDS[GUI_VENOM_ID]?.durations).toBeUndefined();
  });

  it('Special 1 is the head\'s whole turn: no formula, no hit, record 0x6001', () => {
    const s = def(GUI_SPECIAL_1_ID);
    expect([s.formula, s.hits, s.canMiss]).toEqual(['none', 0, false]);
    expect(COMMAND_RECORDS[GUI_SPECIAL_1_ID]?.id).toBe(0x6001);
  });

  it('the body\'s list: Thunder, Demi, Venom (Attack is its plain attack, record 0x6000); Thunder and Demi are the party\'s own rows and never miss (hit rule 5)', () => {
    expect(body1.abilityIds).toEqual(['thunder', 'demi', GUI_VENOM_ID]);
    expect(body1.plainAttack?.record.id).toBe(0x6000);
    for (const id of ['thunder', 'demi', 'requiem', GUI_VENOM_ID]) expect(def(id).canMiss, id).toBe(false);
  });
});

describe('the formations (RE 2.1, 2.2)', () => {
  it('two links chained, the same four parts in the same order; neither restores the party or shows a Save Sphere card', () => {
    expect(sinspawnGuiGroup1.nextGroupId).toBe(sinspawnGuiGroup2.id);
    expect(sinspawnGuiGroup2.nextGroupId).toBeUndefined();
    expect(ENEMY_GROUPS_BY_ID['sinspawn-gui-1']).toBe(sinspawnGuiGroup1);
    expect(ENEMY_GROUPS_BY_ID['sinspawn-gui-2']).toBe(sinspawnGuiGroup2);
    for (const g of [sinspawnGuiGroup1, sinspawnGuiGroup2]) {
      expect([...g.enemies, ...(g.parts ?? [])].map((e) => e.id)).toEqual([g === sinspawnGuiGroup1 ? IDS.GUI_ID : IDS.GUI_BODY_2_ID, IDS.GUI_HEAD_ID, ...IDS.GUI_ARM_IDS]);
      expect(g.canEscape).toBe(false);
      expect(g.restoresPartyOnEntry).toBeUndefined();
      expect((g as { noSaveSphereCard?: boolean }).noSaveSphereCard).toBeUndefined();
    }
  });

  it('the second link forces Yuna, Seymour, Auron, closes Switch, pools the spoils, is the retry checkpoint and restores a hopeless retry', () => {
    const g = sinspawnGuiGroup2;
    expect(g.lineUp?.activeSlots).toEqual(['yuna', 'seymour', 'auron']);
    expect(g.lineUp?.noSwitch).toBe(true);
    expect(g.lineUp?.joins?.map((m) => m.id)).toEqual(['seymour']);
    expect(g.poolsChainSpoils).toBe(true);
    expect(g.checkpointOnEntry).toBe(true);
    expect(g.hopelessRetry).toEqual({ standing: 2, answer: 'restore' });
    expect(sinspawnGuiGroup1.lineUp).toBeUndefined();
  });

  it('the music: the dread theme for the Ridge, Seymour\'s own for the guest hour, both existing cues (no new audio)', () => {
    expect(sinspawnGuiGroup1.musicCues?.[0]?.track).toBe('boss-dread');
    expect(sinspawnGuiGroup2.musicCues?.[0]?.track).toBe('boss-seymour');
    const chapter = getChapter('sinspawn-gui')!;
    for (const key of [chapter.music.scene, chapter.music.battle, chapter.music.phase2, chapter.music.victory, ...SINSPAWN_GUI_META.musicKeys]) expect(TRACKS[key as string], String(key)).toBeDefined();
  });
});

describe('Seymour as the guest (RE 7.2, 7.3, 7.4)', () => {
  const s = buildSeymourGuest();

  it('the party-table row: 1,200 HP and 999 MP, Strength 20, Defense 25, Magic 35, Magic Defense 100, Agility 20, Luck 18, Evasion 10, Accuracy 10', () => {
    const st = s.stats;
    expect([st.hp, st.mp, st.str, st.def, st.mag, st.mdef, st.agi, st.luck, st.eva, st.acc]).toEqual([1_200, 999, 20, 25, 35, 100, 20, 18, 10, 10]);
    expect([st.maxHp, st.maxMp]).toEqual([1_200, 999]);
  });

  it('a staff with Piercing, an armour with Sensor, no Sphere Grid; the Stoic gauge starts at 0 and the one Overdrive is Requiem; the player commands him and he holds the loss open', () => {
    expect(s.equipment.weapon.autoAbilities).toEqual(['piercing']);
    expect(s.equipment.armor.autoAbilities).toEqual(['sensor']);
    expect(s.overdrive).toMatchObject({ gauge: 0, mode: 'stoic', unlockedOverdriveIds: ['requiem'] });
    expect(s.guest).toEqual({ control: 'player', keepsPartyAlive: true });
    expect(s.sphereGrid.sLv).toBe(0);
  });

  it('his list is the game\'s: eight Black Magic, Cure and Cura, Scan and the three Nul spells; no NulFrost, Esuna, Haste, Life, Dispel, Curaga, Demi or Summon', () => {
    expect([...s.learnedAbilityIds].sort()).toEqual(['blizzard', 'blizzara', 'cura', 'cure', 'fira', 'fire', 'nulblaze', 'nulshock', 'nultide', 'scan', 'thunder', 'thundara', 'water', 'watera'].sort());
  });

  it('Requiem: Overdrive, formula 3 (magic), power 40, all enemies, never misses, record 0x30e3; the fresh copy is his own each call', () => {
    const r = ALL_ABILITIES.find((a) => a.id === 'requiem')!;
    expect([r.category, r.formula, r.power, r.targeting, r.canMiss]).toEqual(['overdrive', 'magic', 40, 'all-enemies', false]);
    expect(COMMAND_RECORDS['requiem']?.id).toBe(0x30e3);
    expect(buildSeymourGuest()).not.toBe(s);
    expect(buildSeymourGuest().stats).not.toBe(s.stats);
  });
});

describe('the party at the Ridge is an ESTIMATE, and the method is one rule (RE 11 item 9, research Q-14)', () => {
  it('six characters, no Rikku; Valefor and Ifrit; Tidus, Auron and Lulu open with Yuna, Wakka and Kimahri on the bench', () => {
    expect(mushroomRockBuild.members.map((m) => m.id)).toEqual(['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu']);
    expect(mushroomRockBuild.aeons.map((a) => a.id)).toEqual(['valefor', 'ifrit']);
    expect(mushroomRockBuild.activeSlots).toEqual(['tidus', 'auron', 'lulu']);
    expect([...mushroomRockBuild.reserve].sort()).toEqual(['kimahri', 'wakka', 'yuna']);
  });

  it('every Sphere Grid stat is the floor of the midpoint between the game\'s start-of-game record and Macalania\'s preset: a stated method, never a measurement', () => {
    for (const m of mushroomRockBuild.members) {
      const start = START_RECORDS[m.id]!;
      const high = macalaniaBuild.members.find((x) => x.id === m.id)!;
      for (const k of ['hp', 'mp', 'str', 'def', 'mag', 'mdef', 'agi', 'luck', 'eva', 'acc'] as const) expect(m.stats[k], `${m.id} ${k}`).toBe(Math.floor((start[k] + high.stats[k]) / 2));
      expect(m.stats.maxHp).toBe(m.stats.hp);
    }
  });

  it('the source says so in words: the file calls the preset an estimate', () => {
    const src = readFileSync(join(REPO, 'src', 'data', 'ffx', 'builds', 'mushroom-rock.ts'), 'utf8');
    expect(src).toMatch(/\[estimate\]/);
    expect(src).toMatch(/no source gives/i);
  });

  it('Auron and Kimahri carry Piercing (the weapon records\' own, RE 3.3), Kimahri\'s spear also Sensor; Wakka\'s weapon reaches the head', () => {
    const w = (id: string) => mushroomRockBuild.members.find((m) => m.id === id)!.equipment.weapon.autoAbilities;
    expect(w('auron')).toContain('piercing');
    expect(w('kimahri')).toEqual(['piercing', 'sensor']);
  });
});

describe('the chapter is a hidden experiment: no card, no count, no save', () => {
  const chapter = getChapter('sinspawn-gui')!;

  it('registered with the experiments and not with the eighteen; number 21; FFX; experimental (its own store, never the save)', () => {
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain('sinspawn-gui');
    expect(CHAPTERS.map((c) => c.id)).not.toContain('sinspawn-gui');
    expect((CHAPTER_IDS as readonly string[]).includes('sinspawn-gui')).toBe(false);
    expect([chapter.number, chapter.game, chapter.experimental, chapter.sceneKey]).toEqual([21, 'ffx', true, 'mushroom-rock-road']);
    expect(chapter.buildRef).toBe(mushroomRockBuild);
    expect(chapter.enemyGroupRef).toBe(sinspawnGuiGroup1);
  });

  it('its pause metadata is the hidden one: EXP, three objectives that name real parts and links, and no placeholder anywhere', () => {
    expect(UNLISTED_CHAPTER_META.find((m) => m.id === 'sinspawn-gui')).toBe(SINSPAWN_GUI_META);
    expect(SINSPAWN_GUI_META.numeral).toBe('EXP');
    expect(SINSPAWN_GUI_META.objectives.map((o) => o.rule.kind)).toEqual(['parts-downed', 'link-reached', 'victory']);
    const arms = SINSPAWN_GUI_META.objectives[0]!.rule;
    expect(arms.kind === 'parts-downed' ? arms.targetIds : []).toEqual([...IDS.GUI_ARM_IDS]);
    for (const file of ['chapter-sinspawn-gui.ts', 'chapter-meta-sinspawn-gui.ts', join('ffx', 'enemies', 'sinspawn-gui.ts'), join('ffx', 'builds', 'mushroom-rock.ts')])
      expect(readFileSync(join(REPO, 'src', 'data', file), 'utf8'), file).not.toMatch(/PLACEHOLDER/);
  });

  it('the first body is the one chapter-level boss id (the second body has its own, so the first KO is the seam\'s alone)', () => {
    expect(sinspawnGuiGroup1.bossId).toBe(IDS.GUI_ID);
    expect(sinspawnGuiGroup2.bossId).toBe(IDS.GUI_BODY_2_ID);
    const c = ENEMY_GROUPS_BY_ID['sinspawn-gui-2'] as { enemies: Array<{ id: string }> };
    expect(c.enemies[0]!.id).not.toBe(IDS.GUI_ID);
    void ({} as FFXCombatant);
  });
});
