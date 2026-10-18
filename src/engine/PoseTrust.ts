import type { PoseRegistrationTable } from '../data/art/poseRegistrationTypes.ts';
import { poseStatusTrusted } from '../data/art/poseRegistrationTypes.ts';
import { paintingOf, poseRegistrationOff, POSE_REGISTRATION } from './PoseRegistration.ts';

/**
 * **A painting the install never vouched for is not drawn** (pose continuity, 2026-10-16; `docs/plans/pose-continuity-review.md` part 2; both games).
 *
 * The gate (`tools/pose-gate.mjs`) refuses to install or ship a character painting that has no registration row, but the game itself must also be safe
 * on the day something slips past it: the Dark Aeons shipped with no stance and swapped over the feet line 239 times in one chapter. So the runtime
 * stamps every character painting with a trust, from the **compiled-in registration table** (`POSE_REGISTRATION`; nothing is hashed or measured at run
 * time), and `PaintedActor` treats a painting without trust as a missing one: `resolvePoseName`'s chain falls down to the idle, which is correct by
 * definition, and the flinch, recoil and lunge still carry the beat.
 *
 * **Where the waiver list lives (the lane's documented choice).** There is no second compiled list. A waiver is a row in `docs/target/pose-waivers.json`
 * bound to a painting's sha; the generator (`tools/posescale/measure.py table`) reads that ledger and writes `status: 'waived'` into the generated
 * `poseRegistration*.ts` row, so the table is the one source the runtime reads and nobody types a waiver into a `.ts` file (the contract entry of
 * 2026-10-16). `trusted` below is therefore just the row's status:
 *
 * - `ok`, `held`, `waived`: drawn.
 * - a row **with no status**: written before the install wrote statuses; it draws as it always did (`legacy`). The gate lists it. This is what keeps the
 *   day the runtime lands from changing a single painting that already has a row.
 * - `blocked` (out of band and not waived), and **no row at all** (`absent`): withheld.
 * - exempt: any `ff7-*` subject (the film stills are their own kind) and any `twirl*` key (FFX-2's staged costume change, a cut by design), as in the
 *   gate; and everything while `?posereg=off` (captures and A/B comparisons size paintings without the table, so there is nothing to judge them by).
 * - the **idle** is the reference every other pose is sized and placed against: it is always drawn (`reference`), even when its subject has no
 *   registration at all (`unregistered`: listed by {@link poseTrustReport}, drawn from its sidecar as before). Without it the chain would end on nothing.
 *
 * Pure bookkeeping: no `three`, no DOM, no clock. The only side effect is the once-per-painting `console.warn` and the report below.
 */

/** Why a painting is drawn or withheld. */
export type PoseTrustWhy = 'ok' | 'held' | 'waived' | 'legacy' | 'blocked' | 'absent' | 'reference' | 'unregistered' | 'exempt';

/** What `PaintedArt` stamps on a character painting's `PoseMeta.trust`. */
export interface PoseTrustStamp {
  readonly trusted: boolean;
  readonly why: PoseTrustWhy;
}

const DRAWN = (why: PoseTrustWhy): PoseTrustStamp => ({ trusted: true, why });
const WITHHELD = (why: PoseTrustWhy): PoseTrustStamp => ({ trusted: false, why });

/** The subjects and keys that are never judged: FF7's film stills, and FFX-2's `twirl-*` costume-change paintings (class `staged`, exempt as today). */
export function poseTrustExempt(subject: string, pose: string): boolean {
  return subject.startsWith('ff7-') || pose.startsWith('twirl');
}

/**
 * Where a withheld pose goes when the actor's own fallbacks (`BattlePresenterActors.POSE_FALLBACKS`) have no entry for it: the presenter's own chain for a painting
 * that was never made (`BattlePresenterArt`), so a withheld `follow` shows the attack, the ready or the idle exactly as a figure with no `follow` painting does.
 * Anything not listed (sleep, critical, telegraph, an Overdrive's `od-*`, a scene's `stage-2`) goes to the idle.
 */
export const WITHHELD_FALLBACKS: Readonly<Record<string, readonly string[]>> = { follow: ['attack', 'ready', 'idle'] };

/** The trust of one painting, from the registration `table` (default: the compiled-in one). Pure. */
export function poseTrustOf(subject: string, pose: string, table: PoseRegistrationTable = POSE_REGISTRATION): PoseTrustStamp {
  if (poseTrustExempt(subject, pose)) return DRAWN('exempt');
  const row = table[subject]?.[pose];
  if (pose === 'idle') return DRAWN(row || table[subject] ? 'reference' : 'unregistered');
  if (!row) return WITHHELD('absent');
  if (row.status === undefined) return DRAWN('legacy');
  return poseStatusTrusted(row.status) ? DRAWN(row.status as 'ok' | 'held' | 'waived') : WITHHELD('blocked');
}

/**
 * The stamp for the painting loaded from `imageUrl` (a shipped `.webp` is its master's `.png`), or null when the URL is not a character painting
 * (a backdrop, a portrait: nothing to judge). Notes it in the report and warns once if it is withheld or unregistered.
 */
export function stampPainting(imageUrl: string, table: PoseRegistrationTable = POSE_REGISTRATION): PoseTrustStamp | null {
  const which = paintingOf(imageUrl);
  if (!which) return null;
  const stamp = table === POSE_REGISTRATION && poseRegistrationOff() ? DRAWN('exempt') : poseTrustOf(which.subject, which.pose, table);
  notePoseTrust(which.subject, which.pose, stamp);
  return stamp;
}

// ------------------------------------------------------------------ the report

/** One painting in {@link poseTrustReport}. */
export interface PoseTrustEntry {
  subject: string;
  pose: string;
  why: PoseTrustWhy;
  /** False for a withheld painting. */
  trusted: boolean;
}

const seen = new Map<string, PoseTrustEntry>();

/** Record a painting's stamp (once per subject and pose) and warn once when it is withheld or its subject has no registration at all. */
export function notePoseTrust(subject: string, pose: string, stamp: PoseTrustStamp): void {
  const key = `${subject}/${pose}`;
  if (seen.has(key)) return;
  seen.set(key, { subject, pose, why: stamp.why, trusted: stamp.trusted });
  if (!stamp.trusted) {
    const reason = stamp.why === 'blocked' ? 'registered but blocked (out of its band, no waiver)' : 'no registration';
    console.warn(`[pose-trust] ${key}: ${reason}; treated as a missing painting, so the figure shows the next pose down its chain (the idle at the end) instead.`);
  } else if (stamp.why === 'unregistered') {
    console.warn(`[pose-trust] ${key}: this subject has no registration at all; the idle is drawn from its sidecar and every other pose of it is withheld.`);
  }
}

/** What `window.__pyrefly.poseTrust()` returns. */
export interface PoseTrustReport {
  /** The paintings stamped so far (a character painting a battle has loaded). */
  seen: number;
  /** Each `why`, counted over everything seen. */
  counts: Partial<Record<PoseTrustWhy, number>>;
  /** The paintings treated as missing, sorted by subject and pose. */
  withheld: PoseTrustEntry[];
  /** The subjects whose idle was stamped `unregistered`: drawn, but nothing else of theirs is. */
  unregistered: string[];
  /** Every entry (only with `all`). */
  all?: PoseTrustEntry[];
}

const byName = (a: PoseTrustEntry, b: PoseTrustEntry): number => (a.subject === b.subject ? a.pose.localeCompare(b.pose) : a.subject.localeCompare(b.subject));

/** The paintings the runtime has stamped, and the ones it withheld. `all` adds the full list. */
export function poseTrustReport(all = false): PoseTrustReport {
  const entries = [...seen.values()].sort(byName);
  const counts: Partial<Record<PoseTrustWhy, number>> = {};
  for (const e of entries) counts[e.why] = (counts[e.why] ?? 0) + 1;
  return {
    seen: entries.length,
    counts,
    withheld: entries.filter((e) => !e.trusted),
    unregistered: entries.filter((e) => e.why === 'unregistered').map((e) => e.subject),
    ...(all ? { all: entries } : {}),
  };
}

/** Tests: forget what has been stamped and warned about. */
export function resetPoseTrustReport(): void {
  seen.clear();
}
