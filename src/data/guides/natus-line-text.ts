/**
 * The strategy guide's sentences for each Chapter X line (`./natus-line.ts`), as edits to the shipped guide
 * (`./seymour-natus.ts`): rules replaced or added, hints tried before the shipped ones (the first match wins, so a line's hint
 * overrides the shipped hint for the same row), phase notes replaced, and the pause tip. **FFX only** [AGENTS.md rule 14].
 *
 * The `shipped` line has no edits: its guide is exactly the one Bailey approved on 2026-09-25. Every other line's text says what
 * that line's tactic (`src/engine/tactics/seymour-natus*.ts`) asks for, in our words, and every sentence cites the research
 * (`research/ffx-seymour-natus-highbridge.md`, `research/jegged-encounter-guides-ffx-b.md`) or a game-record note in
 * `docs/handoff/re-parity-chx-options.md`. The phase-3 note and the Cura / Hi-Potion hint carry the Flare cadence the game's own
 * command record gives (rank 3, 30 ticks between his turns; re-parity W2), where the shipped note says nothing about it.
 *
 * Plain data: this module imports only the guide types.
 */

import type { NatusLineId } from './natus-line.ts';
import type { GuideHint, GuidePhase, GuideRule } from './types.ts';

export interface NatusLineText {
  /** Rules that replace the shipped rule at that index (0-based), or are appended when the index is past the end. */
  rules?: Readonly<Record<number, GuideRule>>;
  /** Rules dropped from the shipped list, by index, before the replacements apply. */
  dropRules?: readonly number[];
  /** Hints tried before the shipped ones. */
  hints?: readonly GuideHint[];
  /** Phase fields replaced, by index into the shipped `phases`. */
  phases?: Readonly<Record<number, Partial<Pick<GuidePhase, 'label' | 'note' | 'cite'>>>>;
  /** The pause tip (`chapter-meta-natus.ts`); the shipped tip when absent. */
  tip?: string;
}

/** The new phase-3 wording: Flare at the game's rank 3 (record 0x6079), measured 30 ticks apart, which is about three party turns. */
const FLARE_PHASE: NonNullable<NatusLineText['phases']>[number] = {
  note: 'Natus casts Flare at one of you about every third turn of yours, as often as any other spell he has; Mortibody Curas him for about 1,200 in between.',
  cite: 'ffx-seymour-natus-highbridge §3.1, §4.1; re-parity-chx-options §Flare cadence',
};

/** Flare takes about 2,000 from a guardian without Shell and about half that with it (re-parity-chx-options, measured on the party preset). */
const FLARE_HINT: GuideHint = {
  when: { labels: ['Cura', 'Hi-Potion'] },
  text: 'Flare comes about every three of your turns and takes about 2,000 from a guardian without Shell, half that with it: mend {target} before the next one',
  cite: 'ffx-seymour-natus-highbridge §3.3; re-parity-chx-options §Flare cadence',
};

/** Only Bahamut is worth a turn (shared by `bahamut` and `reflect`, which includes it). */
const BAHAMUT_RULE: GuideRule = {
  text: 'Only Bahamut is worth a turn. He arrives with a full gauge: send him once and let his Overdrive be the turn he gets before Natus Banishes him. The other four arrive without a full gauge and only swing once, at the cost of a turn of Yuna’s.',
  short: 'Send Bahamut alone, for his Overdrive',
  cite: 'ffx-seymour-natus-highbridge §4.3, §6.3 row 3; jegged-encounter-guides-ffx-b §3; B3',
};

const BAHAMUT_HINT: GuideHint = {
  when: { kinds: ['summon'] },
  text: 'Bahamut arrives with a full gauge: he gets one turn before the Banish, and it should be his Overdrive. No other aeon is worth Yuna’s turn',
  cite: 'ffx-seymour-natus-highbridge §4.3, §6.3 row 3; jegged-encounter-guides-ffx-b §3; B3',
};

export const NATUS_LINE_TEXT: Readonly<Record<NatusLineId, NatusLineText>> = {
  shipped: {},

  // Aeons: only Bahamut (his Overdrive gauge arrives full); the other four are not sent.
  bahamut: {
    rules: { 3: BAHAMUT_RULE },
    hints: [BAHAMUT_HINT, FLARE_HINT],
    phases: { 2: FLARE_PHASE },
    tip: 'He has no Defense, so every swing lands in full. Soften a stone guardian at once, Haste only Tidus and Auron, and send Bahamut alone.',
  },

  // Bahamut alone, and Rikku Reflects Natus: Mortibody's Cura bounces onto a guardian.
  reflect: {
    rules: {
      // One rule, not two: the guide keeps to five rules (the house shape, `natus-ship-content.test.ts`).
      3: {
        text: 'Send Bahamut alone, and let his Overdrive be the one turn he gets before Natus Banishes him; the other four arrive without a full gauge and only cost Yuna a turn. Then have Rikku put Reflect on Natus: Mortibody’s Cura, about 1,200 a cast, bounces off him and mends one of you instead.',
        short: 'Bahamut alone; Rikku Reflects Natus',
        cite: 'ffx-seymour-natus-highbridge §4.3, §6.3 rows 3 and 5; jegged-encounter-guides-ffx-b §3; B3',
      },
    },
    hints: [
      BAHAMUT_HINT,
      {
        when: { labels: ['Reflect'], targetId: 'seymour-natus' },
        text: 'Reflect on Natus: Mortibody’s Cura bounces off him and mends one of you instead of him. Nothing of ours is aimed at him with a spell, so it costs nothing to keep',
        cite: 'ffx-seymour-natus-highbridge §4.3, §6.3 row 5; jegged-encounter-guides-ffx-b §3',
      },
      {
        when: { kinds: ['switch'], actorId: 'kimahri' },
        text: 'Rikku comes in for one Reflect on Natus, then hands the slot to Auron',
        cite: 'ffx-seymour-natus-highbridge §6.3 row 5; jegged-encounter-guides-ffx-b §3',
      },
      FLARE_HINT,
    ],
    phases: { 2: FLARE_PHASE },
    tip: 'He has no Defense, so every swing lands in full. Soften a stone guardian at once, Haste only Tidus and Auron, send Bahamut alone, and have Rikku Reflect Natus so Mortibody’s Cura bounces off him.',
  },

  // Provoke and Reflect: his spells bounce off the Provoker.
  mirror: {
    rules: {
      1: {
        text: 'Below 24,000 he starts to Break, which turns a guardian to stone, and Mortibody’s Claw shatters stone nine times in ten. Aimed at a Reflected Tidus the Break bounces back and misses him, because he cannot be turned to stone, so nobody is ever turned to stone.',
        short: 'A Reflected Break misses: no stone to shatter',
        cite: 'ffx-seymour-natus-highbridge §3.1, §4.3, §5, §6.3 row 2',
      },
      2: {
        text: 'Provoke Natus and keep Reflect on the Provoker. He aims every spell at Tidus, so Multi-ra and Flare bounce back onto Natus, and Break misses him. Nobody Hastes and no aeon is sent: a Reflect on Tidus is all the party needs.',
        short: 'Provoke Natus, keep Reflect on the Provoker',
        cite: 'ffx-seymour-natus-highbridge §4.3, §6.3 row 2 (GameFAQs)',
      },
      3: {
        text: 'Mortibody cannot be Provoked, so its Claw, its spells and its Cura still come. If Tidus falls, or Reflect is stripped, stand him up and put Reflect back before anything else; keep a Soft and a Phoenix Down in hand.',
        short: 'Reflect on Tidus is the whole plan: keep it up',
        cite: 'ffx-seymour-natus-highbridge §3.2, §4.3, §5',
      },
    },
    hints: [
      {
        when: { labels: ['Provoke'], targetId: 'seymour-natus' },
        text: 'Provoke him: every spell of his now goes to Tidus, and a Reflected Tidus sends it back onto him',
        cite: 'ffx-seymour-natus-highbridge §6.3 row 2 (GameFAQs), §4.3',
      },
      {
        when: { labels: ['Reflect'], targetId: 'tidus' },
        text: 'Reflect on the Provoker: Flare and the Multi-ra pair bounce back onto Natus, and his Break misses him',
        cite: 'ffx-seymour-natus-highbridge §6.3 row 2 (GameFAQs), §3.1',
      },
      {
        when: { kinds: ['switch'], actorId: 'kimahri' },
        text: 'Rikku comes in to keep Reflect on Tidus',
        cite: 'ffx-seymour-natus-highbridge §6.3 row 2 (GameFAQs)',
      },
      {
        when: { kinds: ['switch'], actorId: 'yuna' },
        text: 'Auron takes the slot: a Cura on a Reflected Tidus would bounce, so the heals are items, and a second sword wins the race',
        cite: 'ffx-seymour-natus-highbridge §6.3 rows 2 and 4',
      },
      {
        when: { labels: ['Hi-Potion'] },
        text: 'A Hi-Potion, not a Cura: a spell on a Reflected Tidus would bounce',
        cite: 'ffx-seymour-natus-highbridge §6.3 row 2 (GameFAQs)',
      },
    ],
    phases: {
      2: {
        note: 'With Tidus Provoked and Reflected, Flare and the Multi-ra pair come back onto Natus and Break misses him; Mortibody still Claws and Curas him for about 1,200.',
        cite: 'ffx-seymour-natus-highbridge §4.1, §6.3 row 2; re-parity-chx-options §Flare cadence',
      },
    },
    tip: 'He has no Defense, so every swing lands in full. Provoke Natus with Tidus and keep Reflect on him: his spells and his Break bounce back.',
  },
};
