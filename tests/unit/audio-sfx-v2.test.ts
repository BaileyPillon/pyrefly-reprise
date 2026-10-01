/**
 * D-302, the recorded SFX set with the full hookup: the cue table against the shipped sprite, and the
 * mapping (every party weapon maps, every element maps, every status maps, unknown falls back, each
 * game only hears its own cues, FF7 and unit-test chapters hear exactly what they heard before).
 */

import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseManifest } from '../../src/audio/manifest.ts';
import { sfxNames } from '../../src/audio/sfx/index.ts';
import { V2_CUES, twin, v2Fallback, v2Name, isV2Key } from '../../src/audio/sfxV2/cues.ts';
import { voiceKey, stingerFor } from '../../src/audio/sfxV2/voicing.ts';
import { voiceBattle, type VoiceAsk, type VoiceActor } from '../../src/audio/sfxV2/battleVoice.ts';
import { STATUS_CUES } from '../../src/audio/sfxV2/statusCues.ts';
import { FFX_WEAPON_TYPES, WEAPON_CUES, ffx2Weapon, roarFor, type Weapon } from '../../src/audio/sfxV2/weapons.ts';
import { familyOfSfxKey } from '../../src/audio/sfxV2/families.ts';
import { CHARACTERS } from '../../src/data/ffx/characters/index.ts';
import { STANDARD_DRESSPHERES } from '../../src/data/ffx2/dresspheres/index.ts';
import { ELEMENT_IDS, type BattleEvent, type BattleState } from '../../src/battle/common/types.ts';
import { sfxVoiceFor } from '../../src/app/screens/battleSfxVoice.ts';
import { noteSfxEvent, playCue, type SfxVoice } from '../../src/engine/BattlePresenterSfx.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';

const AUDIO_DIR = new URL('../../public/audio/', import.meta.url);
const raw = JSON.parse(readFileSync(new URL('manifest.json', AUDIO_DIR), 'utf8')) as {
  sfxV2: { file: string; bytes: number; cues: Record<string, { game: string }> };
};
const manifest = parseManifest(raw);

const exists = (key: string | null | undefined): boolean => !!key && isV2Key(key) && !!V2_CUES[v2Name(key)];
const gameOf = (key: string): string => V2_CUES[v2Name(key)]!.game;

describe('the v2 cue table and the shipped sprite', () => {
  it('lists exactly the cues the v2 sprite holds, each with the same game', () => {
    expect(manifest.sfxV2).not.toBeNull();
    expect(Object.keys(raw.sfxV2.cues).sort()).toEqual(Object.keys(V2_CUES).sort());
    for (const [name, cue] of Object.entries(raw.sfxV2.cues)) expect(V2_CUES[name]!.game, name).toBe(cue.game);
  });

  it('ships the sprite the manifest names, at its byte count', () => {
    expect(statSync(new URL(raw.sfxV2.file, AUDIO_DIR)).size).toBe(raw.sfxV2.bytes);
  });

  it('stands every v2 cue in with a real first-bank cue', () => {
    const bank = new Set(sfxNames());
    for (const [name, cue] of Object.entries(V2_CUES)) expect(bank.has(cue.fallback), `${name} -> ${cue.fallback}`).toBe(true);
    expect(v2Fallback('v2:no-such-cue')).toBe('hit-1');
    expect(v2Fallback('cure')).toBe('cure');
  });
});

describe('rule 14: each game hears its own cues', () => {
  it('takes the -x2 twin in FFX-2 and never crosses games', () => {
    expect(twin('fire', 'ffx')).toBe('v2:fire');
    expect(twin('fire', 'ffx2')).toBe('v2:fire-x2');
    expect(twin('shot-gun', 'ffx')).toBeNull();
    expect(twin('swing-sword', 'ffx2')).toBeNull();
    expect(twin('haste', 'ffx2')).toBe('v2:haste');
  });

  it('voices the menu set per game and leaves game-less screens alone', () => {
    expect(voiceKey('cursor-move', 'ffx')).toBe('v2:cursor-move');
    expect(voiceKey('cursor-move', 'ffx2')).toBe('v2:cursor-move-x2');
    expect(voiceKey('cursor-move', null)).toBe('cursor-move');
    expect(voiceKey('victory-fanfare', 'ffx')).toBe('victory-fanfare');
    expect(stingerFor('ffx')).toBe('v2:overdrive-stinger');
    expect(stingerFor('ffx2')).toBe('v2:special-stinger');
    expect(stingerFor(null)).toBeNull();
  });
});

const party = (id: string, weapon: Weapon | null): VoiceActor => ({ id, side: 'party', weapon, voice: null });
const enemy = (id: string, voice: VoiceActor['voice'] = null): VoiceActor => ({ id, side: 'enemy', weapon: null, voice });
const physical = { commandKind: 'attack', element: null, damageType: 'physical', family: null, isItem: false };
const ask = (over: Partial<VoiceAsk>): VoiceAsk => ({ game: 'ffx', moment: 'attack', actor: null, target: null, action: physical, nth: 0, ...over });

describe('every party weapon maps', () => {
  it('reads every FFX weaponType the data names', () => {
    for (const c of Object.values(CHARACTERS)) expect(FFX_WEAPON_TYPES[c.weaponType], c.id).toBeDefined();
  });

  it('gives every weapon a swing and a hit in its own game', () => {
    const ffx2Weapons = new Set<Weapon>(['gun', 'dagger', 'greatsword']);
    for (const [weapon, cues] of Object.entries(WEAPON_CUES) as [Weapon, { swing: string; hit: string }][]) {
      const game = ffx2Weapons.has(weapon) ? 'ffx2' : 'ffx';
      const swing = voiceBattle(ask({ game, moment: 'attack', actor: party('x', weapon) }));
      const hit = voiceBattle(ask({ game, moment: 'damage', actor: party('x', weapon), element: 'none' }));
      expect(swing?.key, weapon).toBe(`v2:${cues.swing}`);
      expect(hit?.key, weapon).toBe(`v2:${cues.hit}`);
    }
  });

  it('arms every FFX-2 girl in every standard dressphere', () => {
    for (const girl of ['yuna', 'rikku', 'paine']) {
      for (const sphere of Object.keys(STANDARD_DRESSPHERES)) expect(ffx2Weapon(girl, sphere), `${girl} ${sphere}`).not.toBeNull();
    }
    expect(ffx2Weapon('yuna', 'gunner')).toBe('gun');
    expect(ffx2Weapon('rikku', 'thief')).toBe('dagger');
    expect(ffx2Weapon('paine', 'warrior')).toBe('greatsword');
    expect(ffx2Weapon('rikku', 'gun-mage')).toBe('gun');
    expect(ffx2Weapon('yuna', 'white-mage')).toBe('gun');
    expect(ffx2Weapon('shuyin', 'gunner')).toBeNull();
  });

  it("fires Trigger Happy's burst for a Gunner's Overdrive-kind command", () => {
    const k = voiceBattle(ask({ game: 'ffx2', actor: party('yuna', 'gun'), action: { ...physical, commandKind: 'overdrive' } }));
    expect(k?.key).toBe('v2:gun-burst');
  });
});

describe('every element maps', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    it(`lands every element in ${game}`, () => {
      for (const element of ELEMENT_IDS.filter((e) => e !== 'none')) {
        const k = voiceBattle(ask({ game, moment: 'damage', actor: party('x', null), element, action: { ...physical, damageType: 'magical', element } }));
        expect(exists(k?.key), `${game} ${element}: ${k?.key}`).toBe(true);
        expect(['both', game]).toContain(gameOf(k!.key));
      }
    });
  }

  it("lands a family the game has no cue for by the ordinary rules (FFX's Energy Ray names the FFX-2 laser)", () => {
    const k = voiceBattle(ask({ game: 'ffx', moment: 'damage', actor: { id: 'valefor', side: 'aeon', weapon: null, voice: null }, element: 'none', action: { ...physical, commandKind: 'overdrive', damageType: 'magical', family: 'laser-fire' } }));
    expect(k?.key).toBe('v2:flare');
    expect(familyOfSfxKey('sfx-energy-ray')).toBe('laser-fire');
  });

  it('lands the FFX data sfxKey families', () => {
    expect(familyOfSfxKey('sfx-firaga-cast')).toBe('fire');
    expect(familyOfSfxKey('sfx-curaga')).toBe('cure-3');
    expect(familyOfSfxKey('sfx-item-explosion-small')).toBe('explosion');
    expect(familyOfSfxKey(undefined)).toBeNull();
  });
});

describe('every status and moment maps inside its game', () => {
  const moments = ['attack', 'cast', 'item', 'damage', 'heal', 'revive', 'miss', 'status', 'petrify-shatter', 'ko', 'summon', 'spherechange', 'overdrive', 'charge', 'form-change', 'counter'];
  for (const game of ['ffx', 'ffx2'] as const) {
    it(`never plays another game's cue in ${game} (dissolve-pyreflies is sourced as both)`, () => {
      const actors = [party('tidus', game === 'ffx' ? 'sword' : 'gun'), enemy('bahamut', game === 'ffx2' ? 'aeon' : null), enemy('vegnagun-leg', 'machina'), null];
      for (const moment of moments) {
        for (const actor of actors) {
          for (const nth of [0, 1]) {
            const k = voiceBattle(ask({ game, moment, actor, target: actor, nth, stage: 1 }));
            if (!k) continue;
            expect(exists(k.key), `${moment}: ${k.key}`).toBe(true);
            if (k.key !== 'v2:dissolve-pyreflies') expect(['both', game], `${game} ${moment}: ${k.key}`).toContain(gameOf(k.key));
          }
        }
      }
    });

    it(`gives every status a cue in ${game}`, () => {
      for (const status of Object.keys(STATUS_CUES)) {
        const k = voiceBattle(ask({ game, moment: 'status', status }));
        expect(exists(k?.key), `${status}: ${k?.key}`).toBe(true);
      }
    });
  }

  it('keeps the victory fanfare and unknown keys as they were', () => {
    expect(voiceBattle(ask({ moment: 'victory' }))).toBeNull();
    expect(voiceBattle(ask({ moment: 'sfx-no-such-thing' }))).toBeNull();
    expect(voiceBattle(ask({ moment: 'laser-charge', game: 'ffx' }))).toBeNull();
    expect(voiceBattle(ask({ moment: 'laser-charge', game: 'ffx2' }))?.key).toBe('v2:laser-charge');
  });

  it('roars by who the enemy is', () => {
    expect(roarFor('ffx', 'seymour-flux')).toBe('v2:boss-roar');
    expect(roarFor('ffx2', 'bahamut')).toBe('v2:boss-roar-aeon');
    expect(roarFor('ffx2', 'vegnagun-head')).toBe('v2:machina-roar');
    expect(roarFor('ffx2', 'leblanc')).toBeNull();
  });
});

// --------------------------------------------------------------- presenter + chapter voice

function fakeCtx(voice: SfxVoice | null): { ctx: EventCtx; played: string[] } {
  const played: string[] = [];
  const audio = {
    playSfx: (key: string) => {
      if (key === 'bogus') throw new Error('unknown');
      played.push(key);
    },
    playMusic: () => undefined,
    stopMusic: () => undefined,
  };
  const ctx = { deps: { audio, sfxVoice: voice }, actingId: null } as unknown as EventCtx;
  return { ctx, played };
}

const actionStart = (actorId: string, kind: string, id?: string): BattleEvent =>
  ({ type: 'action-start', actorId, command: { kind, targets: [], ...(id ? { id } : {}) }, targets: [] }) as unknown as BattleEvent;

describe('the presenter with and without a voice', () => {
  it('plays exactly the old cues without a voice (FF7, every other test)', () => {
    const { ctx, played } = fakeCtx(null);
    noteSfxEvent(ctx, actionStart('tidus', 'attack'));
    playCue(ctx, 'attack');
    playCue(ctx, 'item'); // new with the hookup: silent without a voice
    playCue(ctx, 'bogus'); // unknown: the generic hit
    expect(played).toEqual(['sword-slash-1', 'hit-1']);
    expect(sfxVoiceFor('ff7')).toBeNull();
  });

  it("resolves the actor's weapon from the live state and the chapter's game", () => {
    const state = {
      combatants: {
        tidus: { side: 'party' },
        yuna: { side: 'party', dresspheres: { current: 'samurai' } },
        rikku: { side: 'party', dresspheres: { current: 'thief' } },
      },
    } as unknown as BattleState;
    const ffx = fakeCtx(sfxVoiceFor('ffx', () => state));
    noteSfxEvent(ffx.ctx, actionStart('tidus', 'attack'));
    playCue(ffx.ctx, 'attack');
    playCue(ffx.ctx, 'item');
    const ffx2 = fakeCtx(sfxVoiceFor('ffx2', () => state));
    noteSfxEvent(ffx2.ctx, actionStart('yuna', 'attack'));
    playCue(ffx2.ctx, 'attack');
    noteSfxEvent(ffx2.ctx, actionStart('rikku', 'attack'));
    playCue(ffx2.ctx, 'attack');
    playCue(ffx2.ctx, 'cast');
    expect(ffx.played).toEqual(['v2:swing-sword', 'v2:item-use']);
    expect(ffx2.played).toEqual(['v2:shot-gun', 'v2:swing-dagger', 'v2:magic-charge-x2']);
  });

  it('plays the spell once on the first blow of a Flare-type action, then plain hits', () => {
    const state = { combatants: { lulu: { side: 'party' }, a: { side: 'enemy' }, b: { side: 'enemy' } } } as unknown as BattleState;
    const { ctx, played } = fakeCtx(sfxVoiceFor('ffx', () => state));
    noteSfxEvent(ctx, { ...actionStart('lulu', 'ability'), abilityId: 'flare' } as BattleEvent);
    for (const target of ['a', 'b']) {
      noteSfxEvent(ctx, { type: 'damage', targetId: target, sourceId: 'lulu', amount: 100, element: 'none', crit: false, hitIndex: 0, hitCount: 1 } as BattleEvent);
      playCue(ctx, 'damage');
    }
    expect(played).toEqual(['v2:flare', 'v2:hit-1']);
  });
});
