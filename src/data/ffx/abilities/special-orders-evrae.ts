/**
 * The two **orders to Cid** — the Evrae chapter's Trigger Commands.
 *
 * These are menu markers in exactly the sense `./special-menu-markers.ts`
 * documents for `talk`: `learnedAbilityIds` is how the command menu enumerates
 * what a character can do, so every listed id has to resolve to a catalog row,
 * but the row is only read for its **label and its rank**. The command actually
 * submitted is `{ kind: 'trigger', id, targets: [] }`, and the effect is
 * scripted in `src/battle/ffx/ai/evrae-rules.ts`.
 *
 * **They live in their own file rather than in `special-menu-markers.ts`** so
 * that this chapter's track owns every file it writes while ten agents share
 * one working tree [AGENTS.md, "Shared working tree"]. `src/data/ffx/index.ts`
 * merges them the same way it merges that file.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. A Trigger Command is an FFX
 * command kind; FFX-2 has no equivalent and these ids appear in no FFX-2 data
 * file (`tests/unit/chapters/evrae-engine.test.ts` asserts it).
 *
 * ---
 *
 * ## Two ids, not one id with a payload
 *
 * `TriggerCommand` is `{ kind: 'trigger', id: string, targets }` and has **no
 * `extra` field**; adding one would be a contract change for no gain. So the
 * direction is carried by the id itself: `'pull-back'` and `'close-in'`,
 * exactly as the owner named them on 2026-09-21.
 *
 * ## The labels are deliberately NOT written here
 *
 * The order widget is **C-11**: `research/visual-bible.md` §3.12 specifies two
 * Trigger Command flavours and both are one-shot Talks. A *persistent two-state
 * toggle* issued to an uncontrollable ally, with a preview of what the order
 * costs Cid this turn and a queued-order marker on his CTB row, is a new
 * interface and needs a mockup and Bailey's approval before anything renders it
 * [AGENTS.md rule 9; research §11 item 17 says so in terms]. The owner's
 * instruction for this track was "expose ids only", so `name` is the id and the
 * widget track sets the real copy — recommended, and still awaiting the
 * approval that would make it real: **"Pull back"** and **"Close in"** (C-9;
 * "Move in" is single-source *and* reads as the player moving).
 *
 * ## The cost is the whole design
 *
 * An order costs **that character's turn**, is executed on **Cid's next turn**
 * in place of a missile volley, and **last order wins** if two are issued
 * before he acts. One course change is therefore one party turn + one Cid turn
 * + one forgone volley — three resources for one boolean flip
 * [research/ffx-evrae-airship.md §4.2].
 *
 * **Rank 3 is `[estimate]`** — C-7. The manoeuvre has **no action row at all**
 * in the decompile (§3.2), so neither rank is in the data. It is the single
 * number the fight's difficulty is most sensitive to, so it is a named constant
 * in `ai/evrae-rules.ts#ORDER_RANK` as well as a value here, and both are on
 * the playtest list.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

function order(id: string, note: string): AbilityDef {
  return {
    id,
    // **The id, on purpose.** See the file header: the player-facing label
    // ships with the approved widget, not from here.
    name: id,
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 3, // [estimate] C-7 — mirrored by `ai/evrae-rules.ts#ORDER_RANK`
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 0,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    canReflect: false,
    minigame: null,
    extra: {
      resolvesAsCommandKind: 'trigger',
      triggerId: id,
      labelPendingApproval: true,
      note,
    },
  };
}

export const ABILITIES: Record<string, AbilityDef> = {
  'pull-back': order(
    'pull-back',
    "Menu marker only — submit a TriggerCommand with id:'pull-back'. Queues the manoeuvre; Cid flies it on his next turn instead of firing a volley. Label pending the approved order widget (C-11).",
  ),
  'close-in': order(
    'close-in',
    "Menu marker only — submit a TriggerCommand with id:'close-in'. Queues the manoeuvre; Cid flies it on his next turn instead of firing a volley. Label pending the approved order widget (C-11).",
  ),
};

export default ABILITIES;
