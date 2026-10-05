/** Small text helpers for the decisions ledger: clipping, escaping, dates, short sources, blanket-yes detection. */

/** Bailey's blanket yes: it accepts a list without naming what is in it. Each accepted item needs its own row and a "changed" line. */
export const BLANKET = /recommend|\byes to (all|both|these|everything)\b|\badopt all\b|\btogether please\b|\bapprove everything\b|\bgo with (all|your)\b/i;
export const isBlanketWords = (words) => typeof words === 'string' && BLANKET.test(words);

/** Cuts a text at a word boundary and marks the cut, never in the middle of a word. */
export function clip(text, max) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), Math.floor(max * 0.6)))} …`;
}

/** Names of his other projects stay out of this public ledger, as a bracketed label (the data files keep his words). */
const REDACT = [[/lifestream encore/gi, '[another project of his]']];

/** Markdown-safe text: angle brackets would be read as HTML and swallowed, so they are written as entities. */
export function esc(text) {
  const s = REDACT.reduce((t, [re, to]) => t.replace(re, to), String(text ?? ''));
  return s.replace(/\s+/g, ' ').replace(/ \x40 /g, ' at ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** "Thursday" for 2026-09-24; empty for anything that is not a day. */
export function weekday(day) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00Z`) : null;
  return d ? WEEKDAYS[d.getUTCDay()] : '';
}
export const dayHeading = (day) => day;

/** The ledger's own data files are where a row lives, not where its decision came from. */
const DATA_FILES = ['docs/target/decisions.json', 'docs/target/decisions-early.json', 'docs/target/targets.json'];
const PATHS = /\b(?:docs|research|critic|src|tools|tests|learn)\/[\w./-]*[\w]|\bAGENTS\.md(?: hard rule \d+)?|\bCLAUDE\.md\b|\bNOW\.md\b/g;

/** A short pointer to where a decision is recorded: the first files its note names, else its first words. */
export function shortSource(where) {
  const s = String(where ?? '').replace(/\s+/g, ' ');
  const seen = [];
  for (const m of s.matchAll(PATHS)) if (!seen.includes(m[0]) && !DATA_FILES.includes(m[0])) seen.push(m[0]);
  if (seen.length) return `${seen.slice(0, 2).join('; ')}${seen.length > 2 ? '; and others' : ''}`;
  return clip(s, 150);
}

/** The "~13:20 EDT" a decision's note gives for the day of the decision, or null. */
export function timeOf(e) {
  const m = String(e.where ?? '').match(/(\d{4}-\d{2}-\d{2})\s*(?:at\s*)?~?(\d{1,2}:\d{2})\s*(EDT|EST)/);
  return m && m[1] === e.date ? `~${m[2]} ${m[3]}` : null;
}
