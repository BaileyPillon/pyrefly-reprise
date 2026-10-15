/**
 * The retired v2 stand-ins (r46-fix, FOC46-02): a v2 cue the final repack took out of the sprite (`RETIRED_V2_CUES`) must never leave a
 * game on the first-bank cue or the synth. For every `v2:` ask of each game's scripted fight (the real presenter and the real chapter
 * voice, `helpers/sfxFight.ts`), in every pack set a chapter of that game loads (`packsFor`), the real mixer (`AudioManager.playSfx`,
 * `helpers/sfxAnswer.ts`) answers with a recorded sound: a parity original, a v2 slice, or the original that covers it. On the live
 * build (d5bf2206) every `v2:` ask of both games was answered by a recording, so this is "no recording lost"; it covers the nine names
 * the second audio lane retired (the eight that stay retired and the dissolve that came back) and anything a later repack retires.
 *
 * The case that broke it: the fiend's dissolve is tagged FFX in the set (`V2_CUES`) but BOTH games play it at every defeat
 * (`battleVoice.ts`, `ko()`); the repack read only the tag, took it out of the sprite on the strength of FFX's recorded original,
 * and FFX-2's defeat (an ask with no event name, so no pack is consulted) fell to the first bank. FFX keeps the recorded original
 * of its own; FFX-2 plays the v2 cue it always played. Game case: both, each game its own.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RETIRED_V2_CUES } from '../../src/audio/sfxV2/retired.ts';
import { BOSS_PACKS, packsFor } from '../../src/audio/sfxV2/packs.ts';
import { answer, isRecording, parseAudioManifest, type Answer, type AnswerGame } from './helpers/sfxAnswer.ts';
import { playScenario, scenarios, type FightCue } from './helpers/sfxFight.ts';

const ROOT = resolve(import.meta.dirname, '../..');
const rawManifest = JSON.parse(readFileSync(join(ROOT, 'public', 'audio', 'manifest.json'), 'utf8')) as { sfxV2: { cues: Record<string, { duration: number; lufs?: number; truePeakDb?: number }> } };
const manifest = parseAudioManifest(rawManifest);
const GAMES: readonly AnswerGame[] = ['ffx', 'ffx2'];

/** The nine names the second audio lane (2026-10-13) retired; the dissolve was one of them and is back in the sprite. */
const NINE = ['buff-generic', 'dissolve-pyreflies', 'gun-burst', 'hit-dagger', 'hit-greatsword', 'hit-gun', 'hit-katana', 'hit-spear', 'water'];

/** Every chapter kind of a game, as the pack set it loads (a chapter with no boss pack plays its core alone). */
function packSets(game: AnswerGame): string[][] {
  const chapters = [null, ...Object.keys(BOSS_PACKS)];
  const sets = chapters.map((id) => packsFor(game, id));
  return [...new Map(sets.map((s) => [s.join('+'), s])).values()];
}

const nameOf = (key: string): string => (key.startsWith('v2:') ? key.slice(3) : key);
const describeAsk = (c: FightCue): string => `${c.key}${c.events ? ` events[${c.events.join(',')}]` : ''}`;

/** The distinct `v2:` asks of a game's scripted fights. */
async function v2Asks(game: AnswerGame): Promise<FightCue[]> {
  const seen = new Map<string, FightCue>();
  for (const scenario of scenarios(game)) {
    for (const cue of await playScenario(game, scenario)) {
      if (!cue.key.startsWith('v2:')) continue;
      seen.set(JSON.stringify([cue.key, cue.events ?? null, cue.coveredBy ?? null]), cue);
    }
  }
  return [...seen.values()];
}

describe('a retired v2 stand-in never leaves a game on the first bank', () => {
  const asksByGame = new Map<AnswerGame, FightCue[]>();

  it('finds the asks of both games\' scripted fights (the pin is not vacuous)', async () => {
    for (const game of GAMES) asksByGame.set(game, await v2Asks(game));
    const names = (g: AnswerGame): string[] => [...new Set(asksByGame.get(g)!.map((c) => nameOf(c.key)))];
    // FFX asks for the katana and spear blows, the water ladder, the buff and the fiend's dissolve; FFX-2 for its weapons, the burst and the dissolve.
    expect(names('ffx')).toEqual(expect.arrayContaining(['buff-generic', 'dissolve-pyreflies', 'hit-katana', 'hit-spear', 'water']));
    expect(names('ffx2')).toEqual(expect.arrayContaining(['dissolve-pyreflies', 'gun-burst', 'hit-dagger', 'hit-greatsword', 'hit-gun']));
    // Every name the lane retired is asked by at least one game, and the list is the nine less the dissolve.
    for (const name of NINE) expect(GAMES.some((g) => names(g).includes(name)), name).toBe(true);
    expect([...RETIRED_V2_CUES].sort()).toEqual(NINE.filter((n) => n !== 'dissolve-pyreflies'));
  }, 180_000);

  it.each(GAMES)('%s: every v2 ask is answered by a recording in every pack set a chapter loads (a retired name never falls to the first bank or the synth)', (game) => {
    const asks = asksByGame.get(game)!;
    expect(asks.length).toBeGreaterThan(20);
    const failures: string[] = [];
    for (const set of packSets(game)) {
      for (const ask of asks) {
        const a: Answer = answer(manifest, game, set, ask);
        if (!isRecording(a) && a.via !== 'covered') failures.push(`${game} ${describeAsk(ask)} with packs [${set.join(', ')}] -> ${a.via}:${a.played}${NINE.includes(nameOf(ask.key)) ? ' (a retired name)' : ''}`);
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('answers the fiend\'s defeat in each game with its own recording: FFX the original of ffx-core, FFX-2 the v2 cue it has always played', () => {
    for (const set of packSets('ffx')) {
      const ffx = answer(manifest, 'ffx', set, { key: 'v2:dissolve-pyreflies', events: ['dissolve-pyreflies'] });
      expect(ffx, `ffx [${set.join(', ')}]`).toMatchObject({ via: 'parity', played: 'dissolve-pyreflies', buffer: 'ffx-core' });
    }
    for (const set of packSets('ffx2')) {
      // FFX-2 asks with no event name (it has no recorded original of the dissolve), so no pack is consulted: the v2 slice answers.
      const ffx2 = answer(manifest, 'ffx2', set, { key: 'v2:dissolve-pyreflies', events: [] });
      expect(ffx2, `ffx2 [${set.join(', ')}]`).toMatchObject({ via: 'v2', played: 'v2:dissolve-pyreflies', buffer: 'v2' });
    }
    // The cue the live build played (d5bf2206's sprite): the same length and level in the manifest, and the same source set, so it is the same recording.
    expect(rawManifest.sfxV2.cues['dissolve-pyreflies']).toMatchObject({ duration: 4, lufs: -22, truePeakDb: -14.26 });
  });

  it('keeps a name in the sprite exactly when it is not on the retired list (the list is the sprite\'s complement)', () => {
    for (const name of RETIRED_V2_CUES) expect(rawManifest.sfxV2.cues[name], `${name} is retired but the sprite holds it`).toBeUndefined();
    expect(RETIRED_V2_CUES).not.toContain('dissolve-pyreflies');
    expect(rawManifest.sfxV2.cues['dissolve-pyreflies']).toBeDefined();
  });
});
