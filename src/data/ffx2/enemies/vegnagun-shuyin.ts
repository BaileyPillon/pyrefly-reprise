/**
 * Chapter 5 enemy groups — the four-part Vegnagun chain, then Shuyin.
 *
 * Source: `research/ffx2-vegnagun-shuyin.md`. This file is a thin
 * re-export barrel — `docs/encounters.ts` imports `vegnagunTailGroup` from
 * this exact path, so the export names and this file's existence are load
 * bearing. The actual battle data lives one file per battle (kept under the
 * 400-line budget each): `vegnagun-tail.ts`, `vegnagun-leg.ts`,
 * `vegnagun-body.ts`, `vegnagun-head.ts`, `shuyin.ts`, plus the shared
 * ability tables in `vegnagun-abilities.ts` / `shuyin-abilities.ts` and the
 * shared immunity bytes in `vegnagun-shared.ts`.
 *
 * Battle order [§2]: Tail -> Leg + Nodes -> Body/Core + Bulwarks ->
 * Head + Redoubts -> Shuyin, linked by {@link EnemyGroupDef.nextGroupId} with
 * no menu between. Vegnagun battles open with a **black-hole suck-in**, not
 * the normal shattering-glass wipe — that is `BattleStartStep.transition`.
 *
 * > **Implementation rule [§3]: the stat blocks in the per-battle files are
 * > SinirothX's values and are correct as written. Do NOT "fix" them against
 * > the Final Fantasy Wiki**, whose Mag/Def columns are transposed on the
 * > Leg, Body/Core, Bulwarks and Head. The regression test to protect is
 * > Memento Mori: ~1,000-1,130 party-wide is correct; ~1,440-1,630 means the
 * > wiki's Mag 98 is wired in.
 */

export { vegnagunTailGroup } from './vegnagun-tail.ts';
export { vegnagunLegGroup } from './vegnagun-leg.ts';
export { vegnagunBodyGroup } from './vegnagun-body.ts';
export { vegnagunHeadGroup } from './vegnagun-head.ts';
export { shuyinGroup } from './shuyin.ts';

export { VEGNAGUN_CHAIN_ORDER } from '../ids.ts';

import { vegnagunTailGroup } from './vegnagun-tail.ts';
export default vegnagunTailGroup;
