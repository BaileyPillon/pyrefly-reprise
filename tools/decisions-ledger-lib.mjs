/**
 * Central decisions ledger: loads Bailey's decisions from the data files, validates them and renders
 * DECISIONS.md. The data stays where it is; this file only reads it.
 *
 *   docs/target/decisions.json        non-picture decisions, D-nnn, since 2026-09-21 (single source of truth)
 *   docs/target/decisions-early.json  decisions made before the registry existed and ones it never got, E-nnn
 *   docs/target/targets.json          picture decisions (approved, rejected and picked tiles)
 *
 * Optional fields on a decision row, besides the registry's own (id, date, title, words, state, game, delivery, where):
 *   area     one of AREAS (required on every row)
 *   changed  what changed because of the decision, in the game or in the process (required when Bailey's words were a
 *            blanket yes such as "all your recommendations": a row that only says that is never enough)
 *   rule     one line stating the standing rule the decision set, so it is listed under "Standing rules in force"
 *   parts    [{ref, title, changed, ...}] splits one bundled acceptance into its own decisions (id D-145/B1)
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pictureEntries, waitingTiles } from './decisions-ledger-pictures.mjs';
import { renderLedger } from './decisions-ledger-render.mjs';
import { BLANKET, isBlanketWords } from './decisions-ledger-text.mjs';

export const STATES = ['proposed', 'adopted', 'deferred', 'rejected', 'superseded', 'verified'];
export const DELIVERIES = [null, 'not-scheduled', 'in-progress', 'implemented', 'verified'];
export const GAMES = ['ffx', 'ffx2', 'both', 'ff7'];
export const AREAS = ['combat', 'art', 'visuals', 'camera', 'audio', 'ui', 'story', 'chapters', 'guide', 'release', 'hosting', 'process', 'critic', 'data', 'tech', 'site'];
export const PROJECT_START = '2026-09-15';

export { BLANKET, isBlanketWords as isBlanket };
const isBlanket = isBlanketWords;

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

/** Reads the three data files from a repo root. A missing early file is an empty one. */
export function loadModel(root) {
  const at = (rel) => resolve(root, rel);
  const early = existsSync(at('docs/target/decisions-early.json')) ? readJson(at('docs/target/decisions-early.json')) : { decisions: [] };
  return { registry: readJson(at('docs/target/decisions.json')), early, targets: readJson(at('docs/target/targets.json')) };
}

/** Every decision as one flat list: registry rows, early rows, their parts, then the picture decisions. */
export function buildEntries(model) {
  const out = [];
  const add = (rows, kind) => {
    for (const d of rows ?? []) {
      out.push({ ...d, kind, changedLabel: 'What changed' });
      for (const p of d.parts ?? []) {
        out.push({
          id: `${d.id}/${p.ref}`, kind: 'part', parent: d.id, date: d.date, title: p.title, words: p.words ?? d.words, state: p.state ?? d.state,
          supersededBy: p.supersededBy ?? d.supersededBy, game: p.game ?? d.game, delivery: p.delivery === undefined ? d.delivery : p.delivery,
          area: p.area ?? d.area, changed: p.changed ?? null, where: p.where ?? d.where, changedLabel: 'What changed',
        });
      }
    }
  };
  add(model.early.decisions, 'early');
  add(model.registry.decisions, 'registry');
  for (const p of pictureEntries(model.targets)) out.push(p);
  return out;
}

const EMAIL = /[A-Za-z0-9._%+-]+\x40[A-Za-z0-9-]+\.(com|net|org|io|dev|co|app|me|edu|gov)\b/i; // \x40 is the at sign, spelled so this file holds none
const CARD = /\b(ends|ending) in\s*\d{4}\b|\bcard (number|no\.?)\b[^.]{0,20}\d{4}/i;
const HEX_ID = /\b[0-9a-f]{32}\b/i;

/** Problems in the data, as readable lines. An empty list means the ledger can be rendered. */
export function validateModel(model) {
  const errors = [];
  const rows = [...(model.early.decisions ?? []).map((d) => ({ d, file: 'early' })), ...(model.registry.decisions ?? []).map((d) => ({ d, file: 'registry' }))];
  const ids = new Set(rows.map(({ d }) => d.id));
  if (ids.size !== rows.length) errors.push('duplicate decision ids across decisions.json and decisions-early.json');
  const day = /^\d{4}-\d{2}-\d{2}$/;
  for (const { d, file } of rows) {
    const at = d?.id ?? '(no id)';
    const idShape = file === 'early' ? /^E-\d{3}$/ : /^D-\d{3}$/;
    if (!idShape.test(String(d.id))) errors.push(`${at}: id must look like ${file === 'early' ? 'E-001' : 'D-001'}`);
    if (!day.test(String(d.date)) || String(d.date) < PROJECT_START) errors.push(`${at}: date must be YYYY-MM-DD on or after ${PROJECT_START}`);
    if (typeof d.title !== 'string' || d.title.length < 8) errors.push(`${at}: title must state the decision`);
    if (!(d.words === null || typeof d.words === 'string')) errors.push(`${at}: words is Bailey's verbatim quote or null`);
    if (!STATES.includes(d.state)) errors.push(`${at}: unknown state ${d.state}`);
    if (!GAMES.includes(d.game)) errors.push(`${at}: unknown game case ${d.game}`);
    if (!DELIVERIES.includes(d.delivery)) errors.push(`${at}: unknown delivery ${d.delivery}`);
    if (d.state === 'proposed' && d.delivery !== null) errors.push(`${at}: nothing is built before a yes (proposed needs delivery null)`);
    if (d.state === 'superseded' && !ids.has(d.supersededBy)) errors.push(`${at}: superseded decisions name an existing successor`);
    if (!AREAS.includes(d.area)) errors.push(`${at}: area must be one of ${AREAS.join(', ')}`);
    if (typeof d.where !== 'string' || d.where.length < 8) errors.push(`${at}: where must name the source`);
    const parts = d.parts ?? [];
    if (!Array.isArray(parts)) errors.push(`${at}: parts must be a list`);
    const refs = new Set();
    for (const p of Array.isArray(parts) ? parts : []) {
      if (!p.ref || refs.has(p.ref)) errors.push(`${at}: every part needs its own ref`);
      refs.add(p.ref);
      if (typeof p.title !== 'string' || p.title.length < 8) errors.push(`${at}/${p.ref}: part title must state the decision`);
      if (typeof p.changed !== 'string' || p.changed.length < 20) errors.push(`${at}/${p.ref}: part needs a "changed" line`);
      if (p.state !== undefined && !STATES.includes(p.state)) errors.push(`${at}/${p.ref}: unknown state ${p.state}`);
      if (p.delivery !== undefined && !DELIVERIES.includes(p.delivery)) errors.push(`${at}/${p.ref}: unknown delivery ${p.delivery}`);
    }
    const hasChanged = typeof d.changed === 'string' && d.changed.length >= 20;
    if (isBlanket(d.words) && !hasChanged && !(parts.length > 0)) errors.push(`${at}: Bailey's words were a blanket yes, so the row must say what changed (a "changed" line), not only "${String(d.words).slice(0, 40)}"`);
    if (d.rule !== undefined && (typeof d.rule !== 'string' || d.rule.length < 20)) errors.push(`${at}: rule is one line stating the standing rule`);
    for (const f of ['title', 'words', 'changed', 'where', 'rule']) {
      const v = typeof d[f] === 'string' ? d[f] : '';
      if (EMAIL.test(v) || CARD.test(v) || HEX_ID.test(v)) errors.push(`${at}: ${f} holds an address, card digits or an account id (the repo is public)`);
    }
  }
  return errors;
}

/** The whole ledger as markdown text: validated first, so a bad data file never renders. */
export function render(model) {
  const problems = validateModel(model);
  if (problems.length) throw new Error(`decisions data is invalid:\n- ${problems.slice(0, 40).join('\n- ')}${problems.length > 40 ? `\n- ... and ${problems.length - 40} more` : ''}`);
  return renderLedger({ entries: buildEntries(model), early: model.early, registry: model.registry, waiting: waitingTiles(model.targets) });
}
