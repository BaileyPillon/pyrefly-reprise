import type { OverdriveModeId } from '../../../battle/common/types.ts';

/**
 * The Overdrive tab's words, moved out of `panels.ts` unchanged (PR-0295: the phone page of the same tab reads them too).
 * FFX only: FFX-2 has no Overdrive modes.
 */

/**
 * Static per-character Overdrive move name (visual-bible §5.4's STATS tab:
 * "the character's Overdrive name ... all verified from the wiki
 * infoboxes"). A display label only — Lulu's is the `'fury'` menu marker
 * that expands into her learned `<spell>-fury` ids at battle time
 * [CONTRACT-CHANGES decision 9], never something this tab could derive from
 * `unlockedOverdriveIds` (which for her is 19 spell-tier ids, not one name).
 */
export const OVERDRIVE_NAME: Record<string, string> = {
  tidus: 'Swordplay',
  yuna: 'Grand Summon',
  auron: 'Bushido',
  wakka: 'Slots',
  lulu: 'Fury',
  kimahri: 'Ronso Rage',
  rikku: 'Mix',
};

/**
 * FFX names its Overdrive modes Stoic, Warrior, Comrade, Healer… — proper
 * nouns, as the menu prints them. `OverdriveModeId` is the lower-case id, and
 * the row was printing it raw (`stoic`, `daredevil`); the `text-transform:
 * uppercase` in the CSS hid it at a glance and not in the DOM. Every id in the
 * union is a single word, so title case *is* the name.
 */
export function modeLabel(mode: OverdriveModeId): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

export const MODE_BLURB: Partial<Record<OverdriveModeId, string>> = {
  stoic: 'Charges from damage taken.',
  warrior: 'Charges from damage dealt.',
  comrade: "Charges when an ally takes damage.",
  healer: 'Charges from healing allies.',
  tactician: 'Charges from inflicting a status.',
  victim: 'Charges from being inflicted with a status.',
  dancer: 'Charges from evading an attack.',
  avenger: "Charges when an ally is KO'd.",
  slayer: 'Charges from a kill.',
  hero: 'Charges from a big kill.',
  rook: 'Charges from blocking damage.',
  victor: 'Charges just from winning.',
  coward: 'Charges from escaping.',
  ally: "Charges at the start of the user's turn.",
  sufferer: 'Charges each turn while afflicted.',
  daredevil: 'Charges each turn while in Critical.',
  loner: 'Charges each turn while fighting alone.',
};
