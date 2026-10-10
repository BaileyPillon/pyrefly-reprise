/**
 * Status display O3: the words. The one-line battle message when a status lands or wears off
 * ("Kimahri became a Zombie."), and the guide card's cure hints. Pure.
 *
 * Game case (AGENTS.md rule 14): the message phrasing is our own copy and the same shape in both
 * games; **every rule a hint states is the game's own**, from its own cure table:
 * - FFX: `research/ffx-combat-core.md` §4.2 (the status table) and the cure-item table ("Holy
 *   Water | Zombie + Curse", "Remedy | Zombie, ... (not Curse)", "Esuna ... NOT Zombie, NOT Curse",
 *   [verified: 2 sources]).
 * - FFX-2: `research/ffx2-combat-core.md` §2.8 (Sleep "time and/or hit", Silence "Cured by Echo
 *   Screen", Curse "cannot spherechange ... Cured by Holy Water, Remedy, Esuna", [verified: 2
 *   sources]) and its cure table (Esuna / Remedy's twelve).
 * A status with no sourced rule has no hint.
 */

import type { StatusId } from '../../battle/common/types.ts';
import type { StatusGame } from './statusLooks.ts';

// ------------------------------------------------------------------ message line

/** "<name> ..." when the status lands. Only statuses a player should hear about get a line. */
const LANDS: Partial<Record<StatusId, string>> = {
  zombie: 'became a Zombie.',
  petrify: 'turned to stone.',
  poison: 'was poisoned.',
  silence: 'was silenced.',
  sleep: 'fell asleep.',
  darkness: 'was blinded by Darkness.',
  slow: 'was slowed.',
  haste: 'was hasted.',
  berserk: 'went Berserk.',
  confuse: 'became confused.',
  doom: 'was doomed.',
  curse: 'was cursed.',
  stop: 'was stopped.',
  itchy: 'became Itchy.',
  pointless: 'became Pointless.',
  'auto-life': 'is protected by Auto-Life.',
};

/** "<name> ..." when it wears off or is cured (never on KO, overwrite or a consumed charge). */
const LEAVES: Partial<Record<StatusId, string>> = {
  zombie: 'is no longer a Zombie.',
  petrify: 'is no longer stone.',
  poison: 'is no longer poisoned.',
  silence: 'can speak again.',
  sleep: 'woke up.',
  darkness: 'can see again.',
  slow: 'is no longer slowed.',
  haste: 'is no longer hasted.',
  berserk: 'calmed down.',
  confuse: 'came to.',
  curse: 'is no longer cursed.',
  stop: 'can move again.',
  itchy: 'is no longer Itchy.',
  pointless: 'is no longer Pointless.',
};

export function landsLine(name: string, status: StatusId): string | null {
  const tail = LANDS[status];
  return tail ? `${name} ${tail}` : null;
}

export function leavesLine(name: string, status: StatusId, reason: string): string | null {
  if (reason !== 'expired' && reason !== 'cured' && reason !== 'dispelled') return null;
  const tail = LEAVES[status];
  return tail ? `${name} ${tail}` : null;
}

/** Statuses the message line speaks for (tests). */
export function messageStatuses(): StatusId[] {
  return Object.keys(LANDS) as StatusId[];
}

// ------------------------------------------------------------------ pronouns

const HER = new Set(['yuna', 'lulu', 'rikku', 'paine']);
const HIM = new Set(['tidus', 'wakka', 'auron', 'kimahri']);

export interface Pronouns {
  /** "him" / "her" / "them". */
  them: string;
  /** "his" / "her" / "their". */
  their: string;
  /** "he" / "she" / "they". */
  they: string;
}

/** Pronouns for the playable cast, by id prefix ("yuna", "rikku-x2"); "they" otherwise. */
export function pronounsOf(id: string): Pronouns {
  const base = id.split('-')[0] ?? id;
  if (HER.has(base)) return { them: 'her', their: 'her', they: 'she' };
  if (HIM.has(base)) return { them: 'him', their: 'his', they: 'he' };
  return { them: 'them', their: 'their', they: 'they' };
}

/** Object pronoun ("him", "her", "them"). */
export function themOf(id: string): string {
  return pronounsOf(id).them;
}

// ------------------------------------------------------------------ cure hints

export interface CureHint {
  status: StatusId;
  /** The card's chip ("ZOMBIE"). */
  label: string;
  /** The sentence, with `<b>` around item and spell names. */
  html: string;
  /** The same rule in one short sentence: a second hint on the card, and the phone card. */
  short: string;
  /**
   * FFX-2's phone card on ONE row (R3942, Bailey 2026-10-08, "I'll go with all your recommendations": option 1 of the Chapter IV
   * card pick): "Paine: Holy Water, Esuna, Remedy" beside the status chip. The chip says which status, so the row carries who and
   * the whole cure list the sentence names (PR-0290) and none of its prose. Written to fit one row at 14.2 px from 360 px wide
   * (`tests/unit/status-hint-one-line.test.ts`). Absent where a game's phone card keeps `short` (FFX: Game case, FFX-2 only).
   */
  line?: string;
}

type HintFn = (name: string, p: Pronouns) => string;
interface HintRow {
  full: HintFn;
  short: HintFn;
  /** FFX-2 only: the one-row form (`CureHint.line`). */
  line?: HintFn;
}

const FFX_HINTS: Partial<Record<StatusId, HintRow>> = {
  // ffx-combat-core §4.2 Zombie + the cure table: revival kills a living Zombie; Holy Water, Remedy; NOT Esuna.
  zombie: {
    full: (_n, p) => `Healing turns into damage on a Zombie, and a <b>Phoenix Down</b> would KO ${p.them} outright. <b>Holy Water</b> or a <b>Remedy</b> cures it; Esuna does not.`,
    short: () => 'Healing hurts a Zombie. <b>Holy Water</b> or a <b>Remedy</b> cures it; Esuna does not.',
  },
  // §4.2 Sleep: cannot act; physical damage wakes, magic does not; Esuna, Remedy.
  sleep: {
    full: (n, p) => `<b>${n} is asleep</b> and cannot act. A physical hit wakes ${p.them} (magic does not); <b>Esuna</b> or a <b>Remedy</b> cures it.`,
    short: (n, p) => `<b>${n} is asleep:</b> a physical hit, <b>Esuna</b> or a <b>Remedy</b> wakes ${p.them}.`,
  },
  // §4.2 Silence: blocks Wht Magic, Blk Magic and Summon; Echo Screen, Esuna, Remedy.
  silence: {
    full: (n) => `<b>${n} is silenced:</b> no White or Black Magic and no Summon. <b>Echo Screen</b>, <b>Esuna</b> or a <b>Remedy</b> cures it.`,
    short: (n) => `<b>${n} is silenced:</b> <b>Echo Screen</b> cures it.`,
  },
  // §4.2 Curse: the Overdrive gauge cannot fill; Dispel, Holy Water (Remedy and Esuna do not).
  curse: {
    full: (n, p) => `<b>${n} is cursed:</b> ${p.their} Overdrive gauge cannot fill. <b>Holy Water</b> or <b>Dispel</b> cures it; Esuna and Remedy do not.`,
    short: (n) => `<b>${n} is cursed:</b> <b>Holy Water</b> cures it.`,
  },
};

const FFX2_HINTS: Partial<Record<StatusId, HintRow>> = {
  // ffx2-combat-core §2.8 Sleep "ATB frozen", woken by time and/or a hit; the cure table: Esuna, Remedy.
  sleep: {
    full: (n, p) => `<b>${n} is asleep:</b> ${p.their} gauge is frozen and ${p.they} cannot act. A hit, <b>Esuna</b> or a <b>Remedy</b> wakes ${p.them}.`,
    short: (n, p) => `<b>${n} is asleep:</b> gauge frozen, no turns. A hit, Esuna or a Remedy wakes ${p.them}.`,
    // R3942 (FFX-2 phone, one row): what wakes her, the sentence's list ("a hit, Esuna, Remedy"); the chip says SLEEP.
    line: (n) => `${n}: a hit, <b>Esuna</b>, <b>Remedy</b>`,
  },
  // §2.8 Silence: blocks White Magic, Black Magic and Arcana; "Cured by Echo Screen" (+ Esuna, Remedy).
  silence: {
    full: (n) => `<b>${n} is silenced:</b> no White Magic, Black Magic or Arcana. <b>Echo Screen</b>, <b>Esuna</b> or a <b>Remedy</b> cures it.`,
    // U2 (PR-0290, FFX-2 only): the phone card names the whole cure list the desktop card does, in one sentence.
    short: (n) => `${n} is silenced: <b>Echo Screen</b>, <b>Esuna</b> or a <b>Remedy</b> cures it.`,
    line: (n) => `${n}: <b>Echo Screen</b>, <b>Esuna</b>, <b>Remedy</b>`,
  },
  // §2.8 Curse: cannot spherechange; cured by Holy Water, Remedy, Esuna.
  curse: {
    full: (n, p) => `<b>${n} is cursed</b> and ${p.they} cannot change dresspheres. <b>Holy Water</b>, <b>Esuna</b> or a <b>Remedy</b> cures it.`,
    short: (n) => `${n} is cursed: <b>Holy Water</b>, <b>Esuna</b> or a <b>Remedy</b> cures it.`,
    line: (n) => `${n}: <b>Holy Water</b>, <b>Esuna</b>, <b>Remedy</b>`,
  },
};

const LABELS: Partial<Record<StatusId, string>> = { zombie: 'ZOMBIE', sleep: 'SLEEP', silence: 'SILENCE', curse: 'CURSE' };

/** The hint for one combatant's status in `game`, or null when no sourced rule exists. */
export function cureHint(game: StatusGame, status: StatusId, name: string, id: string): CureHint | null {
  const row = (game === 'ffx' ? FFX_HINTS : FFX2_HINTS)[status];
  if (!row) return null;
  const n = escapeHtml(name);
  const p = pronounsOf(id);
  const hint: CureHint = { status, label: LABELS[status] ?? status.toUpperCase(), html: row.full(n, p), short: row.short(n, p) };
  if (row.line) hint.line = row.line(n, p);
  return hint;
}

/** Statuses with a hint, per game, in the order the card lists them (tests). */
export function hintStatuses(game: StatusGame): StatusId[] {
  return Object.keys(game === 'ffx' ? FFX_HINTS : FFX2_HINTS) as StatusId[];
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
