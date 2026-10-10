/**
 * **Sin, links 1 to 3 — the spine** (Chapter XVII, "Sin: the Fins and the Core";
 * FFX only; package S of `docs/plans/sin-two-chapters-plan.md`): the two chapter
 * records and the rename, the chain, the four enemy records against the plan's
 * table (research/ffx-sin.md §2.1 to §2.4), every row against §3.1 to §3.3
 * (`canMiss: false` on every one, rule 5), Negation's 24-status list with the
 * permanent-status rule run on the real engine, the shared ids, and the stubs'
 * wiring. The Fins', Genais's and the Core's behaviour are packages F and G.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, EnemyDef, FFXCombatant, StatusInstance } from '../../../src/battle/common/types.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { FFXContentRegistry, buildBattle, getAiScript, type Ctx } from '../../../src/battle/ffx/index.ts';
import { executeCommand } from '../../../src/battle/ffx/execute.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { CHAPTERS, CHAPTER_IDS, UNLISTED_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { SIN_FINS_ABILITIES, SIN_NEGATION_LIST } from '../../../src/data/ffx/enemies/sin-fins-abilities.ts';
import { SIN_GENAIS_CORE_ABILITIES } from '../../../src/data/ffx/enemies/sin-genais-core-abilities.ts';
import { sinLeftFinGroup, sinRightFinGroup } from '../../../src/data/ffx/enemies/sin-fins.ts';
import * as finData from '../../../src/data/ffx/enemies/sin-fins.ts';
import * as coreData from '../../../src/data/ffx/enemies/sin-genais-core.ts';
import { sinGenaisCoreGroup } from '../../../src/data/ffx/enemies/sin-genais-core.ts';
import { sinFaceBuild, sinFahrenheitBuild, sinFinsCoreBuild } from '../../../src/data/ffx/builds/sin-fahrenheit.ts';
import * as ids from '../../../src/battle/ffx/ai/sin-ids.ts';
import { NEGATION_MERCY, NEGATION_REMOVES, NEGATION_SPARES } from '../../../src/battle/ffx/ai/sin-negation.ts';
import { SIN_FINS_ASSUMPTIONS } from '../../../src/battle/ffx/ai/sin-fins-rules.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

function enemy(id: string): EnemyDef {
  const all = [...sinLeftFinGroup.enemies, ...sinRightFinGroup.enemies, ...sinGenaisCoreGroup.enemies];
  const e = all.find((x) => x.id === id);
  if (!e) throw new Error(`no ${id}`);
  return e;
}

const SIN_ROWS: readonly AbilityDef[] = [...Object.values(SIN_FINS_ABILITIES), ...Object.values(SIN_GENAIS_CORE_ABILITIES)];
const row = (id: string): AbilityDef => {
  const r = SIN_ROWS.find((a) => a.id === id);
  if (!r) throw new Error(`no row ${id}`);
  return r;
};

describe('the two records (D-270) and the rename (plan §1.4)', () => {
  it('Chapter XVII sin-fins-core: number 17, FFX, the Fins-first chain', () => {
    const ch = getChapter('sin-fins-core');
    expect(ch?.game).toBe('ffx');
    expect(ch?.number).toBe(17);
    expect(ch?.title).toBe('Sin: the Fins and the Core');
    expect(ch?.enemyGroupRef.id).toBe('sin-left-fin');
    expect(ch?.buildRef).toBe(sinFinsCoreBuild);
  });

  it('walks sin-left-fin -> sin-right-fin -> sin-genais-core by nextGroupId, and stops there', () => {
    const chain: string[] = [];
    for (let g = getChapter('sin-fins-core')?.enemyGroupRef; g; g = ENEMY_GROUPS_BY_ID[g.nextGroupId ?? '']) chain.push(g.id);
    expect(chain).toEqual(['sin-left-fin', 'sin-right-fin', 'sin-genais-core']);
    expect(ENEMY_GROUPS_BY_ID['sin-left-fin']).toBe(sinLeftFinGroup);
    expect(ENEMY_GROUPS_BY_ID['sin-right-fin']).toBe(sinRightFinGroup);
    expect(ENEMY_GROUPS_BY_ID['sin-genais-core']).toBe(sinGenaisCoreGroup);
  });

  it('Chapter XVIII sin-face: number 18, link 4; the old id `sin` is gone', () => {
    const ch = getChapter('sin-face');
    expect(ch?.number).toBe(18);
    expect(ch?.title).toBe('Sin: the Face');
    expect(ch?.enemyGroupRef.id).toBe('overdrive-sin');
    // The rested party, re-equipped against Gaze for link 4 (CH-XVIII, re-parity); Chapter XVII keeps the build as it was.
    expect(ch?.buildRef).toBe(sinFaceBuild);
    expect(getChapter('sin')).toBeUndefined();
  });

  it('both are listed (2026-09-29, D-279): in CHAPTERS and CHAPTER_IDS after Chapter XVI, not in UNLISTED_CHAPTERS', () => {
    for (const id of ['sin-fins-core', 'sin-face']) {
      expect(UNLISTED_CHAPTERS.map((c) => c.id)).not.toContain(id);
      expect(CHAPTERS.map((c) => c.id)).toContain(id);
      expect(CHAPTER_IDS as readonly string[]).toContain(id);
    }
    expect(CHAPTER_IDS.slice(-3)).toEqual(['ffx2-ixion-djose', 'sin-fins-core', 'sin-face']);
  });

  it('links 2 and 3 carry the party state; no other FFX formation sets the flag (R7)', () => {
    expect(sinLeftFinGroup.carriesPartyState).toBeUndefined();
    expect(sinRightFinGroup.carriesPartyState).toBe(true);
    expect(sinGenaisCoreGroup.carriesPartyState).toBe(true);
    const others = Object.values(ENEMY_GROUPS_BY_ID).filter((g) => g.game === 'ffx' && g.carriesPartyState === true);
    expect(others.map((g) => g.id).sort()).toEqual(['sin-genais-core', 'sin-right-fin']);
  });

  it("the sensor lines are the records' own (contract), under 20 words", () => {
    const ch = getChapter('sin-fins-core')!;
    for (const [id, text] of Object.entries(ch.sensorTexts ?? {})) {
      expect(enemy(id).sensorText).toBe(text);
      expect(text.split(/\s+/).length).toBeLessThanOrEqual(20);
    }
  });

  it('Tidus and Rikku carry the orders to Cid in Chapter XVII only (§4 [verified: 4 sources])', () => {
    const orders = (b: typeof sinFahrenheitBuild, id: string): string[] =>
      b.members.find((m) => m.id === id)!.learnedAbilityIds.filter((a) => a === 'pull-back' || a === 'close-in');
    expect(orders(sinFinsCoreBuild, 'tidus')).toEqual(['pull-back', 'close-in']);
    expect(orders(sinFinsCoreBuild, 'rikku')).toEqual(['pull-back', 'close-in']);
    expect(orders(sinFinsCoreBuild, 'auron')).toEqual([]);
    expect(orders(sinFahrenheitBuild, 'tidus')).toEqual([]);
    expect(sinFinsCoreBuild.activeSlots).toEqual(['tidus', 'yuna', 'auron']);
  });
});

describe('the four records against research §2.1 to §2.4 (plan §2.2 table)', () => {
  const TABLE: Record<string, [number, number, number, number, number, number, number, number]> = {
    //                 HP      MP   Overkill STR DEF MAG MDEF AGI
    'left-fin': [65_000, 999, 10_000, 30, 100, 30, 50, 20],
    'right-fin': [65_000, 999, 10_000, 30, 100, 30, 50, 20],
    'sinspawn-genais': [20_000, 200, 2_000, 30, 80, 35, 50, 25],
    'sin-core': [36_000, 999, 3_000, 1, 100, 30, 100, 20],
  };
  it.each(Object.entries(TABLE))('%s', (id, [hp, mp, ok, str, def, mag, mdef, agi]) => {
    const e = enemy(id);
    expect([e.hp, e.stats.hp, e.stats.maxHp, e.forms[0]!.hp]).toEqual([hp, hp, hp, hp]);
    expect([e.mp, e.stats.maxMp]).toEqual([mp, mp]);
    expect(e.rewards.overkillThreshold).toBe(ok);
    expect([e.stats.str, e.stats.def, e.stats.mag, e.stats.mdef, e.stats.agi]).toEqual([str, def, mag, mdef, agi]);
    expect([e.stats.luck, e.stats.eva, e.stats.acc]).toEqual([15, 0, 0]);
    expect(e.doomTurns).toBe(30);
    expect(e.zanmatoLevel).toBe(4);
    // S-6: Threaten immune on all four; Delay immunity on all four (§2.1); Bribe immune (§2.4).
    expect(e.threatenChance).toBe(0);
    expect(e.immunityFlags).toContain('immune-to-delay');
    expect(e.immunityFlags).toContain('immune-to-bribe');
    expect(e.immunityFlags).toContain('boss');
    expect(e.rewards.gil).toBe(10_000);
    expect(e.rewards.bribe?.immune).toBe(true);
  });

  it('Armored and percentage-immune: the Fins and the Core, not Genais outside its shell (§2.1)', () => {
    for (const id of ['left-fin', 'right-fin', 'sin-core']) {
      expect(enemy(id).immunityFlags).toEqual(expect.arrayContaining(['armored', 'immune-to-percentage-damage']));
    }
    expect(enemy('sinspawn-genais').immunityFlags).not.toContain('armored');
    expect(enemy('sinspawn-genais').immunityFlags).not.toContain('immune-to-percentage-damage');
  });

  it('elements (§2.2): Genais weak to Fire, absorbs Water; the rest none', () => {
    expect(enemy('sinspawn-genais').affinities).toEqual({ fire: 'weak', water: 'absorb' });
    for (const id of ['left-fin', 'right-fin', 'sin-core']) expect(enemy(id).affinities).toEqual({});
  });

  it('statuses (§2.3): the key Breaks, Genais\'s landable row, Reflect 255 on Genais and the Core', () => {
    const imm = (id: string, s: string): number => (enemy(id).immunities as Record<string, number | undefined>)[s] ?? 0;
    for (const id of ['left-fin', 'right-fin', 'sin-core']) {
      expect([imm(id, 'armor-break'), imm(id, 'mental-break')]).toEqual([0, 0]);
      for (const s of ['ko', 'petrify', 'poison', 'confuse', 'berserk', 'provoke', 'sleep', 'darkness', 'eject', 'auto-life', 'zombie', 'silence', 'power-break', 'magic-break', 'slow', 'haste', 'doom']) {
        expect(imm(id, s)).toBe(255);
      }
    }
    expect([imm('left-fin', 'reflect'), imm('right-fin', 'reflect')]).toEqual([0, 0]);
    expect(imm('sin-core', 'reflect')).toBe(255);
    const g = 'sinspawn-genais';
    expect([imm(g, 'zombie'), imm(g, 'silence'), imm(g, 'reflect')]).toEqual([80, 100, 255]);
    expect([imm(g, 'armor-break'), imm(g, 'mental-break')]).toEqual([255, 255]);
    expect([imm(g, 'power-break'), imm(g, 'magic-break'), imm(g, 'slow'), imm(g, 'haste'), imm(g, 'doom')]).toEqual([0, 0, 0, 0, 0]);
  });

  it('rewards (§2.4; S-4 resolved to 17,000)', () => {
    const r = (id: string): EnemyDef['rewards'] => enemy(id).rewards;
    expect([r('left-fin').ap, r('left-fin').apOverkill]).toEqual([16_000, 24_000]);
    expect([r('right-fin').ap, r('right-fin').apOverkill]).toEqual([17_000, 25_500]);
    expect([r('sinspawn-genais').ap, r('sinspawn-genais').apOverkill]).toEqual([1_800, 2_700]);
    expect([r('sin-core').ap, r('sin-core').apOverkill]).toEqual([18_000, 27_000]);
    expect(r('left-fin').steal?.common.itemId).toBe('mega-potion');
    expect(r('left-fin').steal?.rare.itemId).toBe('supreme-gem');
    expect(r('right-fin').steal?.common.itemId).toBe('x-potion');
    expect(r('right-fin').drops[0]?.itemId).toBe('lv-3-key-sphere');
    expect(r('sinspawn-genais').steal?.common.itemId).toBe('star-curtain');
    expect(r('sin-core').steal?.common).toEqual({ itemId: 'stamina-spring', count: 3 });
    expect(r('sin-core').steal?.rare).toEqual({ itemId: 'stamina-spring', count: 4 });
  });

  it("Cid is Evrae's m149 on his own script, with no missiles (§2.5, S-19)", () => {
    for (const g of [sinLeftFinGroup, sinRightFinGroup]) {
      const cid = g.enemies.find((e) => e.id === 'cid')!;
      expect(cid.aiScriptId).toBe('cid-fahrenheit-sin');
      expect(cid.abilityIds).toEqual([]);
      expect(cid.flags.untargetable).toBe(true);
      expect(cid.stats.agi).toBe(11); // D-09 (re-parity AI lane C): his init writes 11 over the record's 16, in both fights
    }
  });
});

describe('the rows against research §3.1 to §3.3', () => {
  it('every Sin row always hits (§3 [decompiled], rule 5) and is rank 3', () => {
    expect(SIN_ROWS).toHaveLength(24);
    for (const a of SIN_ROWS) {
      expect(a.canMiss, a.id).toBe(false);
      expect(a.rank, a.id).toBe(3);
      expect(a.game).toBe('ffx');
    }
  });

  it('every row id is a sin-ids.ts constant, and every record lists only real rows', () => {
    const constants = new Set<string>((Object.values(ids) as unknown[]).filter((v): v is string => typeof v === 'string'));
    for (const a of SIN_ROWS) expect(constants.has(a.id), a.id).toBe(true);
    for (const id of ['left-fin', 'right-fin', 'sinspawn-genais', 'sin-core']) {
      for (const a of enemy(id).abilityIds) expect(SIN_ROWS.some((r) => r.id === a), a).toBe(true);
    }
  });

  it('the Fins: Ram 28 strong Delay, Smack 34 long range, Gravija 12/16 current, the whiff does nothing', () => {
    expect(row('sin-fin-ram')).toMatchObject({ power: 28, formula: 'strength', damageType: 'physical', targeting: 'all-enemies' });
    expect(row('sin-fin-ram').flags).toContain('strong-delay');
    expect(row('sin-fin-ram').flags).not.toContain('long-range');
    expect(row('sin-fin-smack')).toMatchObject({ power: 34, formula: 'strength', damageType: 'physical', targeting: 'all-enemies' });
    expect(row('sin-fin-smack').flags).toContain('long-range');
    expect(row('sin-fin-gravija')).toMatchObject({ power: 12, formula: 'percent-current', damageType: 'magical', targeting: 'all-enemies' });
    expect(row('sin-fin-gravija').flags).toContain('always-break-damage-limit');
    expect(row('sin-fin-gravija-far')).toMatchObject({ power: 0, formula: 'none' });
    expect(row('sin-fin-negation').targeting).toBe('all');
    expect(row('sin-fin-negation-far').targeting).toBe('self');
    expect(row('sin-fin-gathers').name).toBe('Core gathers energy.');
    expect(row('sin-motionless').name).toBe('Sin remains motionless.');
  });

  it('Genais: Venom is Magic 32, physical, crit-eligible, Poison 100 (S-3); Thrashing crits; Sigh blinds 3 turns', () => {
    expect(row('sin-genais-venom')).toMatchObject({ power: 32, formula: 'magic', damageType: 'physical', targeting: 'single-enemy' });
    expect(row('sin-genais-venom').flags).toContain('crit-eligible');
    expect(row('sin-genais-venom').statusEffects).toEqual([{ status: 'poison', chance: 100, duration: 254 }]);
    expect(row('sin-genais-thrashing')).toMatchObject({ power: 32, formula: 'strength', damageType: 'physical', targeting: 'all-enemies' });
    expect(row('sin-genais-thrashing').flags).toContain('crit-eligible');
    expect(row('sin-genais-sigh')).toMatchObject({ power: 24, formula: 'magic', damageType: 'magical' });
    expect(row('sin-genais-sigh').statusEffects).toEqual([{ status: 'darkness', chance: 100, duration: 3 }]);
  });

  it('Genais: Waterga (Water 42, the caster, reflectable, silenceable, shatter 10) and Cura (heal 40, self) are counters', () => {
    const w = row('sin-genais-waterga');
    expect(w).toMatchObject({ power: 42, formula: 'magic', element: ['water'], targeting: 'single-enemy', shatterChance: 10, category: 'blackmagic' });
    expect(w.flags).toEqual(expect.arrayContaining(['reflectable', 'shatter', 'is-counter']));
    const c = row('sin-genais-cura');
    expect(c).toMatchObject({ power: 40, formula: 'healing', targeting: 'self', category: 'whitemagic' });
    expect(c.flags).toEqual(expect.arrayContaining(['heals', 'reflectable', 'is-counter']));
    expect(row('sin-magic-absorbed').name).toBe('Magic absorbed.');
  });

  it("the Core: Gravija targets `all`; F, B, T, W are Magic 16 at the whole party, in the sin-ids order (S-13)", () => {
    expect(row('sin-core-gravija')).toMatchObject({ power: 12, formula: 'percent-current', targeting: 'all' });
    expect(row('sin-core-negation').targeting).toBe('all');
    expect(ids.SIN_CORE_ELEMENT_CYCLE.map((id) => row(id).element[0])).toEqual(['fire', 'ice', 'lightning', 'water']);
    for (const id of ids.SIN_CORE_ELEMENT_CYCLE) {
      expect(row(id)).toMatchObject({ power: 16, formula: 'magic', targeting: 'all-enemies', category: 'blackmagic' });
      expect(row(id).flags).toEqual(expect.arrayContaining(['reflectable', 'is-counter']));
    }
  });
});

describe("Negation's list (§3.1, REVIEW must-change 7)", () => {
  it('is 24 statuses, the same list in the data, in the battle layer and on all three rows', () => {
    expect(NEGATION_REMOVES).toHaveLength(24);
    expect([...SIN_NEGATION_LIST]).toEqual([...NEGATION_REMOVES]);
    for (const id of ['sin-fin-negation', 'sin-fin-negation-far', 'sin-core-negation']) {
      expect(row(id).removesStatuses).toEqual([...NEGATION_REMOVES]);
      expect(row(id).flags).toContain('removes-statuses');
    }
    for (const s of NEGATION_SPARES) expect(NEGATION_REMOVES).not.toContain(s);
    for (const s of NEGATION_MERCY) expect(NEGATION_REMOVES).toContain(s);
  });

  it('on the real engine: strips both sides, and spares Auto-Life, Doom and a permanent status', () => {
    const events: BattleEvent[] = [];
    const ctx: Ctx = buildBattle(
      { game: 'ffx', party: sinFinsCoreBuild, enemies: sinLeftFinGroup, triggers: [], seed: 5, condition: 'normal', canEscape: false },
      new SeededRng(5),
      content,
      (e) => { events.push(e as BattleEvent); },
    );
    const inst = (id: StatusInstance['id'], permanent = false): StatusInstance => ({
      id, turnsRemaining: permanent ? 255 : 3, ticksRemaining: null, charges: null, stacks: 0, permanent,
    });
    const tidus = ctx.state.combatants['tidus'] as FFXCombatant;
    const yuna = ctx.state.combatants['yuna'] as FFXCombatant;
    const fin = ctx.state.combatants['left-fin'] as FFXCombatant;
    tidus.statuses['protect'] = inst('protect');
    tidus.statuses['haste'] = inst('haste');
    tidus.statuses['auto-life'] = inst('auto-life');
    tidus.statuses['doom'] = inst('doom');
    yuna.statuses['poison'] = inst('poison');
    yuna.statuses['regen'] = inst('regen', true); // stack 255, as an equipment auto-status
    fin.statuses['armor-break'] = inst('armor-break');
    executeCommand(ctx, fin, { kind: 'ability', id: 'sin-fin-negation', targets: [] }, true);
    expect(tidus.statuses['protect']).toBeUndefined();
    expect(tidus.statuses['haste']).toBeUndefined();
    expect(yuna.statuses['poison']).toBeUndefined(); // the mercy
    expect(fin.statuses['armor-break']).toBeUndefined(); // both sides
    expect(tidus.statuses['auto-life']).toBeDefined();
    expect(tidus.statuses['doom']).toBeDefined();
    expect(yuna.statuses['regen']?.permanent).toBe(true); // the dispel spares stack 255
    expect(events.filter((e) => e.type === 'status-remove').length).toBeGreaterThanOrEqual(4);
  });
});

describe('the ids and the stubs (packages F and G fill them)', () => {
  it('the battle layer names the data layer\'s ids (they are duplicated on purpose)', () => {
    expect(ids.SIN_LEFT_FIN_ID).toBe(finData.SIN_LEFT_FIN_ID);
    expect(ids.SIN_RIGHT_FIN_ID).toBe(finData.SIN_RIGHT_FIN_ID);
    expect(ids.SIN_LEFT_FIN_GROUP_ID).toBe(finData.SIN_LEFT_FIN_GROUP_ID);
    expect(ids.SIN_RIGHT_FIN_GROUP_ID).toBe(finData.SIN_RIGHT_FIN_GROUP_ID);
    expect(ids.SIN_GENAIS_CORE_GROUP_ID).toBe(finData.SIN_GENAIS_CORE_GROUP_ID);
    expect(ids.SIN_LEFT_FIN_SCRIPT).toBe(finData.SIN_LEFT_FIN_SCRIPT);
    expect(ids.SIN_RIGHT_FIN_SCRIPT).toBe(finData.SIN_RIGHT_FIN_SCRIPT);
    expect(ids.SIN_CID_SCRIPT).toBe(finData.SIN_CID_SCRIPT);
    expect(ids.SIN_GENAIS_ID).toBe(coreData.SIN_GENAIS_ID);
    expect(ids.SIN_CORE_ID).toBe(coreData.SIN_CORE_ID);
    expect(ids.SIN_GENAIS_SCRIPT).toBe(coreData.SIN_GENAIS_SCRIPT);
    expect(ids.SIN_CORE_SCRIPT).toBe(coreData.SIN_CORE_SCRIPT);
    expect(ids.SIN_FINS_CORE_CHAPTER_ID).toBe('sin-fins-core');
    expect(ids.SIN_FACE_CHAPTER_ID).toBe('sin-face');
  });

  it('every script is registered (through ai/index.ts -> sin-scripts.ts), with link 4 unchanged', () => {
    for (const id of ['overdrive-sin', 'sin-left-fin', 'sin-right-fin', 'cid-fahrenheit-sin', 'sinspawn-genais', 'sin-core']) {
      expect(getAiScript(id), id).toBeTypeOf('function');
    }
    expect(getAiScript('cid-fahrenheit')).not.toBe(getAiScript('cid-fahrenheit-sin'));
  });

  it('the seam line-up is a labelled estimate (REVIEW must-change 6)', () => {
    expect(SIN_FINS_ASSUMPTIONS.map((a) => a.id)).toContain('seam-lineup');
  });

  it('every shared flag key is `sin.`-prefixed and none collides with link 4\'s', () => {
    const keys = [ids.SIN_FIN_HITS, ids.SIN_FIN_REGULAR_ACTS, ids.SIN_FIN_CHARGED, ids.SIN_FIN_LATCHED, ids.SIN_NEGATION_TAKEN,
      ids.SIN_GENAIS_SHELLED, ids.SIN_CORE_STATE, ids.SIN_CORE_COUNTER_STEP, ids.SIN_CORE_DOWN];
    for (const k of keys) expect(k.startsWith('sin.')).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of ['sin.turn', 'sin.turnsLeft', 'sin.gigaGravitonTurn', 'sin.gazeCounter', 'sin.mouthStage']) expect(keys).not.toContain(k);
  });
});
