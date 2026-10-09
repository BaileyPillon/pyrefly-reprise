/**
 * The numbers, the scores, the tools and the thanks on the BEHIND THE SCENES page. Data only: no code runs when this
 * module loads, so a build with the page's switch off leaves all of it out (`changelog/behindTheScenes.ts`).
 *
 * Every figure here was read from the project's own records on 2026-10-08 and is printed with that date
 * (`FACTS_AS_OF`); `tests/unit/behind-the-scenes-content.test.ts` re-checks what the repository can check (the chapter
 * counts, the critic's scores against `critic/rounds/`, the research notes, the art manifest, the audio manifest).
 * Bailey asks (decisions item 31, 2026-10-08): the page shows the critic's REAL scores; it names the AI tools; it credits
 * the community sources; and where it says something was measured, the words are exactly "measured from the real game
 * on Bailey's own copy" (`MEASURED_WORDING`), nothing more. When the page is approved and switched on, refresh these
 * numbers first (the handoff `docs/handoff/r395-int.md` lists where each one comes from).
 *
 * Game case: both. Nothing on the page is true of one game and not the other except where a line says which.
 */

/** The day the figures below were read. Printed on the page. */
export const FACTS_AS_OF = '8 October 2026';

/** The only words the page may use for how a number or a size was taken from the real game (decisions item 31 g). */
export const MEASURED_WORDING = "measured from the real game on Bailey's own copy";

export const FACTS = {
  /** 15 September 2026 to 8 October 2026, both days counted. */
  days: 24,
  commits: 2625,
  busiestDay: { date: '25 September', commits: 288 },
  changelogEntries: 57,
  decisions: 1061,
  piecesOfWork: 563,
  chapters: 18,
  chaptersFfx: 11,
  chaptersFfx2: 7,
  picturesApproved: 119,
  picturesTarget: 131,
  picturesRejected: 6,
  tests: 13618,
  testFiles: 919,
  linesOfCode: 265055,
  codeFiles: 1320,
  researchNotes: 39,
  /** The painted poses of the characters and bosses (the art manifest's count of states). */
  poses: 944,
  posesRepaired: 586,
  musicTracks: 28,
  elevenLabsTracks: 5,
  voiceLines: 200,
} as const;

/** One row of the critic's chart: the first score under today's rules and the latest, out of ten (null = never scored). */
export interface CriticRow {
  readonly id: string;
  readonly label: string;
  readonly first: number | null;
  readonly latest: number | null;
  /** Why there is no number, when there is none. */
  readonly why?: string;
}

/**
 * The critic's real scores, copied from its own reports (`critic/rounds/`). "First" is the first review under the
 * current rules: round 4 (20 September), and round 6 (21 September) for feel and narrative, which round 4 could not
 * score. "Latest" is round 23, the deep review of the live game on 6 October. Listed best first, as the chart draws them.
 */
export const CRITIC_ROWS: readonly CriticRow[] = [
  { id: 'combat', label: 'Combat', first: 8.5, latest: 9.4 },
  { id: 'narrative', label: 'Narrative', first: 7.6, latest: 9.0 },
  { id: 'prep', label: 'Preparation', first: 7.5, latest: 9.0 },
  { id: 'encounter', label: 'Encounters', first: 7.0, latest: 8.7 },
  { id: 'interface', label: 'Interface', first: 6.6, latest: 8.7 },
  { id: 'delivery', label: 'Delivery', first: 8.8, latest: 8.7 },
  { id: 'onboarding', label: 'Onboarding', first: 4.2, latest: 8.6 },
  { id: 'visual', label: 'Visual', first: 7.4, latest: 8.3 },
  { id: 'feel', label: 'Feel', first: 8.0, latest: 8.0 },
  { id: 'audio', label: 'Audio', first: null, latest: null, why: 'not scored: only Bailey’s ears can judge it' },
];

export const CRITIC = {
  /** The rounds the chart reads. */
  firstRound: 4,
  latestRound: 23,
  latestDate: '6 October',
  /** Its very first review, under the earlier rules: the headline score and the day. */
  firstHeadline: 3.5,
  firstDate: '19 September',
  /** Every round, and the ones that were full reviews of the whole game. */
  rounds: 23,
  deepRounds: 21,
  /** The scale the chart draws, the floor each category must reach and the gate for the whole game. */
  scaleMin: 4,
  scaleMax: 10,
  floor: 9.0,
  gate: 9.6,
} as const;

/** The AI tools the game was made with, in the order the page names them. The in-game Credits name the same ones when the page goes public. */
export interface MadeWith {
  readonly name: string;
  readonly by: string;
  /** What it did, in a clause that follows "for". */
  readonly did: string;
}

export const MADE_WITH: readonly MadeWith[] = [
  { name: 'Claude', by: 'Anthropic', did: 'building and reviewing the game' },
  { name: 'ChatGPT Images', by: 'OpenAI', did: 'the title paintings' },
  { name: 'ComfyUI with Animagine XL 4.0', by: 'open tools, run on Bailey’s own computer', did: 'most of the paintings' },
  { name: 'ElevenLabs Music and ElevenLabs voices', by: 'ElevenLabs', did: 'five music tracks and the spoken lines' },
  { name: 'Three.js, TypeScript and Vite', by: 'open source', did: 'the game itself' },
];

/** The community sources whose guides, wikis and data the research notes were checked against. Named in the page's thanks. */
export interface Source {
  readonly name: string;
  readonly what: string;
}

export const COMMUNITY_SOURCES: readonly Source[] = [
  { name: 'Jegged’s Final Fantasy X and X-2 guides', what: 'boss strategies and the numbers behind them' },
  { name: 'GameFAQs', what: 'the guides and FAQs written by their authors' },
  { name: 'The Final Fantasy Wiki', what: 'enemies, abilities, items and systems' },
  { name: 'GamerGuides', what: 'walkthroughs and boss pages' },
  { name: 'StrategyWiki', what: 'walkthroughs and battle pages' },
  { name: 'Game8', what: 'boss and ability pages' },
  { name: 'Grayfox96’s FFX RNG Tracker', what: 'its data files, built on the work of Karifean and Rossy__' },
];
