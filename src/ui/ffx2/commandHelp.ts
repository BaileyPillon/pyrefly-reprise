import type { AbilityDef, AvailableCommand } from '../../battle/common/types.ts';
import { abilityForCommand } from '../../battle/ffx2/simulate.ts';
import { chainRegistries, defaultAbilities } from '../../battle/ffx2/abilities.ts';
import { ABILITIES, ITEMS } from '../../data/ffx2/index.ts';
import { describeAbility } from '../../engine/tactics/advisor.ts';

/**
 * PR-0012 (round 09, FFX-2 only — FFX's own command menu already has this,
 * `src/ui/ffx/commandHelp.ts`; the two games' menus are separate components
 * per AGENTS.md rule 14 and this is the FFX-2 half): the FFX-2 command menu
 * never said what the highlighted row does. FFX's slab reads the row's
 * `AvailableCommand.help` when there is one and otherwise derives a sentence
 * from the move's own record via `describeAbility` — see that file's doc
 * comment for why it is derived rather than authored per-row (200-odd
 * sentences in `src/data` going stale the moment a spell is retuned). This is
 * the same approach for FFX-2's own registries: `data/ffx2/index.ts`'s
 * `ABILITIES`/`ITEMS` are the real, shipped tables; `defaultAbilities`
 * (`battle/ffx2/abilities.ts`) is only the structural fallback (Attack,
 * Defend, and the boss-only moves that never reach a player menu) for an id
 * neither data table resolves.
 */
const ABILITY_REGISTRY = chainRegistries({ get: (id) => ABILITIES[id] }, defaultAbilities);
const ITEM_REGISTRY = { get: (id: string) => ITEMS[id] };

function defFor(cmd: AvailableCommand): AbilityDef | null {
  return abilityForCommand(cmd.command, ABILITY_REGISTRY, ITEM_REGISTRY) ?? null;
}

/**
 * One line on the row, or `''` when nothing can honestly be said (rule 6: no
 * invented copy). `describeAbility` covers every command kind FFX-2 offers a
 * player except the two below, which are the menu's own rows rather than
 * anything with an `AbilityDef` — written here for the same reason FFX's
 * `commandEffectText` writes Escape and Trigger itself.
 */
export function commandEffectText(cmd: AvailableCommand): string {
  // Round 10 (PR-0012 repair, FFX-2 only): `escape` and `spherechange` are
  // menu rows, not abilities with their own `AbilityDef` — `defFor` can still
  // resolve *something* for a `spherechange` command (the destination
  // dressphere's Garment Grid gate string, e.g. "Passes red"), and
  // `describeAbility` had no way to know that string was not meant to answer
  // "what does this row do". A verifier caught the FFX-2 command slab
  // printing that gate string as the row's description. These two kinds are
  // handled here, before `describeAbility` is ever asked, for the same
  // reason FFX's own `commandEffectText` writes them itself.
  switch (cmd.command.kind) {
    case 'escape':
      return 'Leaves the battle, if this encounter allows it';
    case 'spherechange':
      // `CommandMenu.ts`'s own `spherechangeHelp` already prints the
      // gate-preview line (`GRANTS: …`) on the row itself; the highlighted-row
      // slab says what Change fundamentally is, not that fact again.
      return 'Changes into another dressphere; the destination spends the turn';
    default: {
      const def = defFor(cmd);
      return refineForFfx2(describeAbility(def, cmd, cmd.command), def);
    }
  }
}

/**
 * The statuses FFX-2's own data hands to the party as protection rather than
 * as harm — the same five the boss-side wipe moves strip
 * (`battle/ffx2/abilities-core.ts` `BUFF_WIPE`), plus Auto-Life. A move whose
 * every status is on this list "grants" rather than "inflicts".
 */
const FFX2_BUFFS: ReadonlySet<string> = new Set(['shell', 'protect', 'reflect', 'regen', 'haste', 'auto-life']);

/** `white-magic-cast-time` -> `White Magic`. */
function passiveSchool(passive: string): string {
  return passive
    .replace(/-cast-time$/, '')
    .split('-')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * PR-0012 repair (FFX-2 only): two wordings `describeAbility` (shared with
 * FFX, `engine/tactics/advisor.ts`, not this track's file) gets wrong for
 * FFX-2's own records, fixed on this side only:
 *
 * - The Lv. 2 / Lv. 3 passives (`x2-white-mage-lv2` etc.) have no formula,
 *   power or status, so the shared fallback printed the row's own name as its
 *   description. Their record carries the effect in `extra`
 *   (`{ passive: 'white-magic-cast-time', percent: 30 }`), sourced in
 *   `research/ffx2-combat-core.md` ("White Magic charge time -30%").
 * - Shell, Protect, Reflect and Regen read "Inflicts Shell". They are gifts to
 *   the party, so they read "Grants Shell to the party".
 */
export function refineForFfx2(text: string, def: AbilityDef | null): string {
  if (!def) return text;
  const extra = def.extra as { passive?: unknown; percent?: unknown } | undefined;
  if (typeof extra?.passive === 'string' && /-cast-time$/.test(extra.passive) && typeof extra.percent === 'number') {
    return `Passive: ${passiveSchool(extra.passive)} charge time −${extra.percent}%`;
  }
  const buffsOnly = def.statusEffects.length > 0 && def.statusEffects.every((s) => FFX2_BUFFS.has(s.status));
  if (!buffsOnly) return text;
  const scope = def.targeting === 'all-allies' ? ' to the party' : '';
  return text
    .replace(/^Inflicts ([^·]+?)(\s*·|$)/, (_m, what: string, tail: string) => `Grants ${what.trim()}${scope}${tail}`)
    .replace(/· inflicts /g, '· grants ');
}

/** What the slab prints: the effect, with the disabled reason in front of it when disabled. */
export function commandHelpText(cmd: AvailableCommand): string {
  const effect = commandEffectText(cmd);
  if (cmd.enabled || !cmd.disabledReason) return effect;
  return effect ? `${cmd.disabledReason} — ${effect}` : cmd.disabledReason;
}

/** A group row (a category collapsed to one submenu-opening row): the one item's own text, or a generic opener. */
export function groupHelpText(label: string, items: readonly AvailableCommand[]): string {
  const only = items.length === 1 ? items[0] : undefined;
  return (only ? commandHelpText(only) : '') || `Open the ${label} menu.`;
}
