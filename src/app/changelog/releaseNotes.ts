/**
 * What the title screen's CHANGELOG panel says: ONE short player note per release, newest first.
 *
 * Bailey, 2026-10-08: "Include a changelog button on the title screen and build number should be shown on the title
 * screen." He took option A of the measured mock-up and "all your recommendations": the panel lists releases newest
 * first, each line tagged FFX, FFX-2 or Both, and its text comes from THIS file and from nothing else. It is not
 * CHANGELOG.md. That file is written after a deploy, is engineering prose and, in places, names the hidden chapters'
 * secret words; this one is written BEFORE a deploy, in the words a player would use, three to six lines a release.
 *
 * The rules that keep it that way live in `validateReleaseNotes`, and `tests/unit/release-notes.test.ts` runs it over
 * the real list on every test run. `tools/deploy-pages.mjs` runs it too, and refuses to deploy a release whose note
 * is not the newest one here (`tools/release-notes.mjs`): write the note, commit it, then deploy with
 * `--release=<name>`. The name on the title screen's build number is that same `--release` (`buildInfo.ts`).
 *
 * Game case: both. The panel is on the title, the front door of FFX and FFX-2 alike; each LINE carries its own case
 * (AGENTS.md rule 14): `FFX` for a change only FFX chapters show, `FFX-2` for one only FFX-2 chapters show, `Both` for
 * shared plumbing or a change that is true of both.
 *
 * This is a leaf module on purpose (no imports, only syntax Node can strip): the deploy tool loads it straight from
 * the source tree to read the newest release and to run the validator before anything is built.
 */

/** Which game a line is about. Printed as a small chip in front of the line. */
export type NoteTag = 'FFX' | 'FFX-2' | 'Both';

export interface ReleaseNoteLine {
  readonly tag: NoteTag;
  /** Player words, one sentence, ending in a full stop. Plain text: the panel escapes it. */
  readonly text: string;
}

export interface ReleaseNote {
  /** The release's name, as `--release=` stamps it on the build: `39.4.2`. */
  readonly release: string;
  /** The day it went live, US Eastern (the changelog's own dates), `YYYY-MM-DD`. */
  readonly date: string;
  /** Three to six lines (`NOTE_LINES`). */
  readonly lines: readonly ReleaseNoteLine[];
}

export const NOTE_TAGS: readonly NoteTag[] = ['FFX', 'FFX-2', 'Both'];

/** How many lines a release's note may have: short enough to read at a glance on the title screen. */
export const NOTE_LINES = { min: 3, max: 6 } as const;

/** The longest a line may be, so the panel stays a list and not a report. */
export const NOTE_TEXT_MAX = 200;

/** A release name: `39.5`, `39.4.2`, `31a`. The same shape `tools/build-stamp.mjs` accepts for `--release`. */
export const RELEASE_NAME = /^[0-9]+(?:\.[0-9]+)*[a-z]?$/;

/**
 * Words a player note must never contain: the hidden chapters and their secret words stay hidden (Bailey, 2026-10-08:
 * "NEVER mention hidden chapters or secret words"). The Chapter VI group is named by its fiends and by its chapter
 * number in a note, never by the word that opens the hidden chapter on the board.
 */
export const FORBIDDEN_NOTE_WORDS: readonly RegExp[] = [
  /leblanc/i,
  /\blimit\b/i,
  /hidden/i,
  /secret/i,
  /experiment/i,
  /\bff\s?7\b/i,
  /final fantasy vii\b/i,
  /guard scorpion/i,
];

/**
 * Every release the panel lists, newest first. A new release adds its entry at the TOP before it is deployed.
 *
 * 39.4, 39.4.1 and 39.4.2 are written from CHANGELOG.md and the 39.4.2 commit messages, in player words, with the
 * hidden chapters left out. 39.4.3 to 55 are written the same way from their CHANGELOG entries and handoff notes (release
 * 49 carried nothing a player sees outside the hidden chapters, so it has no note). Older releases are not listed:
 * the panel starts here.
 */
export const RELEASE_NOTES: readonly ReleaseNote[] = [
  {
    release: '56',
    date: '2026-10-19',
    lines: [
      { tag: 'FFX-2', text: 'Actions now take the time their own animation takes, so bosses act less often between your turns and several fights, Trema and Angra Mainyu among them, get easier.' },
      { tag: 'FFX-2', text: 'The Den of Woe guide and tip now have you start the Hero Drinks once Nooj is down to about half his health, so a girl is Invincible when his Lightfall lands.' },
      { tag: 'FFX', text: 'Yuna’s Grand Summon works with a finger on a phone: tap an aeon to choose it, tap the title to go back, and a greyed aeon shakes.' },
      { tag: 'FFX', text: 'An aeon’s Defend no longer prints IMMUNE over your own aeon; a status move a foe resists completely still says IMMUNE.' },
      { tag: 'FFX', text: 'Yuna’s Overdrive row now reads “Open the Overdrive menu.” where it used to say “Timed input”.' },
    ],
  },
  {
    release: '55',
    date: '2026-10-18',
    lines: [
      { tag: 'Both', text: 'A second title screen, The Echo, can be chosen on the PRESENTATION page in OPTIONS, with two more chapter select tracks; the Farplane screen and track B stay the defaults.' },
      { tag: 'Both', text: 'The title screen has a CHANGELOG entry (key L) with a note for each release, and it shows the build number.' },
      { tag: 'FFX', text: 'Tidus, Yuna and Auron speak in the FFX chapters, with VOICE and VOICE-OVER rows in OPTIONS.' },
      { tag: 'FFX', text: 'Kimahri and Lulu are drawn as jointed figures that move from pose to pose, instead of swapping between paintings.' },
      { tag: 'FFX', text: 'The command menu follows the game more closely: rows grey where the game greys them, one-entry lists open, and a cure starts on the caster.' },
      { tag: 'FFX', text: 'Chapter III’s later fights lose the aeons Yu Yevon has taken, and Grand Summon no longer lets you pick a knocked-out aeon.' },
    ],
  },
  {
    release: '54',
    date: '2026-10-18',
    lines: [
      { tag: 'FFX', text: 'Bosses use the game’s own records: Seymour Flux cannot be Slowed, Evrae can be Doomed, and the Yu Pagodas are immune to Shell, Protect, Reflect and the Nul spells.' },
      { tag: 'FFX', text: 'Lulu’s Doublecast is two separate choices at the menu, a spell and its target each time, and each cast pays its own cost.' },
      { tag: 'FFX', text: 'Chapter XIV: in Isaaru’s three aeon duels Defend is off and Yuna’s menu is Summon and Grand Summon only, as in the game.' },
      { tag: 'FFX', text: 'The Isaaru strategy guide says what Yuna’s menu is in those duels.' },
    ],
  },
  {
    release: '53',
    date: '2026-10-17',
    lines: [
      { tag: 'Both', text: 'One rule now sizes every standing pose, so a figure keeps its size when it changes pose; FFX-2’s dresspheres change most.' },
      { tag: 'Both', text: 'A strike starts more gently, and a slow frame is a slow frame, so a pose swap jerks the figure less.' },
      { tag: 'Both', text: 'The battle-start card waits for the camera’s framing, so the first menu no longer opens over a figure still being resized.' },
      { tag: 'FFX', text: 'An action that hits several targets lands hit by hit in the game’s own order.' },
      { tag: 'FFX-2', text: 'A chain lasts as long as the target’s own flinch, so the window differs from body to body.' },
      { tag: 'FFX-2', text: 'Chapter VI: the later acts open like fresh fights, as in the game.' },
    ],
  },
  {
    release: '52',
    date: '2026-10-17',
    lines: [
      { tag: 'Both', text: 'A painting nobody checked is no longer drawn: the figure shows the next pose down instead of swapping to one the engine cannot place.' },
      { tag: 'Both', text: 'A pose change in the middle of a fade no longer drops a painting that still shows, which had left a hole in the figure and a step of the head.' },
      { tag: 'Both', text: '36 painted figures, among them Valefor, Ixion, Paragon, Sin and its fins, now carry the measurements the pose checks need.' },
      { tag: 'FFX-2', text: 'Five Lady Luck poses stand on the floor at their true height.' },
    ],
  },
  {
    release: '51',
    date: '2026-10-17',
    lines: [
      { tag: 'FFX', text: 'The Overdrive minigames are the game’s own: Swordplay’s marker moves in whole steps and its gold zone is the game’s narrower one.' },
      { tag: 'FFX', text: 'Counterattack, Evade and Counter and Magic Counter answer a hit the way the game decides it.' },
      { tag: 'FFX', text: 'What a boss leaves behind (gil, AP and loot) is the game’s own roll, paid the moment it falls.' },
      { tag: 'FFX-2', text: 'Rewards arrive the moment a monster falls, not when the battle is won.' },
      { tag: 'FFX-2', text: 'A Confused girl acts on her own, picking from what a Confused girl may do.' },
      { tag: 'FFX-2', text: 'The 44 Garment Grids follow the game, and the Alchemist’s Mix row is greyed until its item picker exists.' },
    ],
  },
  {
    release: '50.1',
    date: '2026-10-16',
    lines: [
      { tag: 'FFX', text: 'A hurt Lulu is no longer drawn at two thirds of her height in any chapter.' },
      { tag: 'FFX', text: 'Lulu’s low-HP slouch is drawn at her true height too.' },
      { tag: 'Both', text: 'Nothing else changed in the regular chapters: the fights play exactly as they did.' },
    ],
  },
  {
    release: '50',
    date: '2026-10-16',
    lines: [
      { tag: 'FFX', text: 'Battles start the way the game’s do: every battle spends the game’s start-up roll, and the opening shuffle in Chapters VII and XII follows the game.' },
      { tag: 'FFX-2', text: 'An item leaves the bag the moment a girl picks it, so two girls can no longer both take the last Phoenix Down.' },
      { tag: 'FFX-2', text: 'While the last spells of a fight finish, the screen says so and the command window closes on the last blow.' },
      { tag: 'FFX-2', text: 'The greyed White Magic row under Itchy says why, and Osmose reads “MP damage”.' },
      { tag: 'FFX-2', text: 'At phone width the enemy header no longer prints names over each other, as Vegnagun’s Bulwarks and Redoubts did.' },
    ],
  },
  {
    release: '48',
    date: '2026-10-14',
    lines: [
      { tag: 'FFX', text: 'Rikku’s Mix works the way the game’s does: any two items make something.' },
      { tag: 'FFX-2', text: 'The girls’ automatic abilities work the way the game’s do, and the battle menu follows the game’s own rules.' },
      { tag: 'FFX-2', text: 'The Silence card says no spells, Dances or Songs, and the move text reads the game’s own rows (MP damage, Osmose, Delta Attack).' },
      { tag: 'FFX-2', text: 'While a girl is Itchy on a desktop, the greyed Attack, Skill and Item keep their names.' },
    ],
  },
  {
    release: '47',
    date: '2026-10-14',
    lines: [
      { tag: 'Both', text: 'A new ACCESSIBILITY tab in the pause menu, right after OPTIONS, holds TEXT SIZE and four more rows.' },
      { tag: 'Both', text: 'REDUCE FLASHES softens 22 flashing effects to about a third of their strength.' },
      { tag: 'Both', text: 'COLOUR VISION (red-green or blue-yellow) changes only the four things that blur together.' },
      { tag: 'FFX', text: 'The command rules follow the game’s own checks: Silence cuts off White and Black Magic, and a Silenced Yuna can still summon.' },
      { tag: 'FFX-2', text: 'Rikku’s eight brighter dresspheres are brought down to Yuna’s colour level, her hair kept golden.' },
      { tag: 'Both', text: 'The small files that sit beside the paintings on the site are cut to what the game reads, so pages load less.' },
    ],
  },
  {
    release: '46',
    date: '2026-10-14',
    lines: [
      { tag: 'Both', text: '29 more of the games’ everyday sounds are recorded originals, each within 1.5 dB of the sound it replaces.' },
      { tag: 'FFX-2', text: 'Chapter IV’s quiet victory tune stops when you press Continue after the tally.' },
      { tag: 'Both', text: 'The victory tunes of both games and of Chapter IV loop without a breath.' },
      { tag: 'FFX-2', text: 'An ordinary enemy’s defeat plays the recorded sound it has.' },
      { tag: 'Both', text: 'On a phone, the party prep page’s small coloured text uses four approved shades.' },
    ],
  },
  {
    release: '45',
    date: '2026-10-13',
    lines: [
      { tag: 'Both', text: '27 more music tracks made with ElevenLabs join or replace the score, and the results screen has its own victory intro and loop.' },
      { tag: 'Both', text: '18 more of the games’ everyday sounds are recorded originals.' },
      { tag: 'Both', text: 'On a phone, the first-run guide’s arrow no longer prints over the MORE BELOW cue.' },
      { tag: 'FFX-2', text: 'Chapter XIII: Paragon’s size step lands before the figure is on screen.' },
    ],
  },
  {
    release: '44',
    date: '2026-10-13',
    lines: [
      { tag: 'Both', text: 'Bosses and aeons arrive as pyreflies gathering, instead of appearing whole in one frame.' },
      { tag: 'Both', text: 'On a phone, party prep is one long page with a pinned tab bar and sections that fold.' },
      { tag: 'FFX-2', text: 'Chapter XIII: the move advisor puts the chapter’s own line on top.' },
      { tag: 'Both', text: 'The chapter board loads small copies of the pictures in its strips first, so it opens with far less to download.' },
    ],
  },
  {
    release: '43',
    date: '2026-10-13',
    lines: [
      { tag: 'Both', text: 'A chapter’s scene, boss and victory music is fetched when you confirm its card and held until it plays.' },
      { tag: 'Both', text: 'Text on party prep, results and the Sensor chips is never smaller than 14 pixels.' },
      { tag: 'FFX', text: 'Evrae and Sin’s fins no longer snap between pictures when they charge.' },
      { tag: 'FFX', text: 'A status that the knock-out wipes in the same action that landed it plays no flash, cue or message of its own.' },
    ],
  },
  {
    release: '42',
    date: '2026-10-12',
    lines: [
      { tag: 'FFX-2', text: 'Fights keep time the way the game does: its clock, the three ATB speeds, each command’s own recovery and the game’s cast times.' },
      { tag: 'FFX-2', text: 'Bahamut, Vegnagun and Shuyin fight by the game’s own scripts, and Bahamut’s Mega Flare counts 5 to 1 whatever Slow or Haste do.' },
      { tag: 'FFX-2', text: 'Chapters VI, XV and XVI follow the game’s scripts for the Syndicate, the Den of Woe and Ixion.' },
      { tag: 'Both', text: 'Battles draw their luck the way each game does, from its own separate random streams, so every fight is a different but fair deal.' },
      { tag: 'FFX', text: 'Gear bonuses of one kind add up, and a spell aimed at Reflect comes back at whoever cast it, Hastega and the Nul spells included.' },
    ],
  },
  {
    release: '41',
    date: '2026-10-11',
    lines: [
      { tag: 'FFX-2', text: 'Chapter IV: the opening shot no longer shows two dark slabs down its sides, and Bahamut stays whole in every frame of the move.' },
      { tag: 'Both', text: 'The hooks for the games’ own sound effects at each moment are in, and silent: nothing sounds different yet.' },
      { tag: 'Both', text: 'Nothing else changed: the fights play exactly as they did.' },
    ],
  },
  {
    release: '40',
    date: '2026-10-11',
    lines: [
      { tag: 'Both', text: 'A knocked-out party member now falls: the figure buckles, tips over and lands, and a revive plays it back. REDUCE MOTION keeps a plain cut.' },
      { tag: 'Both', text: 'A hit pushes the figure back over a moment, instead of throwing it the whole way on the hit’s first frame.' },
      { tag: 'Both', text: 'Pose changes run on the real clock, so a hit-stop or the pace option no longer freezes or stretches a blend.' },
      { tag: 'FFX', text: 'Four new battle themes: Seymour Natus, Isaaru, Sin’s fins and core, and Sin’s face; the Evrae theme’s loop no longer clicks.' },
      { tag: 'FFX-2', text: 'Two new battle themes: one for the Fallen Aeons and Ixion, one for Trema’s second phase.' },
      { tag: 'Both', text: 'Sound effect levels follow the games’ measured balance.' },
    ],
  },
  {
    release: '39.4.5',
    date: '2026-10-11',
    lines: [
      { tag: 'FFX', text: 'Chapter XVIII: Sin’s last attack comes on his twelfth turn, as in the game.' },
      { tag: 'FFX', text: 'Chapter X: Natus’s Flare comes every third turn or so, as in the game.' },
      { tag: 'FFX', text: 'Overdrive bars follow the game’s rules: every hit adds at least a point, Shield stops a bar filling and Boost doubles it.' },
      { tag: 'FFX', text: 'Chapter IX: Yuna now pays for her Summon, so the fight plays differently; call the aeon late, when Yojimbo’s gauge reaches 96.' },
      { tag: 'FFX', text: 'The strategy guide cards for Evrae, Yojimbo, the Seymours and others are rewritten from the game’s own scripts.' },
      { tag: 'FFX', text: 'On the airship, Cid is offered one order at a time: Pull back, Close in, or Cancel.' },
    ],
  },
  {
    release: '39.4.4',
    date: '2026-10-11',
    lines: [
      { tag: 'FFX-2', text: 'Chapter IV: Bahamut is drawn at his in-battle size, about 3.3 times the girls, and the girls are back near their old height.' },
      { tag: 'FFX-2', text: 'Two new battle themes: a slow piano lament for Bahamut and a brass parade into a funk groove for the Syndicate.' },
      { tag: 'Both', text: 'The “two soundtracks at once” bug is fixed: only the last link of a chained fight plays the victory fanfare.' },
      { tag: 'FFX-2', text: 'Yuna’s White Mage hurt and knocked-out paintings are the old approved ones again, hood up.' },
      { tag: 'FFX', text: 'Who acts next and what a status does follow the game’s own program; Chapter X is harder.' },
    ],
  },
  {
    release: '39.4.3',
    date: '2026-10-09',
    lines: [
      { tag: 'Both', text: 'The party stands at the real games’ heights, measured from the games themselves.' },
      { tag: 'FFX-2', text: 'The giants, Bahamut and Paragon with Oversoul, are drawn at their in-game size.' },
      { tag: 'FFX', text: 'Lady Yunalesca’s first form is drawn at her model’s full height, and Seymour Omnis’s discs turn through the game’s own ring.' },
      { tag: 'FFX', text: 'Every attack, spell, item and Overdrive decides whether it hits, crits or inflicts by the game’s own rows, and the bosses follow their scripts.' },
      { tag: 'FFX-2', text: 'The same for every attack and enemy move: Chapters V and XV are harder, Chapter XI is easier and Chapter XIII is much easier.' },
    ],
  },
  {
    release: '39.4.2',
    date: '2026-10-08',
    lines: [
      { tag: 'FFX-2', text: 'Chapter VI: the fiends stand back where they stood in 39.4, because standing right beside the party looked wrong.' },
      { tag: 'FFX-2', text: 'They keep the true sizes that 39.4.1 gave them, so each fiend is bigger than it was in 39.4.' },
      { tag: 'FFX-2', text: 'The move advisor’s card is back to its full size in this chapter, and the card that shows what a fiend does next still covers no fiend’s head.' },
      { tag: 'Both', text: 'Nothing else changed: the fights play exactly as they did.' },
    ],
  },
  {
    release: '39.4.1',
    date: '2026-10-07',
    lines: [
      { tag: 'FFX-2', text: 'Chapter VI: every fiend is drawn at the size the game’s own models give it, so the bosses no longer look tiny beside the three girls.' },
      { tag: 'FFX-2', text: 'The fiends stand closer to the party with their heads level, so a taller fiend stands nearer instead of further back.' },
      { tag: 'FFX-2', text: 'The card that shows what a fiend does next no longer covers Ormi’s head.' },
      { tag: 'FFX-2', text: 'The move advisor’s card is cut to three lines in this chapter so it clears the bigger fiends’ feet.' },
      { tag: 'Both', text: 'Nothing else changed: the fights play exactly as they did.' },
    ],
  },
  {
    release: '39.4',
    date: '2026-10-07',
    lines: [
      { tag: 'Both', text: '586 character and boss poses were cleaned up: the jagged white fringe on hair and cloth is gone, and where a figure ran off its painting’s edge a hard cut is now a soft fade.' },
      { tag: 'Both', text: 'A figure’s head keeps its size when it changes pose, a knock-out included.' },
      { tag: 'FFX-2', text: 'Paine’s Black Mage dress matches her idle colours in five poses.' },
      { tag: 'FFX', text: 'Yuna’s skirt matches her idle colours in four poses.' },
      { tag: 'Both', text: 'New music: a new title-screen track and a new track for the chapter select board.' },
      { tag: 'FFX', text: 'New battle music for Seymour Flux in Chapter I and Seymour Omnis in Chapter XII.' },
    ],
  },
];

/** `[39, 4, 1]` and the trailing letter of a release name; null when it is not a release name. */
function parseRelease(name: string): { parts: number[]; letter: string } | null {
  const m = /^([0-9]+(?:\.[0-9]+)*)([a-z]?)$/.exec(name);
  if (!m) return null;
  return { parts: (m[1] ?? '').split('.').map(Number), letter: m[2] ?? '' };
}

/** Negative when `a` is the older release, positive when it is the newer: `39.4 < 39.4.1 < 39.5 < 40`. */
export function compareReleases(a: string, b: string): number {
  const pa = parseRelease(a);
  const pb = parseRelease(b);
  if (!pa || !pb) return a < b ? -1 : a > b ? 1 : 0;
  const n = Math.max(pa.parts.length, pb.parts.length);
  for (let i = 0; i < n; i++) {
    const d = (pa.parts[i] ?? 0) - (pb.parts[i] ?? 0);
    if (d !== 0) return d;
  }
  return pa.letter < pb.letter ? -1 : pa.letter > pb.letter ? 1 : 0;
}

/** The name of the newest release in the list (the first entry), or null for an empty list. */
export function newestRelease(notes: readonly ReleaseNote[] = RELEASE_NOTES): string | null {
  return notes[0]?.release ?? null;
}

function isCalendarDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

/**
 * Everything wrong with a list of notes, as sentences a person can act on (empty when it is fine): the shape the
 * panel needs, the three-to-six-line rule, and the words that must never reach a player.
 */
export function validateReleaseNotes(notes: readonly ReleaseNote[]): string[] {
  const problems: string[] = [];
  if (notes.length === 0) problems.push('the list has no release at all');
  const seen = new Set<string>();
  notes.forEach((note, i) => {
    const at = `release ${JSON.stringify(note.release)}`;
    if (!RELEASE_NAME.test(note.release)) problems.push(`${at}: not a release name (digits and dots, like 39.4.2)`);
    if (seen.has(note.release)) problems.push(`${at}: listed twice`);
    seen.add(note.release);
    const next = notes[i + 1];
    if (next && compareReleases(note.release, next.release) <= 0) {
      problems.push(`${at}: must be newer than the release below it (${next.release}); the list is newest first`);
    }
    if (!isCalendarDate(note.date)) problems.push(`${at}: the date ${JSON.stringify(note.date)} is not a YYYY-MM-DD day`);
    if (next && isCalendarDate(note.date) && isCalendarDate(next.date) && note.date < next.date) {
      problems.push(`${at}: dated ${note.date}, before the release below it (${next.release}, ${next.date})`);
    }
    if (note.lines.length < NOTE_LINES.min || note.lines.length > NOTE_LINES.max) {
      problems.push(`${at}: has ${note.lines.length} line(s); a note is ${NOTE_LINES.min} to ${NOTE_LINES.max}`);
    }
    const texts = new Set<string>();
    for (const line of note.lines) {
      if (!NOTE_TAGS.includes(line.tag)) problems.push(`${at}: the tag ${JSON.stringify(line.tag)} is not FFX, FFX-2 or Both`);
      const text = line.text;
      if (text !== text.trim() || text.length < 12) problems.push(`${at}: a line is empty, too short or has stray spaces: ${JSON.stringify(text)}`);
      if (text.length > NOTE_TEXT_MAX) problems.push(`${at}: a line is ${text.length} characters, over ${NOTE_TEXT_MAX}: ${JSON.stringify(text.slice(0, 40))}...`);
      if (!text.endsWith('.')) problems.push(`${at}: a line does not end with a full stop: ${JSON.stringify(text.slice(-30))}`);
      if (/[<>]/.test(text)) problems.push(`${at}: a line has markup characters (the text is plain): ${JSON.stringify(text.slice(0, 40))}`);
      if (texts.has(text)) problems.push(`${at}: a line is repeated: ${JSON.stringify(text.slice(0, 40))}`);
      texts.add(text);
      for (const word of FORBIDDEN_NOTE_WORDS) {
        if (word.test(text)) problems.push(`${at}: a line names something that stays hidden (${word}): ${JSON.stringify(text.slice(0, 50))}`);
      }
    }
  });
  return problems;
}
