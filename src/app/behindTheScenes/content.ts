/**
 * The words and the pictures of the BEHIND THE SCENES page: five cards that tell it in two minutes, then the story in six
 * chapters. Data only (no code runs when this loads), so a build with the switch off leaves it all out.
 *
 * The format is Bailey's pick (decisions item 31, 2026-10-08): option A, "a story in six chapters", opening with option
 * C's five cards as the two-minute summary. The drafts are `D:/Tools/pyrefly-scratch/2026-10-08/behind-the-scenes/`
 * (`option-a-story.html`, `option-c-five-cards.html`); what changed from them, and why:
 *
 *  - NONE of Bailey's own words are quoted (he has not chosen which quotes, if any, appear): the draft's "look terrible"
 *    is gone. The critic's own sentence ("The game does not reliably finish.") stays, with its source: it is the critic's.
 *  - Where a size or a number came from the real game the words are `MEASURED_WORDING`, exactly, and nothing more.
 *  - No hidden chapter, no secret word, no account, no machine detail (`tests/unit/behind-the-scenes-content.test.ts`).
 *  - Chapters II (the research) and IV (music and voices) were outlined only in the drafts; they are written here from the
 *    project's own notes (`research/`, `docs/audio/`, `docs/handoff/r395-voice.md`).
 *  - The type is never under the game's 14 px floor (the drafts used 9 to 12 px labels).
 *  - The audition screenshot is an illustration drawn in HTML (`kind: 'listen'`), not a picture of the real page.
 *
 * Inline marks in a string: `**bold**` and `==highlight==`; everything else is plain text, escaped when it is drawn.
 */

import { BTS_TITLE } from '../changelog/behindTheScenes.ts';
import { CRITIC, FACTS, FACTS_AS_OF, MEASURED_WORDING } from './facts.ts';

/** A picture in `public/bts/` and what it shows, for a screen reader. */
export interface Img {
  readonly file: string;
  readonly alt: string;
}

export interface Tile {
  readonly n: string;
  readonly l: string;
  readonly s: string;
}

export type Figure =
  | { readonly kind: 'split'; readonly left: Img; readonly right: Img; readonly leftTag: string; readonly rightTag: string; readonly caption: string; readonly note: string }
  | { readonly kind: 'dirs'; readonly items: readonly { readonly img: Img; readonly label: string; readonly pick: boolean }[]; readonly caption: string; readonly note: string }
  | { readonly kind: 'photo'; readonly img: Img; readonly caption: string; readonly note?: string }
  | { readonly kind: 'compare'; readonly img: Img; readonly leftTag: string; readonly rightTag: string; readonly caption: string; readonly note: string }
  | { readonly kind: 'duo'; readonly imgs: readonly [Img, Img]; readonly caption: string; readonly note: string }
  | { readonly kind: 'big'; readonly from: string; readonly to: string; readonly text: string }
  | { readonly kind: 'tiles'; readonly tiles: readonly Tile[] }
  | { readonly kind: 'callout'; readonly text: string }
  | { readonly kind: 'listen'; readonly rows: readonly { readonly n: string; readonly s: string }[]; readonly caption: string }
  | { readonly kind: 'steps'; readonly steps: readonly { readonly name: string; readonly text: string }[] }
  | { readonly kind: 'chart' }
  | { readonly kind: 'firstScore' }
  | { readonly kind: 'sources' }
  | { readonly kind: 'numbers'; readonly tiles: readonly Tile[] }
  | { readonly kind: 'madeWith' };

export interface Chapter {
  readonly id: string;
  readonly numeral: string;
  readonly name: string;
  /** The heading over the painted band, with `|` for a line break. */
  readonly heading: string;
  /** The painting the band and the page's backdrop show. */
  readonly band: Img;
  readonly lead: string;
  readonly prose: readonly string[];
  /** Figures drawn across the page above the two columns, below them, and in the right column. */
  readonly top?: readonly Figure[];
  readonly side: readonly Figure[];
  readonly bottom?: readonly Figure[];
}

export interface Card {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly big?: { readonly n: string; readonly text: string };
  readonly text: string;
  readonly chips?: readonly { readonly n: string; readonly s: string }[];
  readonly credit?: string;
  readonly visual: Figure;
  readonly backdrop: Img;
}

const pic = (file: string, alt: string): Img => ({ file, alt });

export const IMAGES = {
  keyart: pic('keyart-farplane.jpg', 'The title painting: Yuna, Rikku and Paine in a field of flowers beside a glowing tower'),
  silhouette: pic('keyart-silhouette.jpg', 'An earlier title painting: a glowing tower on the water at dusk'),
  gagazet: pic('bd-gagazet.jpg', 'A painted backdrop of Mt. Gagazet under a pale moon'),
  zanarkand: pic('bd-zanarkand.jpg', 'A painted backdrop of the Zanarkand dome'),
  bevelle: pic('bd-bevelle.jpg', 'A painted backdrop of the halls of Bevelle'),
  farplane: pic('bd-farplane.jpg', 'A painted backdrop of the Farplane, a peak under falling lights'),
  dreamsEnd: pic('bd-dreams-end.jpg', 'A painted backdrop of a red sky over a burning mountain'),
  pixel: pic('pixel-prototype.jpg', 'Day one: pixel-art figures in a blocky 3D scene'),
  painted: pic('painted-concept.jpg', 'Day one, evening: the painted 2.5D battle concept'),
  dirA: pic('dir-a.jpg', 'Direction A, Ink and Gold'),
  dirB: pic('dir-b.jpg', 'Direction B, Pyrefly Slash'),
  dirC: pic('dir-c.jpg', 'Direction C, Sending Red'),
  tidus: pic('tidus-poses.jpg', 'Six battle poses of Tidus made from one reference picture'),
  yuna: pic('yuna-ba.jpg', 'Yuna’s head and shoulders at 3x, before and after the fringe repair'),
  criticMenu: pic('critic-first-menu.jpg', 'The critic’s capture of Chapter I’s first battle menu'),
  criticReels: pic('critic-reels.jpg', 'The critic’s capture of Chapter XVI’s Lady Luck reels stopped on three cherries'),
} as const;

/** Every picture file the page names, for the test that checks they exist and ship with the page. */
export const IMAGE_FILES: readonly string[] = Object.values(IMAGES).map((i) => i.file);

const n = (v: number): string => v.toLocaleString('en-US');

/** The nine counts of card five and the ten of chapter VI, as the page prints them. */
const NUMBER_TILES: readonly Tile[] = [
  { n: n(FACTS.days), l: 'Days', s: '15 September to 8 October' },
  { n: n(FACTS.commits), l: 'Commits', s: `the busiest day, ${FACTS.busiestDay.date}, had ${FACTS.busiestDay.commits}` },
  { n: n(FACTS.changelogEntries), l: 'Changelog entries', s: 'every build that went live or to a preview' },
  { n: n(FACTS.decisions), l: 'Decisions', s: 'in the public ledger' },
  { n: n(FACTS.piecesOfWork), l: 'Pieces of work', s: 'builds, art installs, deploys, reviews' },
  { n: n(FACTS.chapters), l: 'Chapters', s: `${FACTS.chaptersFfx} from FFX and ${FACTS.chaptersFfx2} from FFX-2` },
  { n: n(FACTS.picturesApproved), l: 'Pictures approved', s: `of ${FACTS.picturesTarget} target pictures; ${FACTS.picturesRejected} rejected` },
  { n: n(FACTS.tests), l: 'Tests', s: `automated checks, in ${n(FACTS.testFiles)} files` },
  { n: n(FACTS.linesOfCode), l: 'Lines of code', s: `TypeScript, in ${n(FACTS.codeFiles)} files` },
  { n: n(CRITIC.rounds), l: 'Critic rounds', s: `${CRITIC.deepRounds} of them deep reviews` },
];

/** The page's opening: what it is, in a few lines. */
export const INTRO = {
  eyebrow: 'An unofficial fan tribute',
  title: BTS_TITLE,
  lead: 'How Echoes of Spira was made',
  text:
    'On 15 September 2026 the first commit was made. Today the game holds eighteen boss fights from Final Fantasy X and X-2, ' +
    'painted, scored and tested. Bailey decides what the game is; a team of AI agents builds it. This is the honest version: ' +
    'two minutes first, then the whole story in six chapters.',
  twoMinutes: 'About two minutes',
  storyHeading: 'The story in six chapters',
  asOf: `Numbers are as of ${FACTS_AS_OF}.`,
} as const;

export const CARDS: readonly Card[] = [
  {
    id: 'k1',
    label: 'The idea',
    title: 'Five fights and a link',
    big: { n: String(FACTS.days), text: 'days from the first commit' },
    text:
      'On 15 September a fan tribute began: five boss fights from Final Fantasy X and X-2, playable from a link. ' +
      'The pixel-art look was dropped within a day for **painted 2.5D**. Now there are **eighteen** fights.',
    chips: [
      { n: '5 → 18', s: 'fights' },
      { n: 'Unofficial', s: 'non-commercial fan work' },
    ],
    visual: {
      kind: 'split',
      left: IMAGES.pixel,
      right: IMAGES.painted,
      leftTag: 'Morning · pixel',
      rightTag: 'Evening · painted',
      caption: 'The first screenshot, 15 September, and the look it became the same day.',
      note: '',
    },
    backdrop: IMAGES.gagazet,
  },
  {
    id: 'k2',
    label: 'The art',
    title: 'Painted by machines, chosen by a person',
    big: { n: n(FACTS.poses), text: 'painted poses of characters and bosses' },
    text:
      'Every painting was made with AI image tools, most of them on Bailey’s own computer, and Bailey decides which ones go in. ' +
      '**Nothing is replaced without his yes.**',
    chips: [
      { n: String(FACTS.picturesApproved), s: `of ${FACTS.picturesTarget} pictures approved` },
      { n: String(FACTS.posesRepaired), s: 'poses repaired, none redrawn' },
    ],
    visual: { kind: 'photo', img: IMAGES.keyart, caption: 'The title painting, made with ChatGPT Images and approved by Bailey on 5 October.' },
    backdrop: IMAGES.keyart,
  },
  {
    id: 'k3',
    label: 'The sound',
    title: 'Heard by Bailey, not by the agents',
    text:
      'The score began as original music written as code and played through sampled instruments. On 7 October **five tracks** were ' +
      'made with ElevenLabs Music from written briefs that name no composer, franchise, character or melody, and the lines of ' +
      'Tidus, Yuna and Auron are spoken by ElevenLabs voices. AI agents cannot hear, so **Bailey picked each one by ear**.',
    credit: `**Voices:** ${FACTS.voiceLines} lines for Tidus, Yuna and Auron play in the Final Fantasy X chapters.`,
    visual: {
      kind: 'listen',
      rows: [
        { n: String(FACTS.musicTracks), s: 'music tracks in the game' },
        { n: String(FACTS.elevenLabsTracks), s: 'made with ElevenLabs Music' },
        { n: String(FACTS.voiceLines), s: 'spoken lines in the FFX chapters' },
      ],
      caption: 'How a cue is chosen: he listens, scores it from 1 to 10, and picks.',
    },
    backdrop: IMAGES.zanarkand,
  },
  {
    id: 'k4',
    label: 'The critic',
    title: 'A reviewer who never writes code',
    big: { n: String(CRITIC.firstHeadline), text: `its first score, out of 10, on ${CRITIC.firstDate}` },
    text:
      '**“The game does not reliably finish.”** After ' +
      `${CRITIC.rounds} rounds, three of nine scored categories meet the 9.0 floor and six do not yet. ` +
      '**The game is not at 9.6, and this page will not pretend it is.**',
    visual: { kind: 'chart' },
    backdrop: IMAGES.bevelle,
  },
  {
    id: 'k5',
    label: 'The numbers',
    title: 'Twenty-four days, counted',
    text:
      'One person deciding, a team of AI agents building, and a reviewer scoring every build. ' +
      '**Every decision and piece of work is written down.**',
    credit: 'madeWith',
    visual: { kind: 'numbers', tiles: NUMBER_TILES.slice(0, 9) },
    backdrop: IMAGES.silhouette,
  },
];

export const CHAPTERS: readonly Chapter[] = [
  {
    id: 'c1',
    numeral: 'I',
    name: 'The idea',
    heading: 'Five fights and a link',
    band: IMAGES.gagazet,
    lead: 'On 15 September 2026 Bailey started a fan tribute: five boss fights from Final Fantasy X and X-2, in a game that runs in a web browser, so a friend could open a link and play.',
    prose: [
      'It is unofficial and non-commercial, and nothing from the games’ files is in it. The code, the paintings, the music and the writing were all made new for this project.',
      'The first plan was pixel-art figures in small 3D scenes. The first screenshot read as a retro prototype, and by that evening the game had become ==painted 2.5D==: painted backdrops and painted characters, lit and moving in 3D.',
      'The same day Bailey was shown three directions for the menus and the battle screen. **A, Ink & Gold**, won: ivory slabs, gold accents, slanted panels. B (Pyrefly Slash) and C (Sending Red) were set aside. Every screen since has been drawn in A.',
      'That became the rule for everything: before anything Bailey will see or hear is made, the team shows him two to four finished-looking options. He picks. Then it is built.',
    ],
    side: [
      {
        kind: 'split',
        left: IMAGES.pixel,
        right: IMAGES.painted,
        leftTag: 'Morning · pixel',
        rightTag: 'Evening · painted',
        caption: 'The first screenshot, and the look it became the same day',
        note: 'The pixel prototype on the left, the painted concept on the right.',
      },
      {
        kind: 'dirs',
        items: [
          { img: IMAGES.dirA, label: 'A · Ink & Gold · chosen', pick: true },
          { img: IMAGES.dirB, label: 'B · Pyrefly Slash', pick: false },
          { img: IMAGES.dirC, label: 'C · Sending Red', pick: false },
        ],
        caption: 'Three directions for the interface, shown on day one',
        note: 'He picked A that evening. The other two were never built.',
      },
      {
        kind: 'big',
        from: '5',
        to: String(FACTS.chapters),
        text: `fights in ${FACTS.days} days: eleven from Final Fantasy X and seven from X-2, from Seymour Flux on Mt. Gagazet to the two fights against Sin.`,
      },
    ],
  },
  {
    id: 'c2',
    numeral: 'II',
    name: 'The research',
    heading: 'Numbers with a source',
    band: IMAGES.farplane,
    lead: 'A boss fight is a set of numbers: how much health, how fast, which attacks, which element it fears. From the first day the rule was that none of them may be invented.',
    prose: [
      `Every number in the game comes from one of the project’s ==${FACTS.researchNotes} research notes==, each tagged with where it came from: a player’s guide, a community wiki, or the real game. If something has no source, it is left alone and the gap is written down.`,
      `Some answers are not written down anywhere, so they were ==${MEASURED_WORDING}==: how big a fiend stands next to the girls, and how long the name of an enemy’s spell stays on screen.`,
      'Chapter VI’s goons had been drawn at 70 percent of the party’s height. In the real game Ormi stands 1.15 times as tall as the girls, Logos 1.26 and Dr. Goon 1.10, and since release 39.4.1 they are drawn that way. An enemy’s spell name shows in the help bar for about a second and a half to two seconds, and a plain attack shows no name at all.',
      'Nothing taken from the games is inside this one. No game file, model, picture or frame is stored in the project or shipped in the game: only numbers and words are kept, and everything you see and hear was made new.',
    ],
    side: [{ kind: 'sources' }],
  },
  {
    id: 'c3',
    numeral: 'III',
    name: 'The art',
    heading: 'Painted by machines,|chosen by a person',
    band: IMAGES.zanarkand,
    lead: 'Every painting in the game was made with AI image tools, and Bailey decides which ones go in.',
    prose: [
      'Most are made on Bailey’s own computer. The title painting, Yuna, Rikku and Paine in a field of flowers, came from a different tool: **ChatGPT Images**, in a small studio the team built called the Art Room. One AI paints, another directs and reviews, and only Bailey approves. He approved it on 5 October.',
      'Nothing is replaced without his yes. Every release checks that no approved painting has changed. When 586 poses needed a clean-up on 7 October, the fix took the white fringe off hair and cloth and made each costume’s colour match from pose to pose. **Nothing was redrawn.**',
    ],
    top: [
      {
        kind: 'steps',
        steps: [
          { name: 'Reference', text: 'A picture fixes a character’s face, so it matches from pose to pose.' },
          { name: 'Pose', text: 'A stick-figure skeleton sets the pose: attack, cast, hurt, fall.' },
          { name: 'Paint', text: 'An open anime model, Animagine XL 4.0, in ComfyUI on Bailey’s own computer.' },
          { name: 'Enlarge', text: 'An upscaler sharpens it for 1440p and 4K; the background is cut away.' },
          { name: 'Approve', text: 'Only Bailey says yes. Approved paintings are fingerprinted and never swapped.' },
        ],
      },
    ],
    side: [
      { kind: 'photo', img: IMAGES.tidus, caption: 'One reference picture, six poses', note: 'The same face from idle to victory, from the project’s early art tests.' },
      { kind: 'compare', img: IMAGES.yuna, leftTag: 'Before', rightTag: 'After', caption: 'The 7 October clean-up, at 3x', note: 'The same painting: the hard white fringe on hair and cloth is gone.' },
      {
        kind: 'tiles',
        tiles: [
          { n: n(FACTS.poses), l: 'poses painted', s: 'characters and bosses, each at up to 4x size' },
          { n: String(FACTS.posesRepaired), l: 'poses repaired', s: '218 FFX and 368 FFX-2' },
          { n: String(FACTS.picturesApproved), l: 'pictures approved', s: `of ${FACTS.picturesTarget} target pictures; ${FACTS.picturesRejected} rejected` },
        ],
      },
      { kind: 'callout', text: '**Plainly:** every painting in the game is AI-generated, and none of it is copied from the games.' },
    ],
  },
  {
    id: 'c4',
    numeral: 'IV',
    name: 'Music & voices',
    heading: 'Heard by Bailey,|not by the agents',
    band: IMAGES.dreamsEnd,
    lead: 'Agents cannot hear, so every piece of music and every voice in the game was chosen by Bailey, by ear.',
    prose: [
      'The original score is written as code: notes and instruments described in files, then played through freely licensed sampled instruments (a grand piano, an orchestra, a drum kit, a concert hall) and rendered to sound before the game ships. The game began that way, and most of its music still is.',
      `On 7 October some tracks became AI-made takes: ==${FACTS.elevenLabsTracks} tracks==, among them the title music and the chapter select board, were generated with **ElevenLabs Music** from written briefs that name no composer, franchise, character or melody. Several takes of each were made; Bailey listened and picked. If a take ever fails to load, the game falls back to the older rendered score.`,
      `Tidus, Yuna and Auron speak in the Final Fantasy X chapters: ==${FACTS.voiceLines} spoken lines==, made with **ElevenLabs voices** and picked by Bailey against how the characters sound in the real game. Nothing is taken from the games’ own voice recordings. Every other character, and Final Fantasy X-2, is still text only.`,
      'Every cue passes the checks an agent can run (loudness, clipping, length). Whether it is good is a question only ears can answer, so the critic gives audio no score.',
    ],
    side: [
      {
        kind: 'listen',
        rows: [
          { n: String(FACTS.musicTracks), s: 'music tracks in the game' },
          { n: String(FACTS.elevenLabsTracks), s: 'made with ElevenLabs Music' },
          { n: String(FACTS.voiceLines), s: 'spoken lines in the FFX chapters' },
        ],
        caption: 'How a cue is chosen: he listens, scores it from 1 to 10, and picks.',
      },
    ],
  },
  {
    id: 'c5',
    numeral: 'V',
    name: 'The critic',
    heading: 'A reviewer who|never writes code',
    band: IMAGES.bevelle,
    lead: 'On the first day, within an hour of the first commit, the team wrote down the rules for an independent critic: another AI agent whose only job is to play the game, score it, and say what is wrong.',
    prose: [
      'It never writes code. It plays with real key presses, scores the game in ten categories out of ten, and sends back a ranked list of problems. The bar is **9.6 overall, with no category under 9.0**.',
      `Its first review, on ${CRITIC.firstDate}, scored the game ==${CRITIC.firstHeadline} out of 10==. “The game does not reliably finish,” it wrote: Bahamut could reach 0 HP and then sit on the battle screen for five minutes without the fight ending.`,
      `In all there have been ${CRITIC.rounds} rounds, ${CRITIC.deepRounds} of them deep reviews of the whole game. Every build that goes live is checked, and how deep the check goes follows what changed.`,
      `The chart shows round ${CRITIC.latestRound}, the deep review of the live game on ${CRITIC.latestDate}. Three categories meet the 9.0 floor and six do not yet. Audio has no score at all: agents cannot hear, so only Bailey’s ears can judge it. **The game is not at 9.6, and this page will not pretend it is.**`,
    ],
    side: [
      { kind: 'chart' },
      { kind: 'firstScore' },
      {
        kind: 'duo',
        imgs: [IMAGES.criticMenu, IMAGES.criticReels],
        caption: 'Two frames the critic captured itself',
        note: 'Playing the live game by real key presses: Chapter I’s first menu, and Chapter XVI’s Lady Luck reels on three cherries.',
      },
    ],
  },
  {
    id: 'c6',
    numeral: 'VI',
    name: 'The numbers',
    heading: 'Twenty-four days, counted',
    band: IMAGES.silhouette,
    lead: 'One person deciding, a team of AI agents building, and a reviewer scoring every build. Everything below is written down in the project’s own public records.',
    prose: [],
    side: [],
    bottom: [{ kind: 'numbers', tiles: NUMBER_TILES }, { kind: 'madeWith' }],
  },
];

/** What the footer says about the figures. */
export const COUNTS_NOTE = `Counts are from the project’s own public records (the decisions and actions ledgers, the changelog, the repository) as of ${FACTS_AS_OF}.`;
