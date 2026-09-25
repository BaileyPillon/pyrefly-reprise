/**
 * Chapter XIII — Paragon, then Trema, on Cloister 100 of the Via Infinito
 * [research/ffx2-trema.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-trema.ts`: every `labels` entry below
 * is a row that file asks for, so each hint explains the command the player is told to press.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, Spherechange, the stash.
 *
 * ## True for every option
 *
 * Bailey's options for the fight (`docs/plans/trema-options-2026-09-25.md`: Oversoul Paragon,
 * Trema alone, action time, another line-up, the kit) are built as OFF switches on the engine
 * track. **This guide must stay true whichever is switched on**, so:
 *
 * - every Paragon line sits behind the chapter-shape flags (`src/data/trema-shape.ts`, read off
 *   the chapter's own formations): Big Bang only with a Paragon that has it (the normal form,
 *   research §4.1), the carry-over only with a Paragon link;
 * - every kit line is keyed on a row only that kit offers (Soul Spring, Mega-Potion), so it can
 *   only ever explain a command the player actually has;
 * - the disputed facts say they are disputed: T-3 (Meteor's type), T-5 (the drain against
 *   Spellspring), research §10.
 *
 * Numbers are the research's: Meteor below 1/2 and 1/4 (§4.2, `[verified: 4 sources]`), Ultima
 * below 1/6 (§4.2, `[verified: 2 sources]`, T-1), Demi 10 MP (§4.2), his immunities (§3.1).
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import type { TremaShape } from '../trema-shape.ts';
import { FFX2_TREMA_SHIPPED, shapeOfChapter } from '../chapter-trema-ship.ts';

const NOTHING_STICKS: GuideRule = {
  text: 'Nothing sticks to Trema: every status, every stat change, Gravity and Reflect fail on him. Only damage moves him.',
  short: 'No status or Gravity lands on Trema',
  cite: 'ffx2-trema §3.1',
};
const METEOR_LINES: GuideRule = {
  text: 'When his HP falls below a half, and again below a quarter, Meteor comes down on the party. Below about a sixth comes Ultima. Heal before you cross each line.',
  short: 'Heal before his HP crosses 1/2 and 1/4',
  cite: 'ffx2-trema §4.2',
};
const DRAIN: GuideRule = {
  text: 'His spells need MP: drained early, he cannot pay for Demi, Flare or Ultima. One source says this still holds under his Spellspring; it is disputed, so keep the party healed either way.',
  short: 'Drain his MP early (one source)',
  cite: 'ffx2-trema §5, §10 T-5',
};
const DARKNESS: GuideRule = {
  text: 'Two Dark Knights on Darkness do the damage, and Rikku keeps them standing.',
  short: 'Two Dark Knights on Darkness, Rikku heals',
  cite: 'ffx2-trema §5',
};
const BIG_BANG: GuideRule = {
  text: 'Paragon answers any hit its guard cannot soften with Big Bang, so hit it with plain Attacks, never Darkness.',
  short: 'Paragon: plain Attacks, never Darkness',
  cite: 'ffx2-trema §4.1',
};
const CARRY: GuideRule = {
  text: 'Nothing is healed and nothing can be changed between Paragon and Trema: his fight starts as Paragon left you.',
  short: 'Trema starts where Paragon left you',
  cite: 'ffx2-trema §1.1',
};

function hints(shape: TremaShape): GuideHint[] {
  const paragon = shape.paragonId;
  const out: GuideHint[] = [
    {
      when: { labels: ['Target MP'] },
      text: 'Drain his MP first: without it he cannot pay for Demi, Flare or Ultima (disputed under Spellspring)',
      cite: 'ffx2-trema §5, §10 T-5',
    },
    {
      when: { labels: ['Soul Spring'] },
      text: 'A Soul Spring drains his MP: without it he cannot pay for his spells (disputed under Spellspring)',
      cite: 'ffx2-trema §5, §12.3',
    },
    {
      when: { kinds: ['spherechange'], bossId: shape.tremaId },
      text: 'Rikku changes dressphere: Gunner to drain his MP, then back to Alchemist once he is dry',
      cite: 'ffx2-trema §5',
    },
    { when: { labels: ['Darkness'] }, text: 'Darkness is the damage line the clears use against Trema', cite: 'ffx2-trema §5' },
  ];
  if (shape.paragonBigBang && paragon) {
    out.push({
      when: { kinds: ['attack'], bossId: paragon },
      text: 'A plain Attack: its guard can soften it, so Paragon does not answer with Big Bang',
      cite: 'ffx2-trema §4.1',
    });
  }
  if (paragon) {
    out.push({
      when: { labels: ['Lunar Curtain'], bossId: paragon },
      text: 'Shell for the party: Genesis is magic, and it strips the Shell once it lands',
      cite: 'ffx2-trema §4.1',
    });
  }
  out.push(
    {
      when: { labels: ['Lunar Curtain'] },
      text: 'Shell ahead of Meteor, which the sources for this version call magical (disputed)',
      cite: 'ffx2-trema §4.2, §10 T-3',
    },
    { when: { labels: ['Light Curtain'] }, text: 'Protect against his three-turn physical chain', cite: 'ffx2-trema §4.2' },
    { when: { labels: ['Megalixir'] }, text: 'Two girls are low: one Megalixir refills everyone', cite: 'ffx2-trema §5' },
    { when: { labels: ['Mega-Potion'] }, text: 'Two girls are down a fifth: a Mega-Potion tops up everyone', cite: 'ffx2-trema §12.3' },
    { when: { labels: ['Remedy'] }, text: 'Cure {target}: Confuse, Itchy and Stop all cost turns', cite: 'ffx2-trema §4.1, §4.2' },
    { when: { labels: ['Phoenix Down'] }, text: 'Stand {target} back up', cite: 'ffx2-trema §5' },
    { when: { labels: ['X-Potion', 'Elixir'] }, text: 'Top {target} up from the stash', cite: 'ffx2-trema §5' },
  );
  return out;
}

function phases(shape: TremaShape): GuidePhase[] {
  const t = shape.tremaId;
  const out: GuidePhase[] = [];
  if (shape.paragonLink && shape.paragonId) {
    out.push({
      bossId: shape.paragonId,
      label: 'PARAGON',
      note: shape.paragonBigBang
        ? 'It answers unsoftened hits with Big Bang. Trema waits behind it, and nothing is healed between.'
        : 'Trema waits behind it, and nothing is healed between.',
      cite: 'ffx2-trema §1.1, §4.1',
    });
  }
  out.push(
    { bossId: t, aboveHpFraction: 0.5, label: 'TREMA', note: 'Below half his HP, Meteor comes down.', cite: 'ffx2-trema §4.2' },
    { bossId: t, aboveHpFraction: 0.25, label: 'BELOW HALF', note: 'One Meteor is spent; the next comes below a quarter.', cite: 'ffx2-trema §4.2' },
    { bossId: t, aboveHpFraction: 1 / 6, label: 'BELOW A QUARTER', note: 'Both Meteors are spent; Ultima comes below about a sixth.', cite: 'ffx2-trema §4.2' },
    { bossId: t, label: 'LAST STRETCH', note: 'Ultima is spent: nothing new is coming.', cite: 'ffx2-trema §4.2' },
  );
  return out;
}

/** The guide for `shape`. */
export function tremaGuideFor(shape: TremaShape): ChapterGuide {
  const rules: GuideRule[] = [NOTHING_STICKS, METEOR_LINES, DRAIN];
  if (shape.paragonBigBang) rules.push(BIG_BANG);
  if (shape.paragonLink) rules.push(CARRY);
  else rules.push(DARKNESS);
  return {
    id: 'ffx2-trema',
    title: 'Trema',
    // Every id the chapter can field (the tactic registers the same two): Trema, and Paragon.
    bossIds: shape.paragonId ? [shape.tremaId, shape.paragonId] : [shape.tremaId, 'paragon'],
    rules,
    hints: hints(shape),
    watch: [],
    phases: phases(shape),
  };
}

/** Chapter XIII's guide, for the shape its registered record has. */
export const FFX2_TREMA_GUIDE: ChapterGuide = tremaGuideFor(shapeOfChapter(FFX2_TREMA_SHIPPED));

export default FFX2_TREMA_GUIDE;
