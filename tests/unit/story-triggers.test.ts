import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

import {
  AI_EMITTED_TRIGGERS,
  CHAIN_SEAMS,
  CHAPTER_KEYS,
  MID_SCRIPT_BUDGET_MS,
  PRESENTER_BUDGET_MS,
  SEAM_BUDGET_MS,
  STORY_CHAPTERS,
  allReferencedTriggers,
  blockingSteps,
  budgetFor,
  midScript,
  midScriptDurations,
  missingMidScripts,
  scriptDurationMs,
  unreachableMidScripts,
} from '../../src/story/registry.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import type { EnemyGroupDef } from '../../src/battle/common/types.ts';
import { ENEMY_GROUPS_BY_ID as FFX_GROUPS } from '../../src/data/ffx/index.ts';
import { ENEMY_GROUPS_BY_ID as FFX2_GROUPS } from '../../src/data/ffx2/index.ts';

/**
 * Mid-battle beats are wired by string, twice over, and neither wire is typed.
 *
 * The engine emits `script-trigger` with the trigger's **id**; AI scripts emit
 * names of their own with no trigger at all; and the presenter looks both up in
 * one `midScripts` record, logging and carrying on when it misses. That is how
 * Yunalesca's zombie lesson, her last-quarter admission, Jecht's goodbye, the
 * whole possessed-aeon gauntlet and every Farplane voice in Chapter 5 became
 * dead content nobody could see in a type-check.
 *
 * The other half of the same bug is time: a `say` with no `auto` waits on a
 * Confirm, and the presenter abandons any script that has not finished within
 * 30 s — which is how `yunalesca-form-2` ended up in the log.
 *
 * See `src/story/registry.ts` for the invariants; this file is their teeth.
 */

describe('every referenced trigger name resolves to a registered script', () => {
  it('finds triggers to check (the audit itself works)', () => {
    expect(allReferencedTriggers().length).toBeGreaterThanOrEqual(30);
    expect(AI_EMITTED_TRIGGERS['ffx2-vegnagun-shuyin'].length).toBeGreaterThan(0);
  });

  it('no referenced trigger is missing its script', () => {
    const missing = missingMidScripts().map(
      (ref) => `${ref.chapter}: "${ref.name}" (${ref.source})`,
    );
    expect(missing).toEqual([]);
  });

  it('every trigger id equals its script ref', () => {
    // The engine emits `name: trigger.id`, so a trigger whose `script` differs
    // is a beat that can never play, however well-written the script is.
    const drifted: string[] = [];
    for (const chapter of CHAPTER_KEYS) {
      for (const trigger of STORY_CHAPTERS[chapter].mid) {
        if (trigger.id !== trigger.script) {
          drifted.push(`${chapter}: id "${trigger.id}" -> script "${trigger.script}"`);
        }
      }
    }
    expect(drifted).toEqual([]);
  });

  it('trigger ids are unique within a chapter', () => {
    for (const chapter of CHAPTER_KEYS) {
      const ids = STORY_CHAPTERS[chapter].mid.map((t) => t.id);
      expect(new Set(ids).size, `${chapter} has a duplicate trigger id`).toBe(ids.length);
    }
  });

  it('no mid-battle script is unreachable', () => {
    const dead = unreachableMidScripts().map((s) => `${s.chapter}: "${s.name}"`);
    expect(dead).toEqual([]);
  });

  it('the registry and data/encounters.ts agree on the chapters', () => {
    expect([...CHAPTERS].map((c) => c.id).sort()).toEqual([...CHAPTER_KEYS].sort());
    for (const chapter of CHAPTERS) {
      const key = chapter.id as (typeof CHAPTER_KEYS)[number];
      expect(chapter.scriptsRef, `${chapter.id} scriptsRef`).toBe(STORY_CHAPTERS[key]);
    }
  });
});

describe('mid-battle scripts fit their budget', () => {
  it('both budgets leave headroom under the presenter abandon budget', () => {
    expect(MID_SCRIPT_BUDGET_MS).toBeLessThan(PRESENTER_BUDGET_MS);
    expect(SEAM_BUDGET_MS).toBeLessThan(PRESENTER_BUDGET_MS - 3_000);
  });

  it('no mid-battle line waits on input, and none branches or loops', () => {
    const offenders: string[] = [];
    for (const chapter of CHAPTER_KEYS) {
      for (const [name, script] of Object.entries(STORY_CHAPTERS[chapter].midScripts)) {
        for (const step of blockingSteps(script)) {
          const what =
            step.type === 'say' || step.type === 'narrate'
              ? `${step.type} without auto: "${step.text}"`
              : `${step.type} step`;
          offenders.push(`${chapter} "${name}": ${what}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every combat beat is under 8 s and every chain seam under its own cap', () => {
    const over: string[] = [];
    for (const chapter of CHAPTER_KEYS) {
      for (const { name, ms, budget } of midScriptDurations(chapter)) {
        if (ms > budget) over.push(`${chapter} "${name}": ${Math.round(ms)}ms > ${budget}ms`);
      }
    }
    expect(over).toEqual([]);
  });

  it('only declared chain seams exceed the 8 s beat budget', () => {
    for (const chapter of CHAPTER_KEYS) {
      for (const { name, ms } of midScriptDurations(chapter)) {
        if (CHAIN_SEAMS[chapter].includes(name)) continue;
        expect(ms, `${chapter} "${name}"`).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
      }
    }
  });

  it('every declared chain seam is a script that exists', () => {
    for (const chapter of CHAPTER_KEYS) {
      for (const name of CHAIN_SEAMS[chapter]) {
        expect(midScript(chapter, name), `${chapter} seam "${name}"`).toBeDefined();
      }
    }
  });

  it('measures a script the way the runner plays it', () => {
    // 60 characters at the typewriter's 42 cps, plus the hold, plus the wait.
    const ms = scriptDurationMs([
      { type: 'say', who: 'auron', text: 'x'.repeat(42), auto: 1_000 },
      { type: 'wait', ms: 500 },
    ]);
    expect(ms).toBeCloseTo(1_000 + 1_000 + 500, 0);
    // A line with no `auto` is charged the whole budget, so it can never pass.
    expect(scriptDurationMs([{ type: 'say', who: 'auron', text: 'x' }])).toBeGreaterThan(
      PRESENTER_BUDGET_MS,
    );
  });

  it('budgets the two kinds of script differently', () => {
    expect(budgetFor('yunalesca', 'yunalesca-form-2')).toBe(MID_SCRIPT_BUDGET_MS);
    expect(budgetFor('braskas-final-aeon', 'jecht-falls')).toBe(SEAM_BUDGET_MS);
  });
});

/**
 * The other half of the same class of bug, one level down.
 *
 * A trigger can resolve to a perfectly good script and still never fire,
 * because `TriggerCondition.who` is `CombatantId` and `CombatantId` is
 * `string` — so is `AbilityId`. Nothing type-checks a `who` against the
 * formation it is supposed to name. Chapter 3 shipped
 * `{ ko, who: 'valefor' }` for five entrances and five farewells while the
 * formations `buildPossessedAeonChain` produces call that combatant
 * `possessed-valefor`, and `{ ability-used, ability: 'talk-inert' }` for an id
 * no ability record anywhere defines. Ten grief beats and the father's
 * silence, all registered, all budgeted, none reachable.
 *
 * So: walk each chapter's formation chain the way `BattleScreen` does, collect
 * the ids that can actually exist in that fight, and hold every trigger
 * against them.
 */

/**
 * `nextGroupId`s that no formation exports, and the id the runtime uses
 * instead. Each entry is a live defect in a file this suite does not own —
 * `BattleScreen` logs `chapter chains to "…" but no formation exports that id`
 * and **stops the chain there**, so everything past the dangling link is
 * unreachable in play whatever the story layer does.
 *
 * Chapter 3's `braskas-final-aeon` formation points at `'possessed-aeons'`,
 * which is a placeholder: `buildPossessedAeonChain(MANDATORY_AEON_IDS)` builds
 * the real links and the first of them is `'possessed-valefor'`
 * [`src/data/ffx/enemies/braskas-final-aeon.ts`]. Delete the entry when the
 * data is fixed; the walk below will then follow it on its own.
 */
const DANGLING_CHAIN_LINKS: Readonly<Record<string, string>> = {
  'possessed-aeons': 'possessed-valefor',
};

/** Every formation in a chapter, following `nextGroupId` like `BattleScreen` does. */
function formationChain(chapter: (typeof CHAPTERS)[number]): EnemyGroupDef[] {
  const chain: EnemyGroupDef[] = [];
  const seen = new Set<string>();
  let group: EnemyGroupDef | undefined = chapter.enemyGroupRef;
  while (group && !seen.has(group.id)) {
    seen.add(group.id);
    chain.push(group);
    const nextId: string | undefined = group.nextGroupId;
    if (nextId === undefined) break;
    const fallbackId: string = DANGLING_CHAIN_LINKS[nextId] ?? '';
    const resolved: EnemyGroupDef | undefined =
      FFX_GROUPS[nextId] ?? FFX2_GROUPS[nextId] ?? FFX_GROUPS[fallbackId] ?? FFX2_GROUPS[fallbackId];
    group = resolved;
  }
  return chain;
}

/** Combatant ids that can be on the field at some point in a chapter. */
function combatantIds(chapter: (typeof CHAPTERS)[number]): Set<string> {
  const ids = new Set<string>();
  for (const group of formationChain(chapter)) {
    for (const enemy of [...group.enemies, ...(group.parts ?? [])]) ids.add(enemy.id);
  }
  for (const member of chapter.buildRef.members) ids.add(member.id);
  if (chapter.buildRef.game === 'ffx') {
    for (const aeon of chapter.buildRef.aeons) ids.add(aeon.id);
  }
  return ids;
}

/** Ability ids anything in a chapter can use. */
function abilityIds(chapter: (typeof CHAPTERS)[number]): Set<string> {
  const ids = new Set<string>();
  for (const group of formationChain(chapter)) {
    for (const enemy of [...group.enemies, ...(group.parts ?? [])]) {
      for (const id of enemy.abilityIds) ids.add(id);
    }
  }
  if (chapter.buildRef.game === 'ffx') {
    for (const member of chapter.buildRef.members) {
      for (const id of member.learnedAbilityIds) ids.add(id);
      for (const id of member.overdrive.unlockedOverdriveIds) ids.add(id);
    }
    for (const aeon of chapter.buildRef.aeons) {
      for (const id of aeon.abilityIds ?? []) ids.add(id);
    }
  } else {
    for (const member of chapter.buildRef.members) {
      for (const progress of Object.values(member.abilitiesLearned)) {
        for (const id of progress.learned ?? []) ids.add(id);
      }
    }
  }
  return ids;
}

describe('every trigger names ids that exist in its own chapter', () => {
  it('the formation chain resolves end to end', () => {
    // A dangling link truncates the chapter in play, so each one has to be a
    // declared, explained exception rather than a warning nobody reads.
    const dangling: string[] = [];
    for (const chapter of CHAPTERS) {
      for (const group of formationChain(chapter)) {
        const nextId = group.nextGroupId;
        if (nextId === undefined) continue;
        if (FFX_GROUPS[nextId] ?? FFX2_GROUPS[nextId]) continue;
        if (nextId in DANGLING_CHAIN_LINKS) continue;
        dangling.push(`${chapter.id}: "${group.id}" -> "${nextId}"`);
      }
    }
    expect(dangling).toEqual([]);
  });

  it('the chain reaches the last formation each chapter is written for', () => {
    // Guards the walk itself: if `formationChain` quietly stopped early, every
    // assertion below would be checking a shorter fight than the one shipped.
    const last = (id: string): string => {
      const chapter = [...CHAPTERS].find((c) => c.id === id);
      const chain = formationChain(chapter!);
      return chain[chain.length - 1]!.id;
    };
    expect(last('braskas-final-aeon')).toBe('yu-yevon');
    expect(last('ffx2-vegnagun-shuyin')).toBe('shuyin');
  });

  it('every `who` is a combatant that can be on the field', () => {
    const unknown: string[] = [];
    for (const chapter of CHAPTERS) {
      const ids = combatantIds(chapter);
      for (const trigger of chapter.scriptsRef.mid) {
        const when = trigger.when;
        if (!('who' in when) || when.who === undefined) continue;
        if (!ids.has(when.who)) unknown.push(`${chapter.id} "${trigger.id}": who "${when.who}"`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it('every `ability-used` names a real ability', () => {
    const unknown: string[] = [];
    for (const chapter of CHAPTERS) {
      const ids = abilityIds(chapter);
      for (const trigger of chapter.scriptsRef.mid) {
        if (trigger.when.type !== 'ability-used') continue;
        if (!ids.has(trigger.when.ability)) {
          unknown.push(`${chapter.id} "${trigger.id}": ability "${trigger.when.ability}"`);
        }
      }
    }
    expect(unknown).toEqual([]);
  });

  it('the possessed-aeon gauntlet is wired to the ids the chain really uses', () => {
    // The regression this file was opened for: bare aeon names for combatants
    // the formation builder prefixes.
    const chapter = [...CHAPTERS].find((c) => c.id === 'braskas-final-aeon')!;
    const ids = combatantIds(chapter);
    for (const aeon of ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut']) {
      expect(ids.has(`possessed-${aeon}`), `possessed-${aeon} is in the chain`).toBe(true);
      const wired = chapter.scriptsRef.mid.filter(
        (t) => 'who' in t.when && t.when.who === `possessed-${aeon}`,
      );
      expect(wired.map((t) => t.id).sort()).toEqual([`${aeon}-enters`, `${aeon}-falls`]);
    }
  });
});

/**
 * `AI_EMITTED_TRIGGERS` is hand-maintained, for a good reason: `vegnagun-head.ts`
 * builds `shuyin-line-${line}` by template, so no static scan can produce the
 * whole list, and a name *disappearing* from the AI should be noticed by a
 * person rather than silently dropped.
 *
 * The other direction is not a judgement call, though. A name **added** to an
 * AI script and not added here is a beat that reaches the presenter, misses,
 * and logs — the original bug, one more time. So: scan the emitters, and hold
 * every literal name and every template prefix against the list.
 */
describe('the hand-maintained AI trigger list still covers the emitters', () => {
  const AI_DIRS = ['src/battle/ffx/ai', 'src/battle/ffx2/ai'];
  /** Text after each `type: 'script-trigger'`, where the `name` lives. */
  const EMIT_WINDOW = 200;

  const scan = (): { literals: Set<string>; prefixes: Set<string> } => {
    const literals = new Set<string>();
    const prefixes = new Set<string>();
    for (const dir of AI_DIRS) {
      const full = join(process.cwd(), dir);
      if (!existsSync(full)) continue;
      for (const file of readdirSync(full).filter((f) => f.endsWith('.ts'))) {
        const source = readFileSync(join(full, file), 'utf8');
        let at = source.indexOf("type: 'script-trigger'");
        while (at !== -1) {
          const window_ = source.slice(at, at + EMIT_WINDOW);
          const literal = /name:\s*'([^']+)'/.exec(window_);
          if (literal?.[1]) literals.add(literal[1]);
          const template = /name:\s*`([^`$]*)\$\{/.exec(window_);
          if (template?.[1]) prefixes.add(template[1]);
          at = source.indexOf("type: 'script-trigger'", at + 1);
        }
      }
    }
    return { literals, prefixes };
  };

  const listed = new Set(Object.values(AI_EMITTED_TRIGGERS).flatMap((names) => [...names]));

  it('finds the emitters at all (the scan itself works)', () => {
    const { literals, prefixes } = scan();
    // `vegnagun.ts`, `vegnagun-head.ts` and `shuyin.ts` between them.
    expect(literals.size).toBeGreaterThanOrEqual(8);
    expect([...prefixes]).toContain('shuyin-line-');
  });

  it('every literal name an AI emits is on the list', () => {
    const { literals } = scan();
    expect([...literals].filter((name) => !listed.has(name)).sort()).toEqual([]);
  });

  it('every templated name has entries on the list under its prefix', () => {
    const { prefixes } = scan();
    for (const prefix of prefixes) {
      const covered = [...listed].filter((name) => name.startsWith(prefix));
      expect(covered.length, `nothing listed for the "${prefix}*" family`).toBeGreaterThan(0);
    }
  });

  it('nothing on the list is missing a script', () => {
    // Belt and braces: the list is only useful if the names on it resolve.
    for (const chapter of CHAPTER_KEYS) {
      for (const name of AI_EMITTED_TRIGGERS[chapter]) {
        expect(midScript(chapter, name), `${chapter} "${name}"`).toBeDefined();
      }
    }
  });
});
