/**
 * Oversoul, as the presentation sees it: which fiend is in its Oversoul form,
 * and which battle event is the moment it Oversouls. Pure: no `three`, no DOM
 * (the layering rule, AGENTS.md rule 1), so the FFX-2 HUD and the field look
 * ({@link ./OversoulLook.ts}) read the same answer.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Oversoul exists only in FFX-2
 * (`docs/concepts/chapters/trema/oversoul/README.md`). No FFX enemy carries an
 * Oversoul script id, and only the FFX-2 HUD and HUD tap call this.
 *
 * **How the form is recognised.** Oversoul Paragon keeps Paragon's id, name
 * and sprite ("Paragon keeps the same name in both forms", FF Wiki *Paragon
 * (Final Fantasy X-2)*, revid 3998078); what differs is its AI script,
 * `paragon-oversoul` (`src/battle/ffx2/ai/paragon-oversoul.ts`, reached only
 * through `TREMA_PARAGON_FORM` in `src/data/chapter-ffx2-trema.ts`). So the
 * combatant's own `aiScriptId` is the switch, read at run time: nothing here
 * imports the chapter data.
 *
 * **The moment.** The Oversoul is the fiend's first action (FF Wiki *Oversoul
 * (Final Fantasy X-2)*, revid 4041089); the engine plays it as a turn that
 * emits one `message` event, "Paragon oversouls!", and nothing else. That line
 * is the moment. The game's own caption for it is **"Oversoul!"**, shown as an
 * action caption over the fiends in the same page's screenshot, *File:Oversoul
 * FFX-2.jpg* (file page revid 2493543), as the options README records.
 */

import type { AnyCombatant, BattleEvent, BattleState, CombatantId } from '../battle/common/types.ts';

/** AI scripts that are an Oversoul form. Paragon's is the only one built. */
export const OVERSOUL_AI_SCRIPT_IDS: readonly string[] = ['paragon-oversoul'];

/** The game's action caption for the transformation (see the header for the source). */
export const OVERSOUL_CAPTION = 'Oversoul!';

/** The engine's line for the Oversoul action: `"<name> oversouls!"`. */
const OVERSOUL_LINE = /^(.+?) oversouls!$/i;

/** The part of a combatant this reads: its side and its enemy record (`Combatant.enemy`). */
type EnemyLike = Pick<AnyCombatant, 'side'> & {
  enemy?: { aiScriptId?: string; formIndex?: number; forms?: ReadonlyArray<{ aiScriptId?: string }> };
};

/** True for an enemy fighting in an Oversoul form (its current form's script, else its own). */
export function isOversoulForm(c: EnemyLike | null | undefined): boolean {
  const e = c?.side === 'enemy' ? c.enemy : undefined;
  if (!e) return false;
  const script = e.forms?.[e.formIndex ?? 0]?.aiScriptId ?? e.aiScriptId;
  return typeof script === 'string' && OVERSOUL_AI_SCRIPT_IDS.includes(script);
}

/** Every Oversoul-form enemy on the field, by id. */
export function oversoulIds(state: BattleState | null | undefined): CombatantId[] {
  if (!state) return [];
  const out: CombatantId[] = [];
  for (const c of Object.values(state.combatants)) {
    if (c && !c.removed && isOversoulForm(c)) out.push(c.id);
  }
  return out;
}

/** The name in the engine's Oversoul line, or `null` when `event` is not that line. */
export function oversoulNameOf(event: BattleEvent): string | null {
  if (event.type !== 'message') return null;
  const m = OVERSOUL_LINE.exec(event.text.trim());
  return m ? m[1]!.trim() : null;
}

/** What the FFX-2 message line shows at the moment: the fiend's name, then the caption. */
export function oversoulCaptionOf(event: BattleEvent): { name: string; chip: string } | null {
  const name = oversoulNameOf(event);
  return name ? { name, chip: OVERSOUL_CAPTION } : null;
}

/**
 * Which Oversoul-form combatants `event` turns blue: the named one at the
 * Oversoul line (every Oversoul form on the field when the name matches none),
 * or the fiend itself on its first `action-start` (it has Oversouled by then:
 * the safety net for a field restaged after the line played).
 */
export function oversoulTriggeredBy(event: BattleEvent, state: BattleState | null | undefined): CombatantId[] {
  const forms = oversoulIds(state);
  if (forms.length === 0) return [];
  if (event.type === 'action-start') return forms.includes(event.actorId) ? [event.actorId] : [];
  const name = oversoulNameOf(event);
  if (name === null) return [];
  const named = forms.filter((id) => state!.combatants[id]?.name.toLowerCase() === name.toLowerCase());
  return named.length > 0 ? named : forms;
}
