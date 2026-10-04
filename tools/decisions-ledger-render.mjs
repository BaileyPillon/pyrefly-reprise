/**
 * Markdown for DECISIONS.md. Pure: takes the flattened entries and returns text, so the same data always
 * renders the same file (no clock, no randomness) and `--check` can compare it byte for byte.
 */
import { clip, esc, isBlanketWords, shortSource, timeOf, weekday } from './decisions-ledger-text.mjs';

const GAME_LABEL = { ffx: 'FFX', ffx2: 'FFX-2', both: 'both games', ff7: 'FF7 (hidden experiment)' };
const STATE_ORDER = ['adopted', 'verified', 'proposed', 'deferred', 'rejected', 'superseded'];
const DELIVERY_LABEL = { 'not-scheduled': 'not scheduled', 'in-progress': 'in progress', implemented: 'implemented', verified: 'verified' };
const AREA_ORDER = ['combat', 'art', 'visuals', 'camera', 'audio', 'ui', 'story', 'chapters', 'guide', 'release', 'hosting', 'process', 'critic', 'data', 'tech', 'site'];

const anchor = (id) => String(id).toLowerCase().replace(/[^a-z0-9]+/g, '-');
const link = (id) => (/^[DE]-\d{3}(\/[\w-]+)?$/.test(String(id)) ? `[${id}](#${anchor(id)})` : esc(clip(id, 90)));

function count(entries, key) {
  const m = new Map();
  for (const e of entries) m.set(key(e), (m.get(key(e)) ?? 0) + 1);
  return m;
}

function table(title, rows, total) {
  const lines = [`| ${title} | Decisions |`, '| --- | ---: |', ...rows.filter(([, n]) => n > 0).map(([k, n]) => `| ${k} | ${n} |`), `| **All** | **${total}** |`, ''];
  return lines.join('\n');
}

function stateText(e) {
  if (e.state === 'superseded') return `superseded by ${e.supersededBy ? link(e.supersededBy) : e.supersededByLabel ? `"${esc(e.supersededByLabel)}"` : 'a later decision'}`;
  return e.state;
}

function linksText(e) {
  const bits = [];
  if (e.seeAlso?.length) bits.push(`see ${e.seeAlso.map(link).join(', ')}`);
  for (const [k, label] of [['refines', 'refines'], ['supersedes', 'replaces'], ['partlySupersededBy', 'partly replaced by'], ['answers', 'answers'], ['builtAfter', 'built after']]) {
    if (e[k]) bits.push(`${label} ${link(e[k])}`);
  }
  return bits.join(' · ');
}

function rowMd(e) {
  const head = e.id ? `<a id="${anchor(e.id)}"></a>**${e.id}**` : `**Picture** (${e.group})`;
  const lines = [`- ${head} — ${esc(e.title)}`];
  if (e.words) lines.push(`  - Bailey: “${esc(clip(e.words, 420))}”${e.wordsOfGroup ? ' (his words for the whole group of pictures)' : isBlanketWords(e.words) ? ' (blanket yes)' : ''}`);
  else lines.push('  - Bailey: no verbatim quote on record for this decision');
  if (e.changed) lines.push(`  - ${e.changedLabel}: ${esc(e.changed)}`);
  const t = timeOf(e);
  const meta = [`area ${e.area}`, e.game ? GAME_LABEL[e.game] : 'game case not recorded', stateText(e), e.delivery ? `delivery ${DELIVERY_LABEL[e.delivery]}` : 'nothing to build', t ? `at ${t}` : null, linksText(e) || null].filter(Boolean);
  lines.push(`  - ${meta.join(' · ')}`);
  lines.push(`  - Source: ${esc(shortSource(e.where))}`);
  return lines.join('\n');
}

function partMd(p) {
  const head = `<a id="${anchor(p.id)}"></a>**${p.id}**`;
  const lines = [`  - ${head} — ${esc(p.title)}`];
  if (p.changed) lines.push(`    - What changed: ${esc(p.changed)}`);
  const extra = [p.state !== p.parentState ? stateText(p) : null, p.delivery !== p.parentDelivery ? (p.delivery ? `delivery ${DELIVERY_LABEL[p.delivery]}` : 'nothing to build') : null, p.game !== p.parentGame && p.game ? GAME_LABEL[p.game] : null].filter(Boolean);
  if (extra.length) lines.push(`    - ${extra.join(' · ')}`);
  return lines.join('\n');
}

const orderKey = (e) => [e.kind === 'early' ? 0 : e.kind === 'registry' || e.kind === 'part' ? 1 : 2, Number(String(e.parent ?? e.id ?? '').replace(/\D/g, '') || e.seq || 0)];

export function renderLedger({ entries, early, registry, waiting }) {
  const decisions = entries.filter((e) => e.kind !== 'picture');
  const pictures = entries.filter((e) => e.kind === 'picture');
  const parentOf = new Map(entries.filter((e) => e.id && e.kind !== 'part').map((e) => [e.id, e]));
  const blanket = entries.filter((e) => isBlanketWords(e.words) && e.kind !== 'picture');
  const out = [];

  out.push('# Echoes of Spira: ledger of Bailey\'s decisions', '');
  out.push('Every decision Bailey has made on this game since it began on 2026-09-15, oldest first, grouped by day (US Eastern). This file is rendered from data and never edited by hand:', '');
  out.push('- `docs/target/decisions.json`: the registry of his non-picture decisions (D-nnn), kept since 2026-09-21 and the single source of truth. D-022 to D-028 were written on 2026-09-21 and lost before they were committed; they were restored from the session notes on 2026-10-04.');
  out.push('- `docs/target/decisions-early.json`: decisions made before that registry existed, and later ones it never received (E-nnn).');
  out.push('- `docs/target/targets.json`: picture decisions (the approved, rejected and picked tiles of the end-state board).', '');
  out.push('**How to read a row:** its id, the decision stated in full, his words (verbatim, typos kept), what changed because of it, then area, game case (FFX, FFX-2 or both), state (a superseded row links to its successor), delivery and source. One recommendation of a bundled acceptance is shown under its parent, as D-145/B1. A picture decision is marked "Picture" and carries the date of the last answer recorded on its tile (its group\'s approval date when the tile names none).', '');
  out.push('**To add a decision:** add one row to `docs/target/decisions.json` (next free D-number: id, date, title, his words verbatim or null, state, game case, delivery, `area`, `changed`, `where`; `rule` when it sets a standing rule; `parts` to split a bundled acceptance), then run `node tools/decisions-ledger.mjs`. `node tools/decisions-ledger.mjs --check` and `tests/unit/decisions-ledger.test.ts` fail when this file is stale.', '');
  out.push('**Sibling records:** `CHANGELOG.md` says what each live build gave the player; `ACTIONS.md` says what was built and carried out, and links each of its rows to the decisions here by id.', '');
  out.push('**A blanket yes is never a row of its own** (Bailey, 2026-10-04: when he says "I\'ll go with all your recommendations" the record must say what was decided and what changed). Every recommendation he accepted is its own decision here, with his blanket words as the quote, the decision stated in full, and a "What changed" line. Where a source could not be recovered the row says so.', '');

  out.push('## Summary', '');
  const total = entries.length;
  out.push(`${total} decisions in all: ${decisions.filter((e) => e.kind === 'registry').length} registry rows, ${decisions.filter((e) => e.kind === 'part').length} items split out of bundled acceptances, ${decisions.filter((e) => e.kind === 'early').length} early or backfilled rows, ${pictures.length} picture decisions. ${blanket.length} of the written decisions record a blanket yes.`, '');
  const st = count(entries, (e) => e.state);
  out.push(table('State', STATE_ORDER.map((s) => [s, st.get(s) ?? 0]), total));
  const ar = count(entries, (e) => e.area);
  out.push(table('Area', AREA_ORDER.map((a) => [a, ar.get(a) ?? 0]), total));
  const gm = count(entries, (e) => e.game ?? 'none');
  out.push(table('Game case', [['both games', gm.get('both') ?? 0], ['FFX only', gm.get('ffx') ?? 0], ['FFX-2 only', gm.get('ffx2') ?? 0], ['FF7 hidden experiment', gm.get('ff7') ?? 0], ['not recorded', gm.get('none') ?? 0]], total));

  const rules = decisions.filter((e) => e.rule && (e.state === 'adopted' || e.state === 'verified')).sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.id).localeCompare(String(b.id)));
  out.push('## Standing rules in force', '', 'Each rule links to the decision that set it. A rule drops off this list when its decision is superseded.', '');
  for (const r of rules) {
    const [name, ...rest] = String(r.rule).split(/:\s+/);
    const named = rest.length && name.length <= 70;
    out.push(`- **${esc(named ? name : r.title)}**: ${esc(named ? rest.join(': ') : r.rule)} Decision ${link(r.id)} (${r.date}, ${GAME_LABEL[r.game]}).`);
  }
  out.push('');

  const open = decisions.filter((e) => e.state === 'proposed' && e.kind !== 'part');
  out.push("## Waiting on Bailey's yes", '', open.length ? 'Proposed, asked or drafted, with no yes on record. Nothing here is built.' : 'Nothing is waiting.', '');
  for (const e of open) out.push(`- ${link(e.id)} — ${esc(clip(e.title, 200))}`);
  const waits = [...(waiting ?? [])];
  if (waits.length) out.push('', `Pictures with no target yet (nothing to look at, so no decision): ${esc(waits.join('; '))}.`);
  out.push('');

  const byDay = new Map();
  for (const e of [...decisions.filter((x) => x.kind !== 'part'), ...pictures]) {
    const day = e.date ?? 'undated';
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(e);
  }
  const days = [...byDay.keys()].sort((a, b) => (a === 'undated') - (b === 'undated') || a.localeCompare(b));
  out.push('## Days', '', days.map((d) => `[${d}](#${d === 'undated' ? 'undated' : d})`).join(' · '), '');
  out.push('## Ledger', '');
  const partsOf = new Map();
  for (const p of decisions.filter((e) => e.kind === 'part')) partsOf.set(p.parent, [...(partsOf.get(p.parent) ?? []), p]);
  for (const day of days) {
    const rows = byDay.get(day).sort((a, b) => orderKey(a)[0] - orderKey(b)[0] || orderKey(a)[1] - orderKey(b)[1]);
    const nParts = rows.reduce((n, r) => n + (partsOf.get(r.id)?.length ?? 0), 0);
    out.push(`### ${day}`, '', [weekday(day), `${rows.length + nParts} decision${rows.length + nParts === 1 ? '' : 's'}`].filter(Boolean).join(' · '), '');
    for (const r of rows) {
      out.push(rowMd(r));
      const parent = parentOf.get(r.id);
      for (const p of partsOf.get(r.id) ?? []) out.push(partMd({ ...p, parentState: parent?.state, parentDelivery: parent?.delivery, parentGame: parent?.game }));
    }
    out.push('');
  }
  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}
