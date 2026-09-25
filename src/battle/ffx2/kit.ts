/**
 * The **status half** of the FFX-2 accessories, and the **Stamina Tonic**'s doubled pool.
 * **FFX-2 only** [AGENTS.md rule 14]: FFX has its own tables (`battle/ffx/statuses.ts`).
 *
 * `accessories.ts` carries the stat half of every accessory and says outright that the status
 * half ("Ribbon's blanket immunity, Adamantite's constant Protect + Shell") was not modelled
 * because no shipped build equipped one. Chapter XIII's sourced kit does (method check E5,
 * `docs/plans/trema-winnability-method-check.md` S3, S8), so it is modelled here. Every shipped
 * build before Chapter XIII's kit option equips none of these ids, so no shipped replay moves.
 *
 * - **Auto-Wall** (constant Protect and Shell): Defense Bracer and Adamantite; Moon Bracer is
 *   Auto-Shell and Shining Bracer Auto-Protect `[verified: 2 sources]` (ffx2-combat-core §5.4
 *   table: "Defense Bracer | no stats, **Auto-Wall**", "Adamantite | … Auto-Wall";
 *   ffx2-vegnagun-shuyin §6.7: "Moon Bracer / Shining Bracer / Defense Bracer | Auto-Shell /
 *   Auto-Protect / both", "Adamantite | Constant Protect + Shell"). An auto-status is applied
 *   before the first event and is kept on `Ffx2Unit.autoStatuses`, so a removal list (Dispel,
 *   Genesis) leaves it, the rule Trema's Spellspring already uses (`resolve.ts`, `[estimate]`); the
 *   wiki's *Paragon* says its attacks "cannot nullify Auto-Protect or Auto-Shell".
 * - **Ribbon**: immune to Petrification, Sleep, Silence, Darkness, Poison, Confusion, Berserk,
 *   Curse, Pointless, Itchy, Slow and Stop, not KO, Doom or Eject `[verified: 2 sources]`
 *   (ffx2-combat-core §2.8 "Blanket cures"). Written as immunity 255, which `resolve.ts` already
 *   skips before rolling.
 * - **Stamina Tonic** (`max-hp-x2`): "party's max HP doubled for the battle" (ffx2-combat-core §5.5
 *   items table). The ceiling moves and current HP does not (the FFX record's reading, "no immediate
 *   healing"; the X-2 table is silent). The pool is capped at the default **9,999** (§2.4 "Default
 *   max HP cap | 9999" `[verified: 2 sources]`); Break HP Limit is not modelled, so a girl already
 *   above the cap (the engine does not cap a Crystal Bangle, trema-bench #4) keeps her maximum.
 */

import type { StatBlock, StatusId } from '../common/types.ts';

/** Accessory id → the statuses it keeps on. */
export const ACCESSORY_AUTO_STATUSES: Readonly<Record<string, readonly StatusId[]>> = {
  'defense-bracer': ['protect', 'shell'],
  adamantite: ['protect', 'shell'],
  'moon-bracer': ['shell'],
  'shining-bracer': ['protect'],
};

/** What a Ribbon blocks (§2.8). */
export const RIBBON_IMMUNE: readonly StatusId[] = [
  'petrify', 'sleep', 'silence', 'darkness', 'poison', 'confuse', 'berserk', 'curse', 'pointless', 'itchy', 'slow', 'stop',
];

/** The default max HP cap without Break HP Limit (ffx2-combat-core §2.4). */
export const MAX_HP_CAP = 9999;

/** The statuses a girl's accessories keep on, in accessory order, without repeats. */
export function accessoryAutoStatuses(accessories: readonly string[]): StatusId[] {
  const out: StatusId[] = [];
  for (const id of accessories) for (const s of ACCESSORY_AUTO_STATUSES[id] ?? []) if (!out.includes(s)) out.push(s);
  return out;
}

/** Immunities (255) a girl's accessories grant: a Ribbon's list, or nothing. */
export function accessoryImmunities(accessories: readonly string[]): Partial<Record<StatusId, number>> {
  if (!accessories.includes('ribbon')) return {};
  return Object.fromEntries(RIBBON_IMMUNE.map((s) => [s, 255])) as Partial<Record<StatusId, number>>;
}

/** A doubled max HP under the default cap; a maximum already above the cap is kept. */
export function doubledMaxHp(maxHp: number): number {
  return Math.min(maxHp * 2, Math.max(maxHp, MAX_HP_CAP));
}

/**
 * The sources whose `max-hp-x2` moves the pool: the Stamina Tonic item only. Songstress's Carnival
 * Cancan sets the same status, but its "while she keeps dancing" end is not modelled
 * (`data/ffx2/abilities/songstress.ts`), so it stays inert, as it always has been in FFX-2.
 */
export const POOL_DOUBLING_SOURCES: readonly string[] = ['x2-item-stamina-tonic'];

/** A freshly derived stat block with the pool statuses she carries (Stamina Tonic) laid on. */
export function withPoolStatuses(stats: StatBlock, statuses: Readonly<Record<string, unknown>> | undefined): StatBlock {
  const tonic = statuses?.['max-hp-x2'] as { sourceAbilityId?: string } | undefined;
  if (!tonic || !POOL_DOUBLING_SOURCES.includes(tonic.sourceAbilityId ?? '')) return stats;
  return { ...stats, maxHp: doubledMaxHp(stats.maxHp) };
}
