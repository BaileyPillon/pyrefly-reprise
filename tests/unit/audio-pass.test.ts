/**
 * THE AUDIO PASS (conference demo sound pass, 2026-10-22; decision 184): the switch, the tables, the planner.
 *
 * Pure checks only. What the layers sound like cannot be tested (AGENTS.md rule 13); what can is that the pass is OFF unless it is asked for, that it is gated to the two demo chapters,
 * that every cue a table names ships in the manifest, that no layer leads its base, that each game's tables name only that game's weapons (rule 14), and that the planner returns what the
 * tables say. The measured levels are checked by `tools/audio/pass-render.mjs` and recorded in `docs/handoff/audio-pass.md`.
 */
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { parseAudioKey, passConfiguredBy, audioNewOn, setAudioNew, setPassAddress, setPassChapter, passGame } from '../../src/audio/pass/passSwitch.ts';
import { bigKindOf, dipTimes, landingDelayMs, planHit, type HitFacts } from '../../src/audio/pass/passPlanner.ts';
import { CHARACTER_LAYERS, DIPS, ENEMY_RECIPES, HEADLINE_BLOWS, THUMPS, UI_FAMILY, WEAPON_RECIPES, uiRowFor } from '../../src/audio/pass/passRecipes.ts';
import { ATTRACT_TRIM_DB, MAKEUP_DB, VOICE_DUCK_DB, VOICE_DUCK_GAIN } from '../../src/audio/pass/passMix.ts';
import { firstBigAhead } from '../../src/engine/PassBeats.ts';
import { WEAPON_CUES } from '../../src/audio/sfxV2/weapons.ts';
import { V2_CUES } from '../../src/audio/sfxV2/cues.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';

const AUDIO = new URL('../../public/audio/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', AUDIO), 'utf8')) as { sfx: { cues: Record<string, unknown> }; sfxV2: { cues: Record<string, unknown> } };

afterEach(() => {
  setAudioNew(null);
  setPassAddress(undefined);
  setPassChapter(undefined);
});

describe('the switch', () => {
  it('reads ?audio= and the shared pack, with an explicit ?audio= winning in both directions', () => {
    expect(parseAudioKey('?audio=new')).toBe('new');
    expect(parseAudioKey('?audio=TODAY')).toBe('today');
    expect(parseAudioKey('?audio=loud')).toBeNull();
    expect(passConfiguredBy('')).toBe(true); // r64 (item 200b): the conference pack is the default
    expect(passConfiguredBy('?pack=off')).toBe(false); // the old sound stays reachable
    expect(passConfiguredBy('?pack=off&audio=new')).toBe(true);
    expect(passConfiguredBy('?audio=new')).toBe(true);
    expect(passConfiguredBy('?pack=demo')).toBe(true);
    expect(passConfiguredBy('?pack=demo&audio=today')).toBe(false);
    expect(passConfiguredBy('?audio=new&pack=other')).toBe(true);
    expect(passConfiguredBy(undefined)).toBe(false);
  });

  it('is on only while a demo chapter run is on (by default since r64; `?pack=off` is the old sound)', () => {
    setPassAddress('?pack=demo');
    expect(audioNewOn()).toBe(false); // no chapter run
    setPassChapter('seymour-flux');
    expect(audioNewOn()).toBe(true);
    expect(passGame()).toBe('ffx');
    setPassChapter('ffx2-bahamut');
    expect(passGame()).toBe('ffx2');
    setPassChapter('yunalesca');
    expect(audioNewOn()).toBe(false); // another chapter keeps today's sound
    setPassChapter('seymour-flux');
    setPassAddress('?pack=off');
    expect(audioNewOn()).toBe(false); // the address does not ask for it
    setPassAddress('');
    expect(audioNewOn()).toBe(true); // r64: no word at all is the conference default
    setPassAddress('?pack=demo&audio=today');
    expect(audioNewOn()).toBe(false); // the A/B
    setAudioNew(true);
    expect(audioNewOn()).toBe(true); // the debug setter pins it
  });
});

describe('the tables', () => {
  const FFX_WEAPONS = ['sword', 'katana', 'spear', 'blitzball', 'staff', 'doll', 'claw'];
  const FFX2_WEAPONS = ['gun', 'dagger', 'greatsword'];

  const layers = [
    ...Object.entries(WEAPON_RECIPES).flatMap(([w, r]) => [r.texture, r.body].filter(Boolean).map((l) => [`weapon ${w}`, l!] as const)),
    ...(['ffx', 'ffx2'] as const).map((g) => [`enemy ${g}`, ENEMY_RECIPES[g].texture!] as const),
    ...Object.entries(CHARACTER_LAYERS.ffx).map(([id, l]) => [`ffx ${id}`, l] as const),
    ...Object.entries(CHARACTER_LAYERS.ffx2).map(([id, l]) => [`ffx2 ${id}`, l] as const),
    ...Object.entries(THUMPS).map(([k, l]) => [`thump ${k}`, l] as const),
  ];

  it('names only cues that ship (the v2 sprite or the first bank), never a parity original', () => {
    for (const [who, l] of layers) {
      const key = l.key;
      const known = key.startsWith('v2:') ? key.slice(3) in manifest.sfxV2.cues : key.startsWith('first:') ? key.slice(6) in manifest.sfx.cues : false;
      expect(known, `${who}: ${key}`).toBe(true);
    }
  });

  it('never leads a base, never plays more than a blow needs, and fades what it cuts', () => {
    for (const [who, l] of layers) {
      expect(l.lagMs ?? 0, who).toBeGreaterThanOrEqual(0);
      expect(l.trimMs, who).toBeGreaterThan(0);
      expect(l.trimMs, who).toBeLessThanOrEqual(400);
      expect(l.fadeMs, who).toBeGreaterThan(0);
      expect(l.fadeMs, who).toBeLessThanOrEqual(l.trimMs);
      expect(l.pitch, who).toBeGreaterThan(0.5);
      expect(l.pitch, who).toBeLessThan(2);
      expect(l.skipMs, who).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps each game to its own weapons and characters (rule 14)', () => {
    expect(Object.keys(WEAPON_RECIPES).sort()).toEqual([...FFX_WEAPONS, ...FFX2_WEAPONS].sort());
    for (const w of FFX_WEAPONS) expect(WEAPON_RECIPES[w as keyof typeof WEAPON_RECIPES].texture, w).toBeDefined(); // FFX hits are all body: they get the crack
    for (const w of FFX2_WEAPONS) expect(WEAPON_RECIPES[w as keyof typeof WEAPON_RECIPES].body, w).toBeDefined(); // FFX-2 hits are all crack: they get the body
    expect(Object.keys(CHARACTER_LAYERS.ffx2).sort()).toEqual(['paine', 'rikku', 'yuna']);
    expect(CHARACTER_LAYERS.ffx2['tidus']).toBeUndefined();
    expect(CHARACTER_LAYERS.ffx['paine']).toBeUndefined();
    for (const w of Object.keys(WEAPON_RECIPES)) expect(w in WEAPON_CUES, w).toBe(true);
  });

  it('lays only cues made for the game it plays in, or for both (rule 14, audio-pass review M3)', () => {
    // A `v2:` key is tagged by `sfxV2/cues.ts`; a first-bank key by the games of the v2 cues it is the fallback of (the first bank is the base set, so a key no v2 cue falls back to is neutral).
    const fallbackOwners = new Map<string, Set<string>>();
    for (const c of Object.values(V2_CUES)) fallbackOwners.set(c.fallback, (fallbackOwners.get(c.fallback) ?? new Set()).add(c.game));
    const playsIn = (game: 'ffx' | 'ffx2', key: string): boolean => {
      if (key.startsWith('v2:')) {
        const tag = V2_CUES[key.slice(3)]?.game;
        return tag === game || tag === 'both';
      }
      const owners = fallbackOwners.get(key.replace(/^first:/, ''));
      return !owners || owners.has(game) || owners.has('both');
    };
    const per: Record<'ffx' | 'ffx2', [string, string][]> = { ffx: [], ffx2: [] };
    for (const [w, r] of Object.entries(WEAPON_RECIPES)) for (const l of [r.texture, r.body]) if (l) per[FFX_WEAPONS.includes(w) ? 'ffx' : 'ffx2'].push([`weapon ${w}`, l.key]);
    for (const g of ['ffx', 'ffx2'] as const) {
      for (const l of [ENEMY_RECIPES[g].texture, ENEMY_RECIPES[g].body]) if (l) per[g].push([`enemy ${g}`, l.key]);
      for (const [id, l] of Object.entries(CHARACTER_LAYERS[g])) per[g].push([`${g} ${id}`, l.key]);
      for (const [k, l] of Object.entries(THUMPS)) per[g].push([`thump ${k}`, l.key]);
    }
    for (const g of ['ffx', 'ffx2'] as const) for (const [who, key] of per[g]) expect(playsIn(g, key), `${g}: ${who} lays ${key}`).toBe(true);
    // the check itself sees the slips it was written for
    expect(playsIn('ffx2', 'v2:hit-sword')).toBe(false); // an FFX sword hit under Paine
    expect(playsIn('ffx2', 'first:claw')).toBe(false); // the first bank's claw is the fallback of FFX's claws only
    expect(playsIn('ffx', 'first:dagger-flurry')).toBe(false); // the fallback of FFX-2's `swing-dagger`
    expect(playsIn('ffx', 'first:od-hit-zone')).toBe(true); // a neutral first-bank cue
  });

  it('dips only the music, short and before the blow', () => {
    for (const [kind, d] of Object.entries(DIPS)) {
      expect(d.leadMs, kind).toBeGreaterThanOrEqual(60);
      expect(d.leadMs, kind).toBeLessThanOrEqual(120); // "a short duck/silence of 60-120 ms just before big impacts"
      expect(d.depthDb, kind).toBeLessThan(0);
      expect(d.holdMs, kind).toBeGreaterThan(0);
    }
    expect(Object.keys(HEADLINE_BLOWS).sort()).toEqual(['cross-cleave', 'mega-flare', 'total-annihilation', 'x2-bahamut-mega-flare']);
  });

  it("puts a headline move's big blow on its FIRST landing, the only one a dip can precede (and, for Total Annihilation, the frame feel stops)", () => {
    // Stepped at 60 Hz, Mega Flare's three blows are asked at their marks (markIn 0, 209 ms apart): a dip on the last blow never fires, so the table keeps the explosion (the first landing).
    // `engine/feel/HitStopShort.ts` stops Total Annihilation's first blow (the presenter's table says the fifth), so the pass follows feel there.
    for (const move of ['mega-flare', 'x2-bahamut-mega-flare', 'total-annihilation', 'cross-cleave']) expect(HEADLINE_BLOWS[move], move).toBe('first');
  });

  it('has a menu row for every menu cue in both games, short and quiet', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      for (const cue of ['cursor-move', 'cancel', 'error', 'menu-open', 'menu-close', 'menu-page', 'turn-ready']) {
        const row = UI_FAMILY[game][cue];
        expect(row, `${game} ${cue}`).toBeDefined();
        expect(row!.trimMs).toBeLessThanOrEqual(260);
        expect(row!.gainDb).toBeLessThan(6);
      }
    }
    expect(uiRowFor('ffx2', 'v2:cursor-move-x2')).toBe(UI_FAMILY.ffx2['cursor-move']);
    expect(uiRowFor('ffx', 'confirm')).toBe(UI_FAMILY.ffx['cursor-move']);
    expect(uiRowFor('ffx', 'v2:hit-sword')).toBeNull();
  });

  it('holds the mix constants the notes quote', () => {
    expect(VOICE_DUCK_DB).toBe(-14);
    expect(VOICE_DUCK_GAIN).toBeCloseTo(0.1995, 4);
    expect(MAKEUP_DB).toBeGreaterThan(0);
    expect(MAKEUP_DB).toBeLessThan(6);
    expect(ATTRACT_TRIM_DB).toBeLessThan(0);
  });
});

const facts = (over: Partial<HitFacts> = {}): HitFacts => ({
  game: 'ffx',
  actorSide: 'party',
  actorId: 'tidus',
  weapon: 'sword',
  physical: true,
  crit: false,
  abilityId: null,
  hitIndex: 0,
  hitCount: 1,
  commandKind: 'attack',
  ...over,
});

describe('the planner', () => {
  it('gives a plain physical blow its crack, its accent and an on-time base, and nothing big', () => {
    const p = planHit(facts())!;
    expect(p.baseSkip).toBe(true);
    expect(p.layers.map((l) => l.role)).toEqual(['texture', 'character']);
    expect(p.big).toBeUndefined();
    expect(p.dip).toBeUndefined();
    expect(p.layers[0]!.key).toBe('v2:counter');
    expect(p.layers[1]!.key).toBe('chain-hit'); // the first-bank prefix is the recipe's, not the mixer's
  });

  it('gives an FFX-2 blow its body, from its own game table', () => {
    const p = planHit(facts({ game: 'ffx2', actorId: 'rikku', weapon: 'dagger' }))!;
    expect(p.layers.map((l) => l.role)).toEqual(['body', 'character']);
    expect(planHit(facts({ game: 'ffx2', actorId: 'tidus', weapon: 'dagger' }))!.layers.map((l) => l.role)).toEqual(['body']); // no accent for an id the game's table lacks
  });

  it('gives a critical the thump and the dip, an enemy blow its own crack', () => {
    const p = planHit(facts({ crit: true }))!;
    expect(p.big).toBe('crit');
    expect(p.layers.at(-1)!.role).toBe('thump');
    expect(p.dip).toEqual(DIPS.crit);
    const e = planHit(facts({ actorSide: 'enemy', actorId: 'seymour-flux', weapon: null }))!;
    expect(e.layers.map((l) => l.role)).toEqual(['texture']);
    expect(e.layers[0]!.key).toBe('claw'); // FFX's boss: the first bank's claw
    const b = planHit(facts({ game: 'ffx2', actorSide: 'enemy', actorId: 'bahamut', weapon: null }))!;
    expect(b.layers.map((l) => l.key)).toEqual(['v2:counter']); // FFX-2's boss: a both-game cue, never the FFX claw
    expect(b.baseSkip).toBe(true);
  });

  it("gives Paine's greatsword a body that is not an FFX cue", () => {
    const p = planHit(facts({ game: 'ffx2', actorId: 'paine', weapon: 'greatsword' }))!;
    expect(p.layers.map((l) => l.key)).toEqual(['v2:hit-2', 'v2:guard']);
    expect(p.layers[0]!.pitch).toBe(0.8);
  });

  it('adds nothing to a spell, a heal or an item unless the blow is big', () => {
    expect(planHit(facts({ physical: false }))).toBeNull();
    const boss = planHit(facts({ physical: false, actorSide: 'enemy', actorId: 'seymour-flux', weapon: null, abilityId: 'cross-cleave' }))!;
    expect(boss.big).toBe('boss');
    expect(boss.layers.map((l) => l.role)).toEqual(['thump']);
    expect(boss.baseSkip).toBeUndefined();
  });

  it('reads the big blow of a headline move by its hit, and an Overdrive by its last', () => {
    const base = { crit: false, commandKind: 'attack', actorSide: null } as const;
    expect(bigKindOf({ ...base, abilityId: 'total-annihilation', hitIndex: 0, hitCount: 5 })).toBe('boss'); // the frame feel stops
    expect(bigKindOf({ ...base, abilityId: 'total-annihilation', hitIndex: 4, hitCount: 5 })).toBeNull();
    expect(bigKindOf({ ...base, abilityId: 'mega-flare', hitIndex: 0, hitCount: 1 })).toBe('boss');
    expect(bigKindOf({ ...base, abilityId: 'x2-bahamut-mega-flare', hitIndex: 0, hitCount: 3 })).toBe('boss'); // three girls: the explosion, the first landing
    expect(bigKindOf({ ...base, abilityId: 'x2-bahamut-mega-flare', hitIndex: 2, hitCount: 3 })).toBeNull();
    expect(bigKindOf({ ...base, abilityId: null, hitIndex: 3, hitCount: 4, commandKind: 'overdrive' })).toBe('overdrive');
    expect(bigKindOf({ ...base, abilityId: null, hitIndex: 1, hitCount: 4, commandKind: 'overdrive' })).toBeNull();
    expect(bigKindOf({ ...base, abilityId: null, hitIndex: 0, hitCount: 1, crit: true })).toBe('crit');
  });

  it('delays a landing by the effect\'s remaining wait less the sound\'s own silence, never early and never unbounded', () => {
    expect(landingDelayMs(0, 40)).toBe(0);
    expect(landingDelayMs(-5, 40)).toBe(0);
    expect(landingDelayMs(100, 40)).toBe(60);
    expect(landingDelayMs(30, 40)).toBe(0);
    expect(landingDelayMs(5000, 0)).toBe(600);
    expect(landingDelayMs(Number.NaN, 0)).toBe(0);
  });

  it('times a dip from the blow: down `lead` before it, held past it, back after the release', () => {
    expect(dipTimes(250, DIPS.crit)).toEqual({ downAt: 160, holdUntil: 320, backAt: 560 });
    expect(dipTimes(50, DIPS.crit).downAt).toBe(0); // the blow is nearer than the lead: down at once
  });
});

describe('the lookahead', () => {
  const start = (over: Record<string, unknown> = {}): BattleEvent => ({ type: 'action-start', actorId: 'tidus', command: { kind: 'attack' }, targets: ['flux'], ...over }) as unknown as BattleEvent;
  const hit = (over: Record<string, unknown> = {}): BattleEvent => ({ type: 'damage', targetId: 'flux', sourceId: 'tidus', amount: 100, element: 'none', crit: false, hitIndex: 0, hitCount: 1, ...over }) as unknown as BattleEvent;
  const end = (): BattleEvent => ({ type: 'action-end', actorId: 'tidus' }) as unknown as BattleEvent;

  it('finds a critical first blow, ignores a plain one, and stops at the action\'s end', () => {
    expect(firstBigAhead([start(), hit({ crit: true }), end()], 0)).toEqual({ kind: 'crit', index: 1 });
    expect(firstBigAhead([start(), hit(), end()], 0)).toBeNull();
    expect(firstBigAhead([start(), end(), hit({ crit: true })], 0)).toBeNull();
    expect(firstBigAhead([hit({ crit: true })], 0)).toBeNull(); // not at an action start
  });

  it('dips for a boss\'s headline hit but not for an Overdrive\'s finisher (its moment is not known)', () => {
    expect(firstBigAhead([start({ actorId: 'seymour-flux', abilityId: 'cross-cleave' }), hit({ sourceId: 'seymour-flux' })], 0)?.kind).toBe('boss');
    expect(firstBigAhead([start({ command: { kind: 'overdrive' } }), hit({ hitIndex: 3, hitCount: 4 })], 0)).toBeNull();
  });
});
