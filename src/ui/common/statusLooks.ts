/**
 * Status display O3 (Bailey's pick, 2026-09-29): **what each status looks like, per game**, as
 * data. Pure: no DOM, no `three`. The figure layer (`statusFigureLayer.ts`, `StatusFigureTint.ts`),
 * the icon rows (`statusIcons.ts`) and the guard rails (`statusRails*.ts`) all read these tables,
 * and `tests/unit/status-o3-mapping.test.ts` pins them.
 *
 * Game case (AGENTS.md rule 14): **two tables, never merged.** Every figure look comes from
 * `research/status-display.md` (§2 FFX, §3 FFX-2) with its source tag; a status whose look no
 * source describes gets **no entry**, so nothing is drawn for it (FFX Silence, Darkness, Slow,
 * Haste, Shell, Reflect, Regen, Breaks, Provoke...; FFX-2 Berserk, Shell, Regen). Cures come from
 * `research/ffx-combat-core.md` §4.2 and the item table (FFX) and `research/ffx2-combat-core.md`
 * §2.8 and the cure table (FFX-2).
 *
 * Rule 8: the colours and marks are ours, keyed to the sourced *idea* (bubbles, stars, a halo, a
 * hue), never traced from a retail frame.
 */

import type { StatusId } from '../../battle/common/types.ts';

export type StatusGame = 'ffx' | 'ffx2';

/** A mark drawn on or over the figure by the DOM layer. */
export type FigureMark =
  | 'smoke'
  | 'bubbles'
  | 'zzz'
  | 'stars'
  | 'halo'
  | 'ellipsis'
  | 'cloud'
  | 'orb-red'
  | 'orb-white'
  | 'orb-yellow'
  | 'orb-blue';

export interface FigureLook {
  /** Marks on or over the figure, drawn while the status is on. */
  marks?: readonly FigureMark[];
  /** A multiply tint on the painting (`PaintedActor.setTint`): a hue or a darkening. */
  tint?: number;
  /** A held additive glow (the flash cells), `amount` 0..1. */
  glow?: { colour: number; amount: number; floorCut: number };
  /** The figure holds still (every movement animation stops). */
  freeze?: boolean;
  /** The figure flashes slowly. */
  pulse?: boolean;
  /** A blue shield flashes on the figure when a physical hit lands. */
  shieldOnPhysicalHit?: boolean;
  /** Where the look is written down. */
  source: string;
}

/** FFX (`research/status-display.md` §2). */
const FFX_LOOKS: Partial<Record<StatusId, FigureLook>> = {
  // The approved base frame's recipe: tint 0xa6e39a plus a held green glow (options/src/capture.mjs).
  zombie: { marks: ['smoke'], tint: 0xa6e39a, glow: { colour: 0x6dff7a, amount: 0.16, floorCut: 0.6 }, source: '"a glowing green body and black smoke clouds around their heads" [verified: 2 sources]' },
  poison: { marks: ['bubbles'], source: '"a green icon above them"; FFX-2 pages: "the same as in Final Fantasy X", green bubbles [verified: 2 sources]' },
  sleep: { marks: ['zzz'], source: '"Z\'s emerge from their head" [single source]; the hunch needs a painting (not approved)' },
  confuse: { marks: ['stars'], source: '"two spinning stars over their head" [verified: 2 sources]' },
  berserk: { tint: 0xff9a86, source: '"Targets affected by Berserk turn a red hue" [single source]' },
  curse: { tint: 0xc9a77c, source: '"Characters under Curse turn a murky brown hue" [single source]' },
  'auto-life': { marks: ['halo'], source: '"a halo above their battle model" [verified: 2 sources]' },
  nulblaze: { marks: ['orb-red'], source: '"represented by a circling red orb" [single source]' },
  nulfrost: { marks: ['orb-white'], source: '"white orb" [single source]' },
  nulshock: { marks: ['orb-yellow'], source: '"yellow orb" [single source]' },
  nultide: { marks: ['orb-blue'], source: '"blue orb" [single source]' },
  protect: { shieldOnPhysicalHit: true, source: '"a blue magical shield appears to mitigate it" on a physical hit [single source]' },
};

/** FFX-2 (`research/status-display.md` §3). */
const FFX2_LOOKS: Partial<Record<StatusId, FigureLook>> = {
  poison: { marks: ['bubbles'], source: '"green bubbles above the afflicted target\'s head" [verified: 2 sources]' },
  sleep: { marks: ['zzz'], source: '"Z\'s appear above their head" [verified: 2 sources]; the hunch needs a painting (not approved)' },
  silence: { marks: ['ellipsis'], source: '"a speech bubble with an ellipsis above their head" [single source]' },
  darkness: { marks: ['cloud'], source: '"a black cloud on the affected character\'s head" [single source]; ffx2-combat-core §2.8 "Black mist around the head"' },
  confuse: { marks: ['stars'], source: '"two spinning stars above their heads" [verified: 2 sources]' },
  // The approved base frame darkened Paine to 0.62 (options/src/capture.mjs); a grey multiply is the same.
  curse: { tint: 0x9e9e9e, source: '"appears with a darkened battle model" [single source]' },
  stop: { freeze: true, source: '"Stop prevents all movement animations" [verified: 2 sources]' },
  'auto-life': { marks: ['halo'], source: '"a halo above their head or body" [single source]' },
  protect: { shieldOnPhysicalHit: true, source: '"a blue shield appears to mitigate the damage" on a physical hit [single source]' },
  pointless: { pulse: true, source: '"The character afflicted will start flashing slowly" [single source]' },
};

/** The figure look for `status` in `game`, or undefined when no source describes one. */
export function figureLookOf(game: StatusGame, status: StatusId): FigureLook | undefined {
  return (game === 'ffx' ? FFX_LOOKS : FFX2_LOOKS)[status];
}

/** Every status with a figure look, per game (tests, the handoff). */
export function figureLookIds(game: StatusGame): StatusId[] {
  return Object.keys(game === 'ffx' ? FFX_LOOKS : FFX2_LOOKS) as StatusId[];
}

// ------------------------------------------------------------------ icons (O2)

/** Statuses that hurt the unit that has them: a red rim. Everything else with an icon is teal. */
const HARM = new Set<StatusId>([
  'zombie', 'petrify', 'poison', 'silence', 'sleep', 'darkness', 'slow', 'berserk', 'confuse',
  'doom', 'curse', 'provoke', 'threaten', 'power-break', 'magic-break', 'armor-break',
  'mental-break', 'jinx', 'stop', 'itchy', 'pointless',
  'str-down', 'mag-down', 'def-down', 'mdef-down', 'accu-down', 'eva-down', 'luck-down',
]);

/** FFX's icon set: the statuses a player acts on (README coverage table, "O2 adds"). */
const FFX_ICONS: readonly StatusId[] = [
  'petrify', 'zombie', 'doom', 'curse', 'confuse', 'berserk', 'sleep', 'silence', 'poison',
  'darkness', 'slow', 'haste', 'auto-life', 'protect', 'shell', 'reflect', 'regen',
  'nulblaze', 'nulfrost', 'nulshock', 'nultide', 'shield', 'boost',
  'power-break', 'magic-break', 'armor-break', 'mental-break', 'provoke', 'threaten',
  'guard', 'sentinel', 'defend', 'cheer', 'focus', 'aim', 'reflex', 'luck', 'jinx',
];

/** FFX-2's icon set: every status the game has an icon for (W-X2icon), in alarm order. */
const FFX2_ICONS: readonly StatusId[] = [
  'petrify', 'doom', 'stop', 'curse', 'confuse', 'berserk', 'sleep', 'poison', 'silence',
  'darkness', 'slow', 'itchy', 'pointless', 'haste', 'auto-life', 'invincible', 'reflect',
  'regen', 'protect', 'shell', 'null-magic', 'null-physical', 'spellspring',
  'str-down', 'mag-down', 'def-down', 'mdef-down', 'accu-down', 'eva-down', 'luck-down',
  'str-up', 'mag-up', 'def-up', 'mdef-up', 'accu-up', 'eva-up', 'luck-up',
];

export function isHarmful(status: StatusId): boolean {
  return HARM.has(status);
}

/** The statuses a combatant shows as icons, most alarming first. KO and hidden bookkeeping never. */
export function iconIdsOf(game: StatusGame, statuses: Partial<Record<string, unknown>>): StatusId[] {
  const order = game === 'ffx' ? FFX_ICONS : FFX2_ICONS;
  return order.filter((s) => statuses[s] !== undefined && statuses[s] !== null);
}

/** Every status that has an icon in `game` (tests). */
export function iconSet(game: StatusGame): readonly StatusId[] {
  return game === 'ffx' ? FFX_ICONS : FFX2_ICONS;
}

// ------------------------------------------------------------------ captions (O3)

/**
 * The one-word plate caption where a status **takes the command away**, first match wins (the
 * approved O3 mockup's "ASLEEP" on Yuna's plate; Rikku's Silence carries none there, so a status
 * that only seals part of the menu gets the guide's hint instead). Each rule is the game's own:
 * FFX: Petrify and Sleep "cannot act", Confuse "acts automatically", Berserk "auto-attacks only"
 * (ffx-combat-core §4.2). FFX-2: Petrify and Sleep freeze the ATB, Stop "no commands", Berserk
 * "player loses control" (ffx2-combat-core §2.8); FFX-2 Confuse "may use any command she has", so
 * it has no caption.
 */
const CAPTIONS: Record<StatusGame, ReadonlyArray<readonly [StatusId, string]>> = {
  ffx: [['petrify', 'STONE'], ['sleep', 'ASLEEP'], ['confuse', 'CONFUSED'], ['berserk', 'BERSERK']],
  ffx2: [['petrify', 'STONE'], ['stop', 'STOPPED'], ['sleep', 'ASLEEP'], ['berserk', 'BERSERK']],
};

export function captionOf(game: StatusGame, statuses: Partial<Record<string, unknown>>): string | null {
  for (const [s, text] of CAPTIONS[game]) if (statuses[s] !== undefined && statuses[s] !== null) return text;
  return null;
}

// ------------------------------------------------------------------ names

const NAMES: Partial<Record<StatusId, string>> = {
  'auto-life': 'Auto-Life', nulblaze: 'NulBlaze', nulfrost: 'NulFrost', nulshock: 'NulShock', nultide: 'NulTide',
  'power-break': 'Power Break', 'magic-break': 'Magic Break', 'armor-break': 'Armor Break', 'mental-break': 'Mental Break',
  'null-magic': 'Null Magic', 'null-physical': 'Null Physical',
  'str-up': 'STR Up', 'mag-up': 'MAG Up', 'def-up': 'DEF Up', 'mdef-up': 'MDEF Up', 'accu-up': 'ACCU Up', 'eva-up': 'EVA Up', 'luck-up': 'LUCK Up',
  'str-down': 'STR Down', 'mag-down': 'MAG Down', 'def-down': 'DEF Down', 'mdef-down': 'MDEF Down', 'accu-down': 'ACCU Down', 'eva-down': 'EVA Down', 'luck-down': 'LUCK Down',
};

/** "zombie" -> "Zombie", "auto-life" -> "Auto-Life", "str-up" -> "STR Up". */
export function statusName(s: StatusId): string {
  return NAMES[s] ?? s.replace(/(^|-)([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}
