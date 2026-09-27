/**
 * **One claim, said once.** The card prints an effect line (what the move does,
 * from its record or its menu help) above a reason line (why this move, from
 * what the preview proved). When both name the same status the card reads as
 * a stutter: "Inflicts Shell" over "It puts Shell on the party" (critic round
 * 13 PR-0074; CHK-007).
 *
 * The reason is the more specific of the two (it says on whom, and whether it
 * lands), so the effect line gives the status up: a derived "inflicts A, B"
 * list loses the names the reason already says, and a menu-help sentence that
 * names one of them is dropped whole. Everything else on the effect line stays.
 *
 * **Game case: both** [AGENTS.md rule 14]: the effect and reason lines are the
 * same card in both games. Pure and DOM-free.
 */

const SEP = ' · ';

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function names(text: string, word: string): boolean {
  return new RegExp(`(^|[^A-Za-z])${escapeRe(word)}([^A-Za-z]|$)`, 'i').test(text);
}

/** The status names a derived effect line lists after "inflicts". */
function inflictedList(part: string): string[] | null {
  const m = part.match(/^inflicts (.+)$/i);
  return m ? m[1]!.split(',').map((s) => s.trim()).filter(Boolean) : null;
}

/**
 * The effect line with every status the reason already names taken out.
 *
 * @param statuses the status labels the move applies on the previewed board
 *   (`MoveSuggestion.statuses`); the derived "inflicts" list is read too, so a
 *   status that only rolls (a gamble) is covered as well.
 */
export function dropRepeatedStatuses(effect: string, reason: string, statuses: readonly string[]): string {
  if (!effect || !reason) return effect;
  const parts = effect.split(SEP);
  const candidates = new Set<string>(statuses);
  for (const p of parts) for (const n of inflictedList(p) ?? []) candidates.add(n);
  const repeated = [...candidates].filter((n) => n && names(reason, n) && names(effect, n));
  if (repeated.length === 0) return effect;

  const kept: string[] = [];
  for (const part of parts) {
    const list = inflictedList(part);
    if (list) {
      const rest = list.filter((n) => !repeated.some((r) => r.toLowerCase() === n.toLowerCase()));
      if (rest.length > 0) kept.push(`inflicts ${rest.join(', ')}`);
      continue;
    }
    if (repeated.some((r) => names(part, r))) continue;
    kept.push(part);
  }
  if (kept.length === 0) return '';
  const first = kept[0]!;
  return [first.charAt(0).toUpperCase() + first.slice(1), ...kept.slice(1)].join(SEP);
}

/**
 * A status id's words in display case: "max-hp-x2" reads "Max HP x2", not
 * "Max Hp X2". Shared by the effect line and the sentence's facts.
 */
export function statusWords(id: string): string {
  return id
    .split('-')
    .map((w) => {
      const lower = w.toLowerCase();
      if (lower === 'hp' || lower === 'mp') return lower.toUpperCase();
      if (/^x\d+$/.test(lower)) return lower;
      return w ? w.charAt(0).toUpperCase() + w.slice(1) : w;
    })
    .join(' ');
}
