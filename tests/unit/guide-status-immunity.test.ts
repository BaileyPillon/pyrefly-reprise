/**
 * The strategy guide may not tell the player to use a status its boss is
 * immune to.
 *
 * **The defect this exists for.** `src/data/guides/ffx2-vegnagun-shuyin.ts`'s
 * Leg note said *"Reflect on the Leg bounces the Green Node's buffs onto you"*
 * — repeating `research/ffx2-vegnagun-shuyin.md` §7.2's untagged Leg row, while
 * §3.2 line 236 (`[verified: 2 sources]`) and §3.5 line 441 both make the Leg
 * Reflect-immune and `LEG_IMMUNITIES.reflect = 255` makes the engine refuse it.
 * It shipped because nothing read a `phases[].note` **body**:
 * `tests/unit/strategy-guide.test.ts` checks the *shape* of every `cite` and
 * the rule counts, and no other suite imports the guide text at all.
 *
 * This is `critic/CHECKS.md` CHK-004's scope in a unit test — *"any panel that
 * names an action must be validated against what the acting character can
 * actually do … the advisor, **the strategy guide**, the enemy intent panel"* —
 * narrowed to the one thing a pure checker can decide from the shipped data:
 * a status that simply cannot land.
 *
 * **The invariant.** For each `phases[]` entry with a `bossId`, split the note
 * into sentences. A sentence is *about* that boss when it names it. If such a
 * sentence also names a status the boss's own record blocks outright
 * (`immunities[status] >= 255`, the threshold `resolve.ts`'s `applyRiders` and
 * `intent.ts`'s `statusOddsFFX2` both read), the sentence must say so — it has
 * to contain the word "immune". Advising a status that silently does nothing is
 * the bug; naming it *and* saying it is blocked is the fix.
 *
 * **Both games, deliberately (hard rule 14).** The checker is game-agnostic: it
 * reads `immunities` off the real `EnemyDef`, which is a shared contract in
 * `src/battle/common/types.ts` and is filled the same way by
 * `src/data/ffx/**` and `src/data/ffx2/**`. The lookup below merges both games'
 * `ENEMY_GROUPS_BY_ID`, and `FIXTURES` covers an FFX record and an FFX-2 one.
 * Only the **committed sweep** is scoped, and the comment above it says why.
 */

import { describe, expect, it } from 'vitest';
import type { EnemyDef, EnemyGroupDef, StatusId } from '../../src/battle/common/types.ts';
import type { ChapterGuide, GuidePhase } from '../../src/data/guides/index.ts';
import { FFX2_VEGNAGUN_SHUYIN_GUIDE } from '../../src/data/guides/index.ts';
import { ENEMY_GROUPS_BY_ID as FFX_GROUPS } from '../../src/data/ffx/index.ts';
import { ENEMY_GROUPS_BY_ID as FFX2_GROUPS } from '../../src/data/ffx2/index.ts';

// --------------------------------------------------------------- the records

/**
 * Every enemy in either game by id, parts included.
 *
 * `parts` matters here: the Nodes, Bulwarks and Redoubts live there, and a
 * guide sentence can name one.
 */
function enemiesById(...tables: ReadonlyArray<Record<string, EnemyGroupDef>>): Map<string, EnemyDef> {
  const out = new Map<string, EnemyDef>();
  for (const table of tables) {
    for (const group of Object.values(table)) {
      for (const enemy of [...group.enemies, ...(group.parts ?? [])]) out.set(enemy.id, enemy);
    }
  }
  return out;
}

const ENEMIES = enemiesById(FFX_GROUPS, FFX2_GROUPS);

/** The threshold `resolve.ts` treats as "the rider never lands". */
const IMMUNE = 255;

// --------------------------------------------------------------- the checker

/**
 * What a guide sentence calls each status, in the corpus's own vocabulary
 * (`ffx2-vegnagun-shuyin.md` §1.3's status set, `ffx-combat-core.md` §4.1).
 *
 * Aliases are here because prose and ids disagree: FFX-2 writes Petrification
 * as "Break" in an ability name but "Petrification" in the status set, and FFX
 * calls Darkness "Blind". "Break" itself is deliberately absent — Armor Break
 * and Mental Break are different statuses and the bare word is ambiguous.
 */
const STATUS_WORDS: ReadonlyArray<readonly [string, StatusId]> = [
  ['Reflect', 'reflect'],
  ['Haste', 'haste'],
  ['Slow', 'slow'],
  ['Stop', 'stop'],
  ['Protect', 'protect'],
  ['Shell', 'shell'],
  ['Regen', 'regen'],
  ['Berserk', 'berserk'],
  ['Confuse', 'confuse'],
  ['Confusion', 'confuse'],
  ['Silence', 'silence'],
  ['Sleep', 'sleep'],
  ['Poison', 'poison'],
  ['Darkness', 'darkness'],
  ['Blind', 'darkness'],
  ['Petrify', 'petrify'],
  ['Petrification', 'petrify'],
  ['Zombie', 'zombie'],
  ['Doom', 'doom'],
  ['Curse', 'curse'],
  ['Eject', 'eject'],
  ['Auto-Life', 'auto-life'],
];

/** Label words too generic to identify a boss by. */
const STOPWORDS = new Set(['The', 'And', 'Below', 'Above', 'Half', 'Phase', 'Form', 'Its']);

/**
 * The words a sentence can name this boss by.
 *
 * Sourced from the two strings the data already carries — the phase's own
 * `label` and the enemy record's display `name` — rather than a hand-kept list,
 * so a renamed boss cannot silently fall out of the sweep. Short tokens go
 * ("Yu" of "Yu Yevon" would match far too much; "Yevon" is the distinctive
 * half), and so do the structural words a label uses.
 */
export function bossWords(phase: GuidePhase, enemy: EnemyDef | undefined): string[] {
  const source = `${phase.label} ${enemy?.name ?? ''}`;
  const words = source.match(/[A-Z][A-Za-z'-]*/g) ?? [];
  return [...new Set(words)].filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/** Prose sentences, which is the unit the reader actually takes a claim from. */
export function sentencesOf(note: string): string[] {
  return note
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export interface ImmunityComplaint {
  sentence: string;
  bossId: string;
  status: StatusId;
  word: string;
}

/**
 * Sentences that advise a status the named boss cannot receive.
 *
 * Pure: everything it needs is passed in, so the regression fixture below can
 * run it against the real Leg record with the old note string.
 */
export function checkPhaseNote(
  phase: GuidePhase,
  bossId: string,
  enemy: EnemyDef | undefined,
): ImmunityComplaint[] {
  if (!enemy) return [];
  const names = bossWords(phase, enemy);
  const out: ImmunityComplaint[] = [];
  for (const sentence of sentencesOf(phase.note)) {
    const named = names.find((w) => new RegExp(`\\b${w}\\b`).test(sentence));
    if (!named) continue;
    // Saying "immune" is the whole point of the exception: the sentence is
    // then describing the block rather than recommending past it.
    if (/immune/i.test(sentence)) continue;
    for (const [word, status] of STATUS_WORDS) {
      if (!new RegExp(`\\b${word}\\b`).test(sentence)) continue;
      if ((enemy.immunities[status] ?? 0) < IMMUNE) continue;
      out.push({ sentence, bossId, status, word });
    }
  }
  return out;
}

/** Every complaint a whole guide raises. */
function checkGuide(guide: ChapterGuide): ImmunityComplaint[] {
  return guide.phases.flatMap((phase) => {
    const bossId = phase.bossId;
    if (!bossId) return [];
    return checkPhaseNote(phase, bossId, ENEMIES.get(bossId));
  });
}

// ------------------------------------------------------------ the checker works

describe('the checker itself', () => {
  it('reads both games’ enemy tables, parts included', () => {
    // One FFX record, one FFX-2 record, one FFX-2 **part** — the three shapes
    // the sweep has to resolve.
    expect(ENEMIES.get('braskas-final-aeon'), 'FFX record').toBeDefined();
    expect(ENEMIES.get('vegnagun-leg'), 'FFX-2 record').toBeDefined();
    expect(ENEMIES.get('node-a'), 'FFX-2 part').toBeDefined();
    expect(ENEMIES.get('vegnagun-leg')?.immunities['reflect']).toBe(IMMUNE);
  });

  it('names a boss from its label and its record, and drops the generic words', () => {
    const leg = FFX2_VEGNAGUN_SHUYIN_GUIDE.phases.find((p) => p.bossId === 'vegnagun-leg');
    expect(leg, 'the Leg phase must exist').toBeDefined();
    const words = bossWords(leg as GuidePhase, ENEMIES.get('vegnagun-leg'));
    expect(words).toContain('Leg');
    expect(words).toContain('Nodes');
    expect(words).toContain('Vegnagun'); // the record's display name
    expect(words).not.toContain('And');
  });

  it('splits a note into its sentences', () => {
    expect(sentencesOf('One thing. Two things; still two. Three.')).toHaveLength(3);
  });
});

// ------------------------------------------------------------- the regression

/**
 * The exact string that shipped, against the exact record that refused it.
 *
 * If this ever stops raising a complaint the checker has been defanged, and
 * the bug it was written for could ship again unseen.
 */
const OLD_LEG_NOTE =
  'All 18,220 HP of damage goes into the Leg; the Nodes hold 300,000 and are not the fight. ' +
  'Reflect on the Leg bounces the Green Node’s buffs onto you.';

describe('the regression: the note that shipped [ffx2-vegnagun-shuyin §7.2 CORRECTION]', () => {
  it('flags the old Leg note against the real Leg record', () => {
    const complaints = checkPhaseNote(
      { bossId: 'vegnagun-leg', label: 'Leg and Nodes', note: OLD_LEG_NOTE, cite: 'ffx2-vegnagun-shuyin §7.2' },
      'vegnagun-leg',
      ENEMIES.get('vegnagun-leg'),
    );
    expect(complaints).toHaveLength(1);
    expect(complaints[0]?.status).toBe('reflect');
    expect(complaints[0]?.sentence).toContain('Reflect on the Leg');
  });

  it('passes the corrected note that replaced it', () => {
    const leg = FFX2_VEGNAGUN_SHUYIN_GUIDE.phases.find((p) => p.bossId === 'vegnagun-leg');
    expect(leg?.note, 'the corrected note must still name the immunity').toMatch(/immune to Reflect/);
    expect(checkPhaseNote(leg as GuidePhase, 'vegnagun-leg', ENEMIES.get('vegnagun-leg'))).toEqual([]);
  });
});

// ------------------------------------------------------------------ the sweep

/**
 * **Scope: the chapter-5 guide only, for now.**
 *
 * The checker is game-agnostic and the fixtures above exercise an FFX record,
 * an FFX-2 record and an FFX-2 part, so nothing here is X-2-specific. Run over
 * all five registered guides it raises exactly one complaint, and it is a
 * **false positive of this checker, not a defect in that guide**:
 *
 * > `braskas-final-aeon` / Jecht — "Left-Arm Strike by default, Jecht Beam
 * > about one turn in four (Petrify at 100%)."
 *
 * `src/data/ffx/enemies/braskas-final-aeon.ts` really does set `petrify: 255`,
 * but that is Jecht as a *target*; the sentence is about Jecht Beam
 * **inflicting** Petrify on the party, and
 * `braskas-final-aeon-abilities.ts` carries that rider at `chance: 100`
 * [`ffx-bfa-yu-yevon` §1.6, ability 138]. Telling inflict from receive needs
 * the ability tables, not a sentence, so widening the sweep is its own change
 * with its own review. The sweep is therefore scoped to chapter 5 for now, and
 * **no exemption list is kept** — an exemption would hide the next real one.
 *
 * (Also unresolved rather than failing: `possessed-anima`, whose record is
 * built by the possessed-aeons group at runtime and is not in either static
 * table. `checkPhaseNote` skips an id it cannot resolve; the last case below
 * asserts every **swept** id does resolve, so the sweep can still fail.)
 */
const SWEPT: readonly ChapterGuide[] = [FFX2_VEGNAGUN_SHUYIN_GUIDE];

describe('no guide advises a status its boss is immune to', () => {
  for (const guide of SWEPT) {
    it(`${guide.id}: every phase note survives its own boss's immunity table`, () => {
      const complaints = checkGuide(guide);
      expect(
        complaints.map((c) => `${c.bossId} is immune to ${c.status} ("${c.word}"): ${c.sentence}`),
      ).toEqual([]);
    });
  }

  it('the swept guides actually have phases to check, so this can fail', () => {
    const phases = SWEPT.flatMap((g) => g.phases.filter((p) => p.bossId));
    expect(phases.length).toBeGreaterThan(0);
    for (const phase of phases) {
      expect(ENEMIES.get(phase.bossId as string), `${phase.bossId} must resolve`).toBeDefined();
    }
  });
});
