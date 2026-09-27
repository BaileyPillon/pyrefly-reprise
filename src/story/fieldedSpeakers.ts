/**
 * PR-0037 (D-212, Bailey 2026-09-26: "fielded only, with an authored
 * fallback"): during a mid-battle beat, only a character who is on the field
 * speaks.
 *
 * **Game case: both** [AGENTS.md rule 14]. The mid-battle line dispatch is the
 * shared story plumbing both games use (`src/story/dsl.ts`, CHK-020). In
 * practice the rule only ever bites in FFX: the FFX-2 party is always Yuna,
 * Rikku and Paine, all three fielded, with no reserve (`data/encounters.ts`
 * build records). It still runs there, so an FFX name heard in an FFX-2
 * chapter (Auron and Jecht on the Farplane, Chapter V) is recognised as a
 * voice rather than a benched member: party membership is per game.
 *
 * Pure: no DOM, no `three`. The battle adapter (`BattleScreenCutscenes`)
 * supplies the game and the fielded party ids.
 */

import type { SayStep, SpeakerId } from './dsl.ts';

export type StoryGame = 'ffx' | 'ffx2';

/**
 * Party speakers per game, mapped to their combatant ids. A speaker id not in
 * the game's table is not a party member there (a boss, an NPC, a comm or
 * Farplane voice) and is never held back.
 */
export const PARTY_SPEAKERS: Readonly<Record<StoryGame, Readonly<Partial<Record<SpeakerId, string>>>>> = {
  ffx: {
    tidus: 'tidus',
    yuna: 'yuna',
    auron: 'auron',
    wakka: 'wakka',
    lulu: 'lulu',
    kimahri: 'kimahri',
    rikku: 'rikku',
  },
  // FFX-2's voice ids carry `-x2`; the combatants are the bare names.
  ffx2: {
    'yuna-x2': 'yuna',
    'rikku-x2': 'rikku',
    paine: 'paine',
  },
};

/** The combatant id a party speaker stands for in `game`, or `undefined` for a non-party voice. */
export function partyCombatantFor(game: StoryGame, who: SpeakerId): string | undefined {
  return PARTY_SPEAKERS[game][who];
}

/** True when `who` may speak a mid-battle line with `fielded` on the field. */
export function mayVoice(game: StoryGame, who: SpeakerId, fielded: ReadonlySet<string>): boolean {
  const id = partyCombatantFor(game, who);
  return id === undefined || fielded.has(id);
}

/**
 * The line as it should be spoken with `fielded` on the field, or `null` to
 * drop it.
 *
 * The written speaker if they may speak; otherwise the first authored
 * {@link SayStep.fallback} who may, saying their own `text` if they have one
 * and the written line if not. A replaced speaker's portrait override does not
 * carry over (it named the benched speaker's painting); an `emotion` does only
 * when the stand-in gives none of their own.
 */
export function fieldedLine(step: SayStep, game: StoryGame, fielded: ReadonlySet<string>): SayStep | null {
  const { fallback, ...line } = step;
  if (mayVoice(game, step.who, fielded)) return line;
  for (const alt of fallback ?? []) {
    if (!mayVoice(game, alt.who, fielded)) continue;
    const out: SayStep = { ...line, who: alt.who, text: alt.text ?? step.text };
    delete out.portrait;
    if (alt.emotion !== undefined) out.emotion = alt.emotion;
    return out;
  }
  return null;
}
