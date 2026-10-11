/**
 * SFX parity, per-actor and per-event cue names (both games; `src/audio/sfxV2/eventCues*.ts`): the hooks against the
 * spec rows, the game's own data and the live voice.
 *
 * What this pins:
 * - every spec row (`docs/audio/sfx-parity-rows.json`) is hooked, held (52j), a menu key, served by another row's
 *   asset, a flow slot, or listed as open with its reason: nothing is silently missing;
 * - every name a hook gives a recorded original is a legal, game-correct, unambiguous name, and every chain
 *   (`then`) and cover (`coveredBy`) names an original of the same game;
 * - every id a hook selects by (ability, actor, item, status, weapon, the stand-in it refines) exists in the data
 *   the game ships, so a hook can never wait on an id that is not there;
 * - every hook is reachable: an ask built from its own selector resolves to its own plan, so no earlier hook shadows it;
 * - in the scripted fight of both games (the real presenter, the real chapter voice) every `v2:` cue of a battle
 *   moment carries a list of recorded originals (possibly empty), so a stand-in that many events share never picks
 *   up another event's recording, and the headline cases resolve as the spec reads (Ormi's attack and blow, Auron's
 *   katana against a foe's swing, Fira after Fire, Cross Cleave's blows covered, the landing of Total Annihilation).
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { voiceBattle, type VoiceAsk } from '../../src/audio/sfxV2/battleVoice.ts';
import { EVENT_HOOKS, EVENT_RULES, eventCueNames } from '../../src/audio/sfxV2/eventRules.ts';
import { NO_RECORDING, eventPlan, matches, planFor, type EventGame, type Hook, type Selector, type Unhooked } from '../../src/audio/sfxV2/eventCues.ts';
import { FFX_UNHOOKED } from '../../src/audio/sfxV2/eventCuesFfx.ts';
import { FFX2_UNHOOKED } from '../../src/audio/sfxV2/eventCuesFfx2.ts';
import { FLOW_SLOTS } from '../../src/audio/sfxV2/flowSlots.ts';
import { V2_CUES, isV2Key } from '../../src/audio/sfxV2/cues.ts';
import { STATUS_CUES } from '../../src/audio/sfxV2/statusCues.ts';
import { WEAPON_CUES } from '../../src/audio/sfxV2/weapons.ts';
import { tierOfSfxKey } from '../../src/audio/sfxV2/families.ts';
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';
import { ABILITIES as FFX_ABILITIES, ITEMS as FFX_ITEMS, ENEMY_GROUPS_BY_ID as FFX_GROUPS } from '../../src/data/ffx/index.ts';
import { ABILITIES as FFX2_ABILITIES, ITEMS as FFX2_ITEMS, ENEMY_GROUPS_BY_ID as FFX2_GROUPS } from '../../src/data/ffx2/index.ts';
import type { AbilityDef } from '../../src/battle/common/types.ts';
import { fightTrace, playScenario, scenarios, type FightCue, type FightGame, type Scenario } from './helpers/sfxFight.ts';

const ROOT = resolve(import.meta.dirname, '../..');
interface Row { id: string; game: 'ffx' | 'ffx2' | 'both'; wave: number; hold?: true; sharedWith?: string; pack?: string; secs?: number }
const rows = (JSON.parse(readFileSync(join(ROOT, 'docs', 'audio', 'sfx-parity-rows.json'), 'utf8')) as { rows: Row[] }).rows;
const GAMES: readonly EventGame[] = ['ffx', 'ffx2'];
const UNHOOKED: Record<EventGame, Readonly<Record<string, Unhooked>>> = { ffx: FFX_UNHOOKED, ffx2: FFX2_UNHOOKED };
const ABILITIES: Record<EventGame, Record<string, AbilityDef>> = { ffx: FFX_ABILITIES as Record<string, AbilityDef>, ffx2: FFX2_ABILITIES as Record<string, AbilityDef> };
const ITEMS: Record<EventGame, Record<string, unknown>> = { ffx: FFX_ITEMS as Record<string, unknown>, ffx2: FFX2_ITEMS as Record<string, unknown> };

// ------------------------------------------------------------------ the rows

describe('every spec row has a disposition', () => {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const hooked = (g: EventGame): Set<string> => new Set(EVENT_HOOKS[g].map((h) => h.row));
  const flowRows = new Set(FLOW_SLOTS.map((s) => s.row));

  it('hooks only rows that exist, in their own game', () => {
    for (const g of GAMES) {
      for (const row of hooked(g)) {
        const r = byId.get(row);
        expect(r, `${g} hook names the unknown row ${row}`).toBeDefined();
        expect(r!.id.startsWith(`${g}.`), `${row} is hooked under ${g}`).toBe(true);
      }
    }
    for (const s of FLOW_SLOTS) expect(byId.get(s.row)?.id.startsWith(`${s.game}.`), s.row).toBe(true);
  });

  it('puts every row in exactly one place: hooked, flow, held, shared, or open with a reason', () => {
    for (const r of rows) {
      const g: EventGame = r.id.startsWith('ffx2.') ? 'ffx2' : 'ffx';
      const places = [
        hooked(g).has(r.id) ? 'hooked' : null,
        flowRows.has(r.id) ? 'flow' : null,
        r.hold ? 'hold' : null,
        r.sharedWith ? 'shared' : null,
        UNHOOKED[g][r.id] !== undefined ? 'open' : null,
      ].filter((p) => p !== null);
      // A flow row and a shared menu row are also named in the open list (it says why they have no battle hook): the allowed pairs.
      const allowed = places.length === 1 || (places.length === 2 && places.includes('open') && (places.includes('flow') || places.includes('shared')));
      expect(allowed, `${r.id}: ${places.join(' + ') || 'nothing'}`).toBe(true);
      if (r.sharedWith) expect(byId.get(r.sharedWith), `${r.id} shares ${r.sharedWith}`).toBeDefined();
    }
  });

  it('lists no open row that is not a row, and gives every one a reason', () => {
    for (const g of GAMES) {
      for (const [id, entry] of Object.entries(UNHOOKED[g])) {
        expect(byId.has(id), `${g}: ${id} is not a row`).toBe(true);
        expect(entry.why.length, id).toBeGreaterThan(8);
        if (entry.kind === 'flow') expect(flowRows.has(id), `${id} is listed as a flow row`).toBe(true);
        if (entry.kind === 'menu') expect(byId.get(id)!.hold, `${id} is a menu key, not a held row`).toBeUndefined();
      }
    }
  });

  it('keeps hold rows unhooked (52j: no retail sound, today\'s sound stays)', () => {
    for (const r of rows.filter((x) => x.hold)) {
      const g: EventGame = r.id.startsWith('ffx2.') ? 'ffx2' : 'ffx';
      expect(hooked(g).has(r.id), r.id).toBe(false);
    }
  });
});

// ------------------------------------------------------------------ the names

describe('the names recorded originals are given', () => {
  const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  for (const g of GAMES) {
    const cues = eventCueNames(g);

    it(`${g}: every name is legal, answers one row, and does not collide with the other game's stand-ins`, () => {
      for (const [cue, rowsOf] of cues) {
        expect(cue, cue).toMatch(NAME);
        expect(rowsOf.length, `${cue} answers ${rowsOf.join(', ')}`).toBe(1);
        const v2 = V2_CUES[cue];
        if (v2) expect(['both', g], `${cue} is a ${v2.game} stand-in`).toContain(v2.game);
      }
    });

    it(`${g}: every chain and every cover names an original of this game`, () => {
      for (const h of EVENT_HOOKS[g]) {
        for (const name of h.then ?? []) expect(cues.has(name), `${h.cue} falls back to ${name}`).toBe(true);
        for (const name of h.coveredBy ?? []) {
          expect(cues.has(name), `${h.row} is covered by ${name}`).toBe(true);
          expect(cues.get(name), `${h.row} is covered by ${name}, which answers another row`).toEqual([h.row]);
        }
      }
    });
  }

  it('the FFX-2 twins keep the name the voice asks for (-x2), the other game\'s names never appear', () => {
    for (const cue of eventCueNames('ffx2').keys()) {
      if (V2_CUES[`${cue}-x2`]) throw new Error(`${cue} has an FFX-2 twin, ${cue}-x2: name the original that`);
    }
    // No FFX-only stand-in is named by an FFX-2 hook, and no FFX-2-only stand-in by an FFX hook.
    for (const cue of eventCueNames('ffx2').keys()) expect(V2_CUES[cue]?.game ?? 'ffx2', cue).not.toBe('ffx');
    for (const cue of eventCueNames('ffx').keys()) expect(V2_CUES[cue]?.game ?? 'ffx', cue).not.toBe('ffx2');
  });
});

// ------------------------------------------------------------------ the data

/** Every combatant id a game's chapters field: the party's members and aeons, and the enemy groups' enemies. */
function combatantIds(game: EventGame): Set<string> {
  const ids = new Set<string>();
  const groups = { ...FFX_GROUPS, ...FFX2_GROUPS } as Record<string, { id: string; enemies: Array<{ id: string }>; nextGroupId?: string }>;
  for (const id of [...CHAPTER_IDS, 'exp-leblanc', 'sinspawn-gui']) {
    const chapter = getChapter(id);
    if (!chapter || chapter.game !== game) continue;
    const build = chapter.buildRef as { members: Array<{ id: string }>; aeons?: Array<{ id: string }> };
    for (const m of build.members) ids.add(m.id);
    for (const a of build.aeons ?? []) ids.add(a.id);
    let g: typeof groups[string] | undefined = chapter.enemyGroupRef as unknown as typeof groups[string];
    const seen = new Set<string>();
    while (g && !seen.has(g.id)) {
      seen.add(g.id);
      for (const e of g.enemies) ids.add(e.id);
      g = g.nextGroupId ? groups[g.nextGroupId] : undefined;
    }
  }
  return ids;
}

describe('every selector names something the game ships', () => {
  const MOMENTS = new Set(['attack', 'cast', 'item', 'damage', 'heal', 'revive', 'miss', 'status', 'petrify-shatter', 'ko', 'summon', 'spherechange', 'overdrive', 'charge', 'form-change', 'counter', 'appear', 'overdrive-start']);
  const many = <T,>(v: T | readonly T[]): readonly T[] => (Array.isArray(v) ? (v as readonly T[]) : [v as T]);

  for (const g of GAMES) {
    it(`${g}: abilities, items, actors, statuses, weapons and stand-ins exist`, () => {
      const actors = combatantIds(g);
      for (const h of EVENT_HOOKS[g]) {
        const at = h.at;
        const label = `${h.row} / ${h.cue ?? '(quiet)'}`;
        for (const m of many(at.moment)) expect(MOMENTS.has(m), `${label}: moment ${m}`).toBe(true);
        if (Array.isArray(at.ability)) for (const id of at.ability) expect(ABILITIES[g][id], `${label}: ability ${id}`).toBeDefined();
        if (at.ability instanceof RegExp) expect(Object.keys(ABILITIES[g]).some((id) => (at.ability as RegExp).test(id)), `${label}: ${at.ability}`).toBe(true);
        for (const id of at.item ?? []) expect(ITEMS[g][id], `${label}: item ${id}`).toBeDefined();
        for (const id of at.actor ?? []) expect(actors.has(id), `${label}: actor ${id}`).toBe(true);
        for (const id of at.status ?? []) expect(STATUS_CUES[id as keyof typeof STATUS_CUES], `${label}: status ${id}`).toBeDefined();
        for (const w of at.weapon ?? []) expect(WEAPON_CUES[w], `${label}: weapon ${w}`).toBeDefined();
        if (at.on) {
          const cue = V2_CUES[at.on];
          expect(cue, `${label}: stand-in ${at.on}`).toBeDefined();
          expect(['both', g], `${label}: stand-in ${at.on} is ${cue?.game}`).toContain(cue?.game);
        }
        if (at.tier !== undefined) expect(g, `${label}: tiers are FFX's`).toBe('ffx');
      }
    });
  }

  it('reads the spell tier off the alias table: Fira is 2, Firaga 3, Fire none', () => {
    expect(tierOfSfxKey('sfx-fira-cast')).toBe(2);
    expect(tierOfSfxKey('sfx-firaga-cast')).toBe(3);
    expect(tierOfSfxKey('sfx-fire-cast')).toBeNull();
    expect(tierOfSfxKey('sfx-thundara-cast')).toBe(2);
    expect(tierOfSfxKey('sfx-waterga-cast')).toBe(3);
    expect(tierOfSfxKey('sfx-cura')).toBe(2);
    expect(tierOfSfxKey('sfx-curaga')).toBe(3); // Curaga has its own cue; the hook for it selects by that cue, not by tier
    expect(tierOfSfxKey('sfx-item-fire-multi')).toBe(2); // a Fire Gem lands at tier 2, as its data names it
    expect(tierOfSfxKey('sfx-hellfire')).toBe(3);
    expect(tierOfSfxKey('sfx-no-such-thing')).toBeNull();
    expect(tierOfSfxKey(undefined)).toBeNull();
  });

  it('the party\'s aeon Overdrives are the ids the aeon data marks as Overdrives', () => {
    for (const h of EVENT_HOOKS.ffx.filter((x) => x.row.startsWith('ffx.aeon.') && x.at.landing === 'first')) {
      for (const id of h.at.ability as readonly string[]) {
        const def = FFX_ABILITIES[id] as AbilityDef;
        expect(def.category, id).toBe('overdrive');
      }
    }
  });
});

// ------------------------------------------------------------------ reachability

/** An ask (and the key the voice chose) that satisfies `at`, built from its own fields. */
function askFor(game: EventGame, at: Selector): { ask: VoiceAsk; key: string | null } {
  const first = <T,>(v: T | readonly T[] | undefined): T | undefined => (v === undefined ? undefined : Array.isArray(v) ? (v as readonly T[])[0] : (v as T));
  const side = first(at.side) ?? (at.weapon ? 'party' : 'enemy');
  const actor = at.actor || at.side || at.weapon ? { id: at.actor?.[0] ?? 'actor', side, weapon: at.weapon?.[0] ?? null, voice: null } : null;
  const target = at.targetSide || at.targetVoice ? { id: 'target', side: first(at.targetSide) ?? 'enemy', weapon: null, voice: at.targetVoice ?? null } : null;
  const wantsAction = at.ability !== undefined || at.item !== undefined || at.command !== undefined || at.isItem !== undefined || at.tier !== undefined || at.bare === false;
  const abilityId = Array.isArray(at.ability) ? at.ability[0] : at.ability instanceof RegExp ? Object.keys(ABILITIES[game]).find((id) => (at.ability as RegExp).test(id)) : undefined;
  const action = at.bare === true || !wantsAction
    ? null
    : {
        commandKind: at.command?.[0] ?? (at.item || at.isItem ? 'item' : 'ability'),
        element: null,
        damageType: null,
        family: null,
        isItem: at.isItem === true || at.item !== undefined,
        abilityId: abilityId ?? null,
        commandId: at.item?.[0] ?? null,
        tier: at.tier === 1 || at.tier === undefined ? null : at.tier,
      };
  const ask: VoiceAsk = {
    game,
    moment: first(at.moment)!,
    actor,
    target,
    action,
    nth: at.nth === 'later' ? 1 : 0,
    ...(at.status ? { status: at.status[0]! } : {}),
    ...(at.stage ? { stage: at.stage } : {}),
    ...(at.to ? { to: at.to[0]! } : {}),
    landed: at.landing === 'later' ? 1 : 0,
  };
  const key = at.on === undefined ? 'v2:hit-1' : at.on === null ? null : `v2:${at.on}`;
  return { ask, key };
}

describe('every hook is reachable', () => {
  for (const g of GAMES) {
    it(`${g}: an ask built from a hook's own selector resolves to that hook's plan`, () => {
      const hooks: readonly Hook[] = EVENT_HOOKS[g];
      const rules = EVENT_RULES[g];
      hooks.forEach((h, i) => {
        const { ask, key } = askFor(g, h.at);
        expect(matches(h.at, ask, key), `${h.row} / ${h.cue}: its own ask does not match it`).toBe(true);
        const plan = planFor(rules, ask, key);
        expect(plan, `${h.row} / ${h.cue} (hook ${i}) is shadowed`).toEqual(rules[i]!.plan);
      });
    });
  }
});

// ------------------------------------------------------------------ the voice

describe('the scripted fight: every v2 battle cue lists its recorded originals', () => {
  for (const g of GAMES) {
    it(`${g}: a v2 stand-in always carries \`events\` (empty unless a hook names its original)`, async () => {
      const bare: string[] = [];
      const seen = new Set<string>();
      for (const scenario of scenarios(g as FightGame)) {
        for (const c of await playScenario(g as FightGame, scenario)) {
          if (!isV2Key(c.key)) continue;
          if (c.events === undefined) bare.push(`${scenario.id}: ${c.key}`);
          for (const e of c.events ?? []) seen.add(e);
        }
      }
      expect(bare.slice(0, 8), `${bare.length} v2 cue(s) without events`).toEqual([]);
      // The scripted fight reaches a good share of the hooks (the rest need their own scenes, below).
      const names = [...eventCueNames(g).keys()];
      const reached = names.filter((n) => seen.has(n));
      expect(reached.length, `${g}: ${reached.length} of ${names.length} originals reached`).toBeGreaterThan(names.length * 0.6);
    }, 120_000);
  }
});

async function cuesOf(game: FightGame, scenario: Scenario): Promise<FightCue[]> {
  return playScenario(game, scenario);
}
const find = (game: FightGame, id: string): Scenario => {
  const s = scenarios(game).find((x) => x.id === id);
  if (!s) throw new Error(`no scenario ${id}`);
  return s;
};

describe('the headline cases resolve as the spec reads', () => {
  it('FFX: a party swing and blow name their weapon; a foe\'s do not share them', async () => {
    const tidus = await cuesOf('ffx', find('ffx', 'attack:tidus'));
    expect(tidus.map((c) => [c.key, c.events])).toEqual([['v2:swing-sword', ['swing-sword']], ['v2:hit-sword', ['hit-sword']]]);
    const auron = await cuesOf('ffx', find('ffx', 'attack:auron'));
    expect(auron[0]!.events).toEqual(['swing-katana']);
    const dingo = await cuesOf('ffx', find('ffx', 'attack:dingo'));
    expect(dingo.map((c) => [c.key, c.events])).toEqual([['v2:swing-katana', []], ['v2:hit-heavy-enemy', []]]); // Auron's recording is not a foe's
  });

  it('FFX: Seymour Flux\'s plain attack is a swing and a blow that stands down for the swing', async () => {
    const flux = await cuesOf('ffx', find('ffx', 'attack:seymour-flux'));
    expect(flux[0]).toMatchObject({ key: 'v2:swing-katana', events: ['swing-flux'] });
    expect(flux[1]).toMatchObject({ key: 'v2:hit-heavy-enemy', events: ['hit-flux'], coveredBy: ['swing-flux'] });
  });

  it('FFX: Cross Cleave opens with one sample and its blows stand down; Total Annihilation lands with one', async () => {
    const cleave = await cuesOf('ffx', find('ffx', 'ability:dingo:cross-cleave'));
    expect(cleave[0]!.events).toEqual(['flux-cleave']);
    expect(cleave.slice(1).every((c) => c.events?.length === 0 && c.coveredBy?.[0] === 'flux-cleave')).toBe(true);
    expect(cleave.length).toBeGreaterThan(1);
    const annihilation = await cuesOf('ffx', find('ffx', 'ability:dingo:total-annihilation'));
    const landed = annihilation.filter((c) => c.events?.[0] === 'flux-annihilation');
    expect(landed).toHaveLength(1); // the first landing only
    const later = annihilation.filter((c) => c.coveredBy?.[0] === 'flux-annihilation');
    expect(later.length).toBeGreaterThan(0);
  });

  it('FFX: a tier-2 spell falls back to tier 1; tier 3 to 2 then 1; Fire itself names only Fire', async () => {
    const fire = await cuesOf('ffx', find('ffx', 'ability:lulu:fire'));
    const fira = await cuesOf('ffx', find('ffx', 'ability:lulu:fira'));
    const firaga = await cuesOf('ffx', find('ffx', 'ability:lulu:firaga'));
    const landing = (cues: FightCue[]): string[] | undefined => cues.find((c) => c.key === 'v2:fire')?.events as string[] | undefined;
    expect(landing(fire)).toEqual(['fire']);
    expect(landing(fira)).toEqual(['fire-2', 'fire']);
    expect(landing(firaga)).toEqual(['fire-3', 'fire-2', 'fire']);
  });

  it('FFX-2: a foe of the Leblanc chapter attacks with one sample; a blow with no swing of its own stays', async () => {
    for (const [who, name] of [['ormi-entrance', 'ormi'], ['logos-room', 'logos'], ['leblanc', 'leblanc'], ['dr-goon', 'goon'], ['fem-goon', 'fgoon']] as const) {
      const cues = await cuesOf('ffx2', find('ffx2', `attack:${who}`));
      expect(cues[0], who).toMatchObject({ events: [`swing-${name}`] });
      expect(cues[1], who).toMatchObject({ key: 'v2:hit-heavy-enemy', events: [`hit-${name}`], coveredBy: [`swing-${name}`] });
    }
    const imp = await cuesOf('ffx2', find('ffx2', 'attack:imp'));
    expect(imp.map((c) => c.events)).toEqual([[], []]); // a foe with no row shares nothing
  });

  it('FFX-2: the girls\' weapons name their own swing and blow, and Trigger Happy its burst', async () => {
    const paine = await cuesOf('ffx2', find('ffx2', 'attack:paine'));
    expect(paine.map((c) => c.events)).toEqual([['swing-greatsword'], ['hit-greatsword']]);
    const burst = await cuesOf('ffx2', find('ffx2', 'overdrive:command'));
    expect(burst.find((c) => c.key === 'v2:gun-burst')?.events).toEqual(['gun-burst']);
  });

  it('the swing is asked for with the strike\'s beat; nothing else is', async () => {
    const tidus = await cuesOf('ffx', find('ffx', 'attack:tidus'));
    expect(tidus[0]!.beatMs).toBeGreaterThan(200);
    expect(tidus[0]!.beatMs).toBeLessThan(300);
    expect(tidus[1]!.beatMs).toBeUndefined();
  });

  it('the boss reveal and an Overdrive\'s opening name their recorded originals', async () => {
    const reveal = await cuesOf('ffx', find('ffx', 'reveal:seymour-flux'));
    expect(reveal).toHaveLength(1);
    expect(reveal[0]).toMatchObject({ key: 'v2:boss-roar', events: ['appear-flux'] });
    const dingo = await cuesOf('ffx', find('ffx', 'reveal:dingo'));
    expect(dingo[0]).toMatchObject({ key: 'v2:boss-roar', events: [] });
    const tidus = await cuesOf('ffx', find('ffx', 'overdrive-start:tidus'));
    expect(tidus[0]).toMatchObject({ key: 'v2:overdrive-stinger', events: ['overdrive-tidus'] });
    const kimahri = await cuesOf('ffx', find('ffx', 'overdrive-start:kimahri'));
    expect(kimahri[0]!.events).toEqual([]);
    const girl = await cuesOf('ffx2', find('ffx2', 'overdrive-start:paine'));
    expect(girl[0]).toMatchObject({ key: 'v2:special-stinger', events: ['special-stinger'] });
    const aeon = await cuesOf('ffx2', find('ffx2', 'reveal:x2-shiva'));
    expect(aeon[0]).toMatchObject({ key: 'v2:boss-roar-aeon', events: ['boss-shiva'] });
  });

  it('a stand-in the voice leaves to the presenter has no events (nothing to look up)', async () => {
    const victory = await cuesOf('ffx', find('ffx', 'victory'));
    expect(victory.every((c) => c.events === undefined)).toBe(true);
    const sfx = await cuesOf('ffx', find('ffx', 'sfx:no-such-key'));
    expect(sfx.every((c) => c.events === undefined)).toBe(true);
  });
});

describe('the plan never changes the stand-in', () => {
  it('eventPlan reads the voice\'s key and returns the empty plan for any v2 cue no hook covers, null for the rest', () => {
    const ask: VoiceAsk = { game: 'ffx', moment: 'damage', actor: { id: 'x', side: 'enemy', weapon: null, voice: null }, target: null, action: { commandKind: 'attack', element: null, damageType: 'physical', family: null, isItem: false }, nth: 0 };
    expect(eventPlan(EVENT_RULES, ask, 'v2:hit-1')).toBe(NO_RECORDING);
    expect(eventPlan(EVENT_RULES, ask, null)).toBeNull();
    expect(eventPlan(EVENT_RULES, ask, 'cure')).toBeNull(); // a first-bank key is not a stand-in the packs know
    // The voice's own answer for the same ask is untouched by the plan.
    expect(voiceBattle(ask)?.key).toBe('v2:hit-heavy-enemy');
  });

  it('an FFX ask never resolves an FFX-2 hook, nor the reverse (rule 14)', () => {
    const ormi: VoiceAsk = { game: 'ffx', moment: 'attack', actor: { id: 'ormi', side: 'enemy', weapon: null, voice: null }, target: null, action: { commandKind: 'attack', element: null, damageType: 'physical', family: null, isItem: false }, nth: 0 };
    expect(eventPlan(EVENT_RULES, ormi, 'v2:swing-katana')).toBe(NO_RECORDING);
    expect(eventPlan(EVENT_RULES, { ...ormi, game: 'ffx2' }, 'v2:swing-greatsword')?.events).toEqual(['swing-ormi']);
  });
});

describe('a shipped pack names only originals the game knows how to ask for', () => {
  it('holds only event cues of its game, stand-in names the voice asks for, menu keys and flow cues (vacuous while no pack ships)', () => {
    const shipped = JSON.parse(readFileSync(join(ROOT, 'public', 'audio', 'manifest.json'), 'utf8')) as { sfxParity?: { packs?: Record<string, { cues: Record<string, { game?: string }> }> } };
    const flow = new Set(FLOW_SLOTS.map((s) => s.cue));
    for (const [pack, p] of Object.entries(shipped.sfxParity?.packs ?? {})) {
      const game = pack.split('-')[0] as EventGame;
      const events = eventCueNames(game);
      for (const name of Object.keys(p.cues)) {
        const known = events.has(name) || flow.has(name) || (V2_CUES[name] !== undefined && ['both', game].includes(V2_CUES[name]!.game));
        expect(known, `${pack}/${name} is not a name any hook, flow slot or v2 stand-in of ${game} asks for`).toBe(true);
      }
    }
  });
});

describe('the trace of the scripted fight is stable', () => {
  it('groups the same scenarios whether or not the parity options are read (the pin\'s signature ignores them)', async () => {
    const a = await fightTrace('ffx');
    const b = await fightTrace('ffx');
    expect(a).toEqual(b);
  }, 60_000);
});
