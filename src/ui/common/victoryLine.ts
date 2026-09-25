/**
 * Who speaks on the victory panel, and what they say (PR-0021, Bailey's pick A
 * on docs/plans/decisions-2026-09-25.md item 7). Both games: the results
 * screen is shared plumbing; the lines are each chapter's own bank.
 *
 * The speaker rotates among the party the panel lists; each speaker says the
 * **first** line of their bank, which is their line from `research/writing-bible.md`
 * §5.4 (or the chapter's first line where the bible gives none). The later
 * pooled lines are deliberately not served: Bailey approved exactly the first
 * lines. A chapter with an empty bank (IV, IX, XIII, and III per PR-0187) says
 * nothing.
 */

/** One served victory line and the party member who says it. */
export interface VictoryLine {
  speakerId: string;
  line: string;
}

/**
 * The line for this win. `fieldIds` is the party in the panel's own order
 * (`buildMemberRows`); members without a line are skipped, so a reserve with
 * no bank never blanks the quip. `turn` picks the speaker, wrapping.
 */
export function victoryLine(
  banks: Readonly<Record<string, readonly string[]>> | undefined,
  fieldIds: readonly string[],
  turn: number,
): VictoryLine | undefined {
  if (!banks) return undefined;
  const speakers = fieldIds.filter(
    (id, i) => fieldIds.indexOf(id) === i && (banks[id]?.length ?? 0) > 0,
  );
  const n = speakers.length;
  if (n === 0) return undefined;
  const t = Number.isFinite(turn) ? Math.trunc(turn) : 0;
  const speakerId = speakers[((t % n) + n) % n];
  const line = speakerId === undefined ? undefined : banks[speakerId]?.[0];
  return speakerId === undefined || line === undefined ? undefined : { speakerId, line };
}

/**
 * The rotation's turn: every attempt the save has recorded, across all
 * chapters, minus one (the attempt now being shown). `GameFlow` records the
 * attempt before the battle, so a retry and the next chapter each move the
 * speaker on, and a fresh save opens on the first member. Read-only: the save
 * schema is untouched.
 */
export function victoryTurn(
  chapters: Readonly<Record<string, { readonly attempts?: number }>>,
): number {
  let total = 0;
  for (const rec of Object.values(chapters)) {
    const a = rec.attempts ?? 0;
    if (Number.isFinite(a) && a > 0) total += Math.trunc(a);
  }
  return Math.max(0, total - 1);
}

/**
 * Who stands in the results wedge (VL-1, closed by option 2; Bailey, 2026-09-25:
 * "I'll go with your recommendations for everything"). On a win that serves a
 * line, the member who speaks it, so the line never sits under someone else's
 * portrait. A silent win (no line) keeps the leader; a loss always keeps the
 * leader's fallen pose. Both games: the results screen is shared plumbing.
 */
export function wedgeFigureId(
  victory: boolean,
  quip: VictoryLine | undefined,
  leader: string | undefined,
): string | undefined {
  return victory && quip ? quip.speakerId : leader;
}
