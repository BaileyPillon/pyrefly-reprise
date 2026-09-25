/**
 * **Who a message banner names.** The `.ig-banner` prints a name slab and a
 * chip; until this module the slab was always whoever acted last. Chapter VII
 * e2e (commit 06338dbc) caught what that does to a scripted enemy beat: the
 * battle rule that summons Anima fires inside Rikku's action, so the banner
 * read "Rikku · Seymour summons Anima".
 *
 * The rule, in order:
 *
 * 1. **A message that opens with a combatant's name is that combatant's
 *    line.** "Seymour summons Anima" names Seymour, "Guado Guardian B
 *    shatters" names the Guardian, whoever's action set them off. The longest
 *    name wins, so "Seymour Flux uses …" is never read as plain "Seymour".
 * 2. **An enemy-side beat that names nobody names nobody.** A `telegraph`
 *    ("Possessed by Yu Yevon!") raised during a party member's action is not
 *    that party member's line, so the slab is left empty rather than wrong.
 * 3. Otherwise the acting combatant, exactly as before ("Rikku · Stole
 *    Hi-Potion!").
 *
 * The chip drops the speaker's name when the text opens with it, as it always
 * did. Pure and DOM-free. **FFX only** [AGENTS.md rule 14]: the `.ig-banner`
 * is the FFX HUD's; FFX-2's HUD prints no speaker slab. Shared across every FFX
 * chapter (1-3, VII, VIII).
 */

import type { AnyCombatant, CombatantId, MessageKind } from '../../battle/common/types.ts';

export interface BannerLine {
  /** The name slab, or `''` for none. */
  name: string;
  /** The chip beside it. */
  chip: string;
}

/** Does `text` open with `name` as a whole word ("Seymour summons", "Tidus:", "Anima's")? */
function opensWith(text: string, name: string): boolean {
  if (!name || !text.startsWith(name)) return false;
  const next = text.charAt(name.length);
  return next === '' || next === ' ' || next === ':' || next === "'" || next === '’';
}

export function bannerSpeaker(
  text: string,
  kind: MessageKind | undefined,
  actorId: CombatantId | null,
  combatants: Readonly<Record<CombatantId, AnyCombatant | undefined>> | undefined,
): BannerLine {
  const all = Object.values(combatants ?? {}).filter((c): c is AnyCombatant => !!c && !!c.name);
  const actor = actorId ? combatants?.[actorId] : undefined;
  const named = all
    .filter((c) => opensWith(text, c.name))
    .sort((a, b) => b.name.length - a.name.length)[0];
  let name: string;
  if (named) name = named.name;
  else if (kind === 'telegraph' && actor && actor.side !== 'enemy') name = '';
  else name = actor?.name ?? actorId ?? '';
  const chip = name && text.startsWith(`${name} `) ? text.slice(name.length + 1) : text;
  return { name, chip };
}
