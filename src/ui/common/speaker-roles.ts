import type { SpeakerId } from '../../story/dsl.ts';

/**
 * The short tracked tag shown beside a speaker's name in the dialogue box —
 * `Tidus [GUARDIAN]`, `Seymour [MAESTER]` — as drawn in the approved "Ink &
 * Gold" cutscene mockup (`docs/screenshots/mockups/A-dialogue.jpg`, spec
 * `docs/handoff/presentation-ink-and-gold.md`).
 *
 * Presentation copy, not battle data: it says who a speaker is *to Spira* at
 * the moment they speak, so the player can place a face they have not met in
 * ten years. Anyone the player already knows by name alone (FFX's airship crew,
 * the Gullwings' rivals) deliberately has no tag — an empty chip is noise. The FFX-2
 * Gullwings crew carry one shared plate since r29 (PR-0058).
 * A screen with better context (a chapter that knows Yuna is a sphere hunter,
 * not a summoner) passes its own `roleFor` to `DialogueBox` instead.
 */
export const SPEAKER_ROLES: Partial<Record<SpeakerId, string>> = {
  // FFX party — the pilgrimage, as Spira would introduce them.
  tidus: 'Guardian',
  yuna: 'Summoner',
  auron: 'Guardian',
  wakka: 'Guardian',
  lulu: 'Guardian',
  kimahri: 'Guardian',
  rikku: 'Guardian',

  // FFX antagonists and the dead.
  seymour: 'Maester',
  'seymour-macalania': 'Maester',
  'seymour-omnis': 'Maester',
  'seymour-natus': 'Maester',
  yunalesca: 'Unsent',
  jecht: 'Final Aeon',
  braska: 'High Summoner',
  'yu-yevon': 'Unsent',
  'fayth-boy': 'Fayth',

  // FFX supporting cast.
  zaon: 'First Final Aeon',
  'young-auron': 'Guardian',
  kelk: 'Ronso Elder',
  biran: 'Ronso',
  yenke: 'Ronso',
  isaaru: 'Summoner', // Chapter XIV (FFX only): a summoner on the temple's orders

  // FFX-2 — two years on, the same faces with different work.
  'yuna-x2': 'Sphere Hunter',
  'rikku-x2': 'Sphere Hunter',
  paine: 'Sphere Hunter',
  shuyin: 'Unsent',
  lenne: 'Songstress',
  nooj: 'Youth League',
  baralai: 'New Yevon',
  gippal: 'Machine Faction',
  // The Gullwings crew on the comm (PR-0058; FFX-2 only: FFX's Brother is the bare id `brother`,
  // which stays untagged). Shinra has no painting, so his line has the plate and the name only.
  'brother-x2': 'Gullwings',
  buddy: 'Gullwings',
  shinra: 'Gullwings',
};

/**
 * The FFX dead who speak from the Farplane inside FFX-2's Chapter V [writing-bible E7, "Farplane voice
 * system"; FFX-2 only]. In an FFX-2 box an FFX id is never a present speaker (its party ids carry `-x2`;
 * `fieldedSpeakers.ts` says the same), so they read as voices: one plate, "Farplane", not the FFX role
 * ("Final Aeon", "High Summoner") they had in FFX (PR-0161).
 */
const FARPLANE_VOICES: ReadonlySet<SpeakerId> = new Set<SpeakerId>(['jecht', 'braska', 'auron']);
export const FARPLANE_VOICE_ROLE = 'Farplane';

/** True when `who` is a Farplane voice in `game`'s box (always false in FFX, where they stand on stage). */
export function isFarplaneVoice(game: 'ffx' | 'ffx2' | undefined, who: SpeakerId): boolean {
  return game === 'ffx2' && FARPLANE_VOICES.has(who);
}

/** The tag for a speaker, or `undefined` when they should show a bare name. */
export function speakerRole(who: SpeakerId): string | undefined {
  return SPEAKER_ROLES[who];
}
