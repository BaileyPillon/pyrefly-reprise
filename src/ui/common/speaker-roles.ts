import type { SpeakerId } from '../../story/dsl.ts';

/**
 * The short tracked tag shown beside a speaker's name in the dialogue box —
 * `Tidus [GUARDIAN]`, `Seymour [MAESTER]` — as drawn in the approved "Ink &
 * Gold" cutscene mockup (`docs/screenshots/mockups/A-dialogue.jpg`, spec
 * `docs/handoff/presentation-ink-and-gold.md`).
 *
 * Presentation copy, not battle data: it says who a speaker is *to Spira* at
 * the moment they speak, so the player can place a face they have not met in
 * ten years. Anyone the player already knows by name alone (the airship crew,
 * the Gullwings' rivals) deliberately has no tag — an empty chip is noise.
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
};

/** The tag for a speaker, or `undefined` when they should show a bare name. */
export function speakerRole(who: SpeakerId): string | undefined {
  return SPEAKER_ROLES[who];
}
