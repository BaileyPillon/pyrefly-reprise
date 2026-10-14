/**
 * Valefor at Besaid (FFX-2 Chapter 3, the mission "Protect Besaid Temple!"; our hidden chapter) [research/ffx2-fallen-aeons.md §7.1, research/re-ffx2-yojimbo-valefor.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-valefor-besaid.ts`, which plays the chapter bench's advisor line (`tests/unit/helpers/valeforDrive.ts`): every `labels` entry below is a
 * row that tactic asks for, so each hint explains the command the player is told to press.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, the fallen aeons' action counter; the FFX Valefor (Yuna's aeon, and the possessed one of FFX's own fights) shares a name and
 * nothing else.
 *
 * Sourced facts only: the Normal Attack, Sonic Wings (MP, on the character furthest away), Energy Ray (magic, the whole party in front of her) and Energy Blast (all; **not magic: its row's damage flags are 0, so
 * neither Shell nor Protect reduces it**) (§7.1, `[verified: 2 sources]`, and the RE review of 2026-10-14 of the game's own script and move rows: m164, row 164); the hidden count that every attack-class turn of hers
 * and every blow she takes raises, an Energy Ray at 30 and at 60 and the Energy Blast at 100 (§7.1, **and the game's own script**); Strength 97, Defense 76, Magic 11, Magic Defense 20 (row 164 of the game's table, the
 * same in §7.1); Breaks and Slow land, Gravity does nothing (row 164). The guide says "the girl who stands farthest from her, Yuna at the start" for Sonic Wings (the game's own start positions,
 * `pos_bsyt05_229`: Yuna 53.00, Rikku and Paine 52.39) and "the whole party" for Energy Ray (the girls all stand in front of her in the fixed formation). **Not modelled, so not promised:** where a girl stands once she has moved.
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`), as for every FFX-2 guide.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The chapter's one fighter (`src/data/ffx2/enemies/valefor.ts`). */
export const VALEFOR_BESAID_GUIDE_IDS = ['x2-valefor'] as const;

const RULES: GuideRule[] = [
  {
    text: 'Most of what she does is a plain swing, and it is the part that hurts: her Strength is 97. Put Protect on all three girls and lower her Strength with Power Break.',
    short: 'Protect, and Power Break her',
    cite: 'ffx2-fallen-aeons §7.1',
  },
  {
    text: 'Every move of hers and every blow she takes fills a hidden count. Energy Ray, on the whole party, comes twice on the way up, and Energy Blast, also on everyone, comes at the top, after which the count starts over.',
    short: 'Two Energy Rays, then Energy Blast',
    cite: 'ffx2-fallen-aeons §7.1',
  },
  {
    text: 'Energy Ray is magic and lands on all three girls at once, so Shell halves it. Energy Blast is not magic: neither Shell nor Protect softens it, so only HP does. Heal after each Ray, and top everyone up before the Blast.',
    short: 'Shell the Rays, heal before the Blast',
    cite: 'ffx2-fallen-aeons §7.1',
  },
  {
    text: 'Sonic Wings does no damage to HP: it only chips a little MP from the girl who stands farthest from her, Yuna at the start. Keep an Ether for Yuna, who needs MP for Protect, Shell and Curaga.',
    short: 'Sonic Wings drains MP',
    cite: 'ffx2-fallen-aeons §7.1',
  },
  {
    text: 'Darkness ignores her Defense of 76, and Breaks and Slow land on her, so two Dark Knights or a Dark Knight and a Warrior do the damage while Yuna keeps everyone standing.',
    short: 'Darkness ignores her Defense',
    cite: 'ffx2-fallen-aeons §7.1',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Darkness'] }, text: 'Darkness ignores her Defense of 76, and costs HP, not MP', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Protect'] }, text: 'Protect for the party: her plain swing is the hit that hurts', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Shell'] }, text: 'Shell for the party: Energy Ray is magic and hits everyone, and Shell halves it (not the Blast)', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Power Break'] }, text: 'Power Break lowers her Strength: Breaks land on her', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Armor Break'] }, text: 'Armor Break lowers her Defense of 76, so every swing goes further', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Mega-Potion'] }, text: 'Two girls are low: a Mega-Potion tops up everyone before the next Ray', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Curaga', 'Cura', 'Hi-Potion'] }, text: 'Top {target} up before the next swing', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Phoenix Down', 'Life'] }, text: 'Stand {target} back up', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Ether'] }, text: 'Yuna needs MP for Protect, Shell and Curaga: Sonic Wings chips at it', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Pray'] }, text: 'Nothing urgent: Pray keeps everyone ticking up', cite: 'ffx2-fallen-aeons §7.1' },
];

const PHASES: GuidePhase[] = [
  {
    label: 'VALEFOR',
    note: 'The banner names each move as it starts: two Energy Rays, then Energy Blast, and the count begins again.',
    cite: 'ffx2-fallen-aeons §7.1',
  },
];

export const FFX2_VALEFOR_BESAID_GUIDE: ChapterGuide = {
  id: 'ffx2-valefor-besaid',
  title: 'Valefor',
  bossIds: [...VALEFOR_BESAID_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_VALEFOR_BESAID_GUIDE;
