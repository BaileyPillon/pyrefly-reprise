/**
 * The tab strip's model.
 *
 * One thin full-width strip across the top: the party members on the field
 * first — the active one leading, as the reference does — then CHAPTER, GUIDE,
 * OPTIONS, CONTROLS, MUSIC. `Q` / `E` or `L1` / `R1` cycle; a 2px HP hairline
 * runs under each member's name; a tiny accent dot marks a tab with something
 * on it.
 *
 * MUSIC is a tab on Bailey's own word (21 Sep 2026, README question 4 of
 * `docs/concepts/pause-until-dawn/`, *"yes"*): the jukebox has 21 tracks and
 * its own cursor, so it cannot be a row inside OPTIONS the way REPLAY BRIEFING
 * can.
 *
 * Both games. Nothing in this file branches on `GameId` — the strip is the
 * same strip in FFX and FFX-2, and only its accent colour changes, which is a
 * stylesheet token (`presentation-ink-and-gold.md`), not a model.
 *
 * Pure: no DOM.
 */

import type { AnyCombatant, BattleState } from '../../../battle/common/types.ts';

/** The five tabs that are not a party member, in strip order. */
export const FIXED_TAB_IDS = ['chapter', 'guide', 'options', 'controls', 'music'] as const;

export type FixedTabId = (typeof FIXED_TAB_IDS)[number];

export interface PauseTab {
  /** `member:<combatantId>` or one of {@link FIXED_TAB_IDS}. */
  id: string;
  label: string;
  /** The combatant this tab is about, for a member tab. */
  memberId?: string;
  /** 0..1 HP hairline under a member's name. `null` on a fixed tab. */
  hp: number | null;
  /** Something is live on this tab. */
  dot: boolean;
  /** A KO'd member still gets a tab — a missing one reads as "who was the third?". */
  ko?: boolean;
}

const LABELS: Readonly<Record<FixedTabId, string>> = {
  chapter: 'Chapter',
  guide: 'Guide',
  options: 'Options',
  controls: 'Controls',
  music: 'Music',
};

/**
 * Whether a member's tab shows the "something new" dot.
 *
 * The reference marks a tab that has something on it the player has not looked
 * at. We cannot know what has been looked at, so the dot is defined as
 * **something is live on this member that is not their resting state**, which
 * is the same information at a glance and never lies:
 *
 * - any status at all (KO excluded — the tab already greys out for that);
 * - a full limit gauge, which is the one thing a paused player is hunting for
 *   (FFX Overdrive at 100, FFX-2 ATB at its required ticks);
 * - HP under 30%, the same threshold the hairline turns red at.
 *
 * Both games: each clause reads whichever of the two gauges the combatant
 * actually carries, and a member with neither simply skips that clause.
 */
export function memberTabDot(c: AnyCombatant): boolean {
  for (const [id, inst] of Object.entries(c.statuses)) {
    if (inst && id !== 'ko') return true;
  }
  if ('overdrive' in c && c.overdrive && c.overdrive.gauge >= 100) return true;
  if ('atb' in c && c.atb.required > 0 && c.atb.ticks >= c.atb.required) return true;
  return c.hp / Math.max(1, c.stats.maxHp) < 0.3;
}

/**
 * The whole strip.
 *
 * `activeIds` is the field order, left to right, and the first of them is the
 * tab the screen opens on — "the active party member first". With no battle
 * under the pause (a cutscene) there are no member tabs at all and the strip
 * is the five fixed ones, which is also what makes the screen safe to open
 * over a scene.
 */
export function buildTabs(state: Readonly<BattleState> | null): PauseTab[] {
  const tabs: PauseTab[] = [];
  if (state) {
    for (const id of state.activeIds) {
      const c = state.combatants[id];
      if (!c) continue;
      const tab: PauseTab = {
        id: `member:${c.id}`,
        label: c.name,
        memberId: c.id,
        hp: Math.max(0, Math.min(1, c.hp / Math.max(1, c.stats.maxHp))),
        dot: memberTabDot(c),
      };
      if (!c.alive) tab.ko = true;
      tabs.push(tab);
    }
  }
  for (const id of FIXED_TAB_IDS) {
    tabs.push({ id, label: LABELS[id], hp: null, dot: false });
  }
  return tabs;
}

/** Step the strip, wrapping. */
export function cycleTab(tabs: readonly PauseTab[], current: string, dir: 1 | -1): string {
  if (tabs.length === 0) return current;
  const at = tabs.findIndex((t) => t.id === current);
  const next = ((at < 0 ? 0 : at) + dir + tabs.length) % tabs.length;
  return tabs[next]!.id;
}

/** The member a tab id names, or null for a fixed tab. */
export function memberIdOf(tabId: string): string | null {
  return tabId.startsWith('member:') ? tabId.slice('member:'.length) : null;
}
