/**
 * The `ObjectiveRule` -> `BattleState` evaluator.
 *
 * `src/data/chapter-meta.ts` deliberately stops at a *descriptor*: a flat,
 * serialisable tagged union that names an observable game fact and imports
 * nothing from `src/battle/**` (see `docs/handoff/pause-screen.md`, which
 * calls this evaluator out as the piece the data slice does not own). This
 * module is that missing half, and it lives in `src/ui/common` rather than
 * next to the data because it is a *presentation* question — "has the player
 * done the thing the pause screen promised to tick?" — not a rule the engine
 * enforces. Nothing in `src/battle/**` imports it.
 *
 * ## Why the log, and not just the state
 *
 * Four of the eight rule shapes are about something that **happened**, not
 * something that is true now: a Zombie that was cured is not on anyone any
 * more, a Mega Flare that was survived is over, a Yu Pagoda that was downed
 * may well have been restored since. Reading `BattleState.combatants` alone
 * would flip those rows back off the moment the fact stopped being current,
 * which is the opposite of a checklist. So every historical rule is answered
 * from `BattleState.log` — the ordered, append-only record the engine
 * guarantees (`log[i].seq === i`) — and only `boss-hp-below` reads live state.
 *
 * That also makes the whole module pure and replayable: hand it a log and it
 * gives the same answer forever, which is what the tests do.
 */

import type { BattleEvent, BattleState, CombatantId } from '../../battle/common/types.ts';
import type { ChapterMeta, ChapterObjective, ObjectiveRule } from '../../data/chapter-meta.ts';

/** Everything an {@link ObjectiveRule} can be asked about. */
export interface ObjectiveContext {
  /** Live engine state, or null before a battle exists. */
  state: Readonly<BattleState> | null;
  /** The ordered event log. Usually `state.log`; separate so a test can pass one alone. */
  log: readonly BattleEvent[];
  /**
   * Which link of a chained chapter is live, 1-based — `BattleScreen.links`.
   *
   * Not on `BattleState`, and deliberately so: the engine never advances
   * groups itself (it reports `nextGroupId` on a victory and stops), so the
   * chain position is the *screen's* count, not the battle's. `link-reached`
   * is the only rule that reads it.
   */
  links: number;
}

/** One evaluated checklist row. */
export interface ObjectiveStatus {
  id: string;
  label: string;
  done: boolean;
}

/**
 * True when an `action-start` names this ability.
 *
 * `chapter-meta.ts` writes the *plain* ability name — `'mega-flare'`,
 * `'terror-of-zanarkand'` — because that is what the objective row says out
 * loud. The shipped ability records often carry a namespaced id for the same
 * move: FFX-2's Bahamut casts `'x2-bahamut-mega-flare'` and Shuyin casts
 * `'x2-shuyin-terror-of-zanarkand'`, while Seymour's is the bare
 * `'total-annihilation'` and Jecht's the bare `'ultimate-jecht-shot'`.
 *
 * Rather than forcing every objective to spell out an engine id (and go stale
 * the next time an enemy's ability table is renamespaced), a rule matches
 * either the whole id or a hyphen-delimited *suffix* of it — so `'mega-flare'`
 * matches `'x2-bahamut-mega-flare'`, which is the case that exists.
 *
 * The comparison is against `'-' + want`, never a bare `endsWith`, so that a
 * rule cannot match on a word boundary that is not there: `'flare'` matches
 * neither `'megaflare'` nor `'solarflare'`. It *would* match `'mega-flare'`,
 * because that genuinely is a hyphen-delimited suffix — the guard is against
 * accidental substrings, not against an objective naming a move too loosely.
 * No shipped objective does; if one ever needs to, spell the full engine id.
 */
function abilityMatches(abilityId: string | undefined, want: string): boolean {
  if (abilityId === undefined) return false;
  return abilityId === want || abilityId.endsWith(`-${want}`);
}

/** Index of the first `action-start` for `ability`, or -1. */
function abilityStartIndex(log: readonly BattleEvent[], ability: string): number {
  return log.findIndex((e) => e.type === 'action-start' && abilityMatches(e.abilityId, ability));
}

/**
 * Ids that are down **right now**, replayed from the log.
 *
 * `parts-downed` asks whether a named group was all down *at the same time* —
 * "kill both Pagodas the same turn", the targeting rule the whole Braska's
 * Final Aeon fight is built on. That is a question about a moment, so it is
 * answered by walking the log and testing the set after every event, rather
 * than by looking at who happens to be dead when the player opens the menu.
 *
 * `ko` / `revive` cover party-shaped combatants and ordinary enemies;
 * `part-destroyed` / `part-restored` cover the boss-part combatants that the
 * Vegnagun and Yu Pagoda formations are made of. Both pairs are tracked
 * because a formation may report either, and a Pagoda that comes back must
 * take its tick away again until the pair goes down together.
 */
function everDownTogether(log: readonly BattleEvent[], targetIds: readonly CombatantId[]): boolean {
  if (targetIds.length === 0) return false;
  const down = new Set<CombatantId>();
  for (const event of log) {
    if (event.type === 'ko') down.add(event.targetId);
    else if (event.type === 'part-destroyed') down.add(event.partId);
    else if (event.type === 'revive') down.delete(event.targetId);
    else if (event.type === 'part-restored') down.delete(event.partId);
    else continue;
    if (targetIds.every((id) => down.has(id))) return true;
  }
  return false;
}

/**
 * The enemy the chapter is *about*, for `boss-hp-below`.
 *
 * A formation is a boss plus its furniture (Mortiorchis, two Yu Pagodas, four
 * Vegnagun parts), and the rule means the boss. The largest `maxHp` on the
 * field is a reliable, data-free way to say which one that is in all five of
 * our chapters, and it degrades sensibly in a formation we have not written
 * yet. Removed combatants are skipped so a destroyed part cannot win the vote.
 */
export function bossCombatant(state: Readonly<BattleState> | null): { hp: number; maxHp: number } | null {
  if (!state) return null;
  let best: { hp: number; maxHp: number } | null = null;
  for (const id of state.enemyIds) {
    const c = state.combatants[id];
    if (!c || c.removed) continue;
    if (!best || c.stats.maxHp > best.maxHp) best = { hp: c.hp, maxHp: c.stats.maxHp };
  }
  return best;
}

/** Answer one rule. Pure: same context in, same answer out. */
export function evaluateObjective(rule: ObjectiveRule, ctx: ObjectiveContext): boolean {
  const { log, state } = ctx;

  switch (rule.kind) {
    case 'victory':
      return state?.result?.outcome === 'victory' || log.some((e) => e.type === 'victory');

    case 'status-cured':
      // `expired` and `ko` are not cures — the player did not do anything.
      // `dispelled` is, and is what Chapter 2's "Dispel Yunalesca's Regen"
      // objective is actually asking for; `consumed` is a Nul charge or
      // Auto-Life spending itself, which is also not a cure.
      return log.some(
        (e) =>
          e.type === 'status-remove' &&
          e.status === rule.status &&
          (e.reason === 'cured' || e.reason === 'dispelled'),
      );

    case 'survived-ability': {
      const started = abilityStartIndex(log, rule.ability);
      if (started < 0) return false;
      // "Survived" is two claims: the move finished resolving, and the party
      // was still there afterwards. An `action-end` after the start proves the
      // first; the absence of a `defeat` from that point on proves the second.
      // Checking from `started` rather than `started + 1` is deliberate — a
      // wipe inside the ability's own burst must not count as surviving it.
      const rest = log.slice(started);
      return rest.some((e) => e.type === 'action-end') && !rest.some((e) => e.type === 'defeat');
    }

    case 'form-reached':
      // `EnemyFields.formIndex` is 0-based ("formIndex 0 is the starting
      // form"), while the objective copy counts forms the way a player does:
      // Yunalesca's "Form III" is `formIndex` 2. Hence the -1.
      return log.some((e) => e.type === 'form-change' && e.formIndex >= rule.form - 1);

    case 'boss-hp-below': {
      const boss = bossCombatant(state);
      if (!boss || boss.maxHp <= 0) return false;
      return boss.hp / boss.maxHp <= rule.fraction;
    }

    case 'link-reached':
      return ctx.links >= rule.link;

    case 'parts-downed':
      return everDownTogether(log, rule.targetIds);

    case 'chain-landed':
      // `count` is the chain number the event carries; 0 means the chain broke.
      return log.some((e) => e.type === 'chain' && e.count >= rule.count);

    default: {
      // Exhaustiveness: a rule shape added to chapter-meta.ts without a case
      // here is a type error at build time, and a silent `false` at runtime
      // rather than a thrown menu.
      const never: never = rule;
      void never;
      return false;
    }
  }
}

/** Answer every objective on a chapter, in the order the pause screen lists them. */
export function evaluateObjectives(
  objectives: readonly ChapterObjective[],
  ctx: ObjectiveContext,
): ObjectiveStatus[] {
  return objectives.map((o) => ({ id: o.id, label: o.label, done: evaluateObjective(o.rule, ctx) }));
}

/** How many of a chapter's objectives are ticked. */
export function objectivesCleared(meta: ChapterMeta, ctx: ObjectiveContext): number {
  return evaluateObjectives(meta.objectives, ctx).filter((o) => o.done).length;
}

/**
 * The pause screen's ENCOUNTER PROGRESS row.
 *
 * Three different chapters mean three different things by "progress", so this
 * reports whichever one the encounter actually has, in order of how much it
 * tells the player:
 *
 * - a **chained** chapter (Vegnagun's four parts) counts links, because "2/4"
 *   is the only honest answer while three whole battles are still to come;
 * - a chapter with **forms** (Yunalesca) counts the form it is on, for the
 *   same reason — one battle, but the player reads it as three;
 * - anything else falls back to the boss's remaining HP as a percentage.
 *
 * `total` is null for the HP reading, which is what tells a caller to render a
 * bar rather than "N of M".
 */
export interface EncounterProgress {
  label: string;
  /** 0..1, for a bar. */
  ratio: number;
  value: number;
  total: number | null;
}

export function encounterProgress(
  ctx: ObjectiveContext,
  opts: { chainLength?: number } = {},
): EncounterProgress | null {
  const chainLength = opts.chainLength ?? 0;
  if (chainLength > 1) {
    const link = Math.min(Math.max(1, ctx.links), chainLength);
    return { label: `LINK ${link} OF ${chainLength}`, ratio: link / chainLength, value: link, total: chainLength };
  }

  const forms = ctx.log.filter((e) => e.type === 'form-change');
  const last = forms[forms.length - 1];
  if (last && last.type === 'form-change') {
    const form = last.formIndex + 1;
    return { label: `FORM ${form}`, ratio: 0, value: form, total: null };
  }

  const boss = bossCombatant(ctx.state);
  if (!boss || boss.maxHp <= 0) return null;
  const remaining = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
  return { label: `BOSS HP ${Math.round(remaining * 100)}%`, ratio: remaining, value: boss.hp, total: boss.maxHp };
}

/** `1 234 567` ms -> `"20:34"`, or `"1:02:11"` past an hour. Used by PLAY TIME. */
export function formatPlayTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const seconds = total % 60;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
  return `${hours > 0 ? `${hours}:` : ''}${mm}:${String(seconds).padStart(2, '0')}`;
}
