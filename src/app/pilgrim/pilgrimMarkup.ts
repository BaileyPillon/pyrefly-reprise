/**
 * **The Pilgrimage's three screens, as markup** (prototype, FFX only; Bailey, 2026-10-18, decision 122): the road, the boon pick and the run-over page. Pure strings, no DOM and no storage, so a test reads what a screen
 * says without mounting it. The frames are the approved mockups' (`pilgrim-mock/o2B-a`, `o2B-b`, `o2B-d`, Option 2 B): the board's own painted plates, Ink & Gold tokens, and the same words.
 *
 * Honest labels: a boon card names its source, says NEW on the one row the game does not have, and what is ours (a count, a wearer) is on the card, not hidden; the run-over page says why a run ended in the chapter's own tip
 * (`data/chapter-meta*.ts`), never in words of the run's own.
 *
 * Game case: FFX only.
 */

import { getChapter } from '../../data/encounters.ts';
import { getChapterMeta } from '../../data/chapter-meta.ts';
import { escapeHtml as esc } from '../../ui/common/html.ts';
import { boonById, type BoonDef, type BoonId } from './boons.ts';
import { plateHtml, portraitUrl } from './pilgrimArt.ts';
import type { PilgrimRecord } from './runStore.ts';
import { ROUTE, ROUTE_LENGTH, stopById, type RouteStop } from './route.ts';
import { currentStop, nextOptions, reached, type RunState, type RunSummary } from './runState.ts';

/** "1:07:05" for an hour and over, "41:15" below. */
export function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const two = (n: number): string => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${two(mm)}:${two(ss)}` : `${mm}:${two(ss)}`;
}

const cap = (id: string): string => id.charAt(0).toUpperCase() + id.slice(1);
const place = (stop: RouteStop): string => ((getChapterMeta(stop.chapter)?.location ?? getChapter(stop.chapter)?.location ?? '').split(' — ')[0] ?? '').split(',')[0] ?? '';
const chip = (k: string, v: string, tail = ''): string => `<span class="pgx-chip">${esc(k)} <b>${esc(v)}</b>${tail ? ` <i>${esc(tail)}</i>` : ''}</span>`;
const tag = (t: string, cls = ''): string => `<span class="pgx-tag ${cls}">${esc(t)}</span>`;

/** The boon's wearer, in words: who it goes to, or that it goes in the pack. */
export function wearerLine(def: BoonDef): string {
  const e = def.effect;
  if (e.kind === 'item') return 'Goes in the pack';
  return `${e.kind === 'overdrive' ? 'Ally' : 'Wearer'}: the first of ${e.prefer.slice(0, 3).map(cap).join(', ')} on the field`;
}

function nodeHtml(stop: RouteStop, opts: { start?: boolean; sel?: boolean }): string {
  const meta = getChapterMeta(stop.chapter);
  const tags = stop.elite ? tag('Elite · Dark Mirror', 'pgx-tag--elite') : opts.start ? tag('Start', 'pgx-tag--new') : stop.pays === 0 ? tag('Finale', 'pgx-tag--gold') : '';
  return `<div class="pgx-node${stop.elite ? ' pgx-node--elite' : ''}${opts.start ? ' pgx-node--now' : ''}" data-stop="${stop.id}">
    <div class="pgx-node__art">${plateHtml(stop.chapter)}</div>
    <span class="pgx-node__no">${esc(meta?.numeral ?? stop.numeral)}</span><span class="pgx-node__tag">${tags}</span>
    <div class="pgx-node__cap"><span class="pgx-node__name">${esc(stop.title)}</span><span class="pgx-node__sub">${esc(place(stop))}</span></div></div>`;
}

/** (a) The road at the start: four stops, two forks, the Elite marked, one button. */
export function routeHtml(record: PilgrimRecord): string {
  const tiers = ROUTE.map(
    (tier, t) => `<div class="pgx-tier" data-tier="${t}"><div class="pgx-tier__label">Stop ${t + 1}${t === ROUTE_LENGTH - 1 ? ' · the finale' : tier.length > 1 ? ' · a fork' : ''}</div>${tier.map((s) => nodeHtml(s, { start: t === 0 })).join('')}</div>`,
  ).join('');
  const best = record.best ? `Best so far: ${record.best.cleared ? 'the whole road' : `${record.best.won} won, reached ${record.best.reached} of ${ROUTE_LENGTH}`} · ${record.runs} run${record.runs === 1 ? '' : 's'}` : 'No run yet';
  return `
    <div class="pgx-page">
      <div class="pgx-top"><div class="pgx-eyebrow"><i></i>Pilgrimage · prototype</div><div class="pgx-hud">${chip('Fight', '1', `/ ${ROUTE_LENGTH}`)}${chip('Boons', '0', 'kept')}</div></div>
      <div class="pgx-h">Four stops · two forks<i></i><small>Prototype · FFX only</small></div>
      <div class="pgx-tree" data-role="tree"><svg class="pgx-links" data-role="links" aria-hidden="true"></svg>${tiers}</div>
      <div class="pgx-foot">
        <div class="pgx-slab"><h3>Every fight is the faithful one</h3>
          <p>Each stop is its chapter exactly as it ships. After each win pick one of three boons for the next fight only: an item or an armour ability from the game. Your choice of road decides what you meet; the Elite road is harder and pays two boons.</p>
          <div class="pgx-fine">${esc(best)}</div></div>
        <button type="button" class="pgx-btn" data-action="pg:begin"><span class="tri"></span><span>Begin the pilgrimage</span></button>
      </div>
    </div>`;
}

/** What the boon screen shows besides the run: which zone has the cursor and which card in it, and a note. */
export interface BoonView {
  readonly zone: 'boons' | 'road';
  readonly boonSel: number;
  readonly roadSel: number;
  readonly notice: string;
}

function boonCard(id: BoonId, i: number, sel: boolean): string {
  const def = boonById(id);
  const when = def.isNew ? tag('New', 'pgx-tag--new') : tag('Next fight', 'pgx-tag--gold');
  return `<div class="pgx-card${sel ? ' pgx-card--sel' : ''}" data-action="pg:pick:${i}" data-boon="${id}" role="button" tabindex="0">
    <div class="pgx-card__kind">${def.kind === 'NEW' ? 'One fight' : def.kind}<span class="pgx-card__when">${when}</span></div>
    <div class="pgx-card__name">${esc(def.name)}</div><div class="pgx-card__fx">${esc(def.fx)}</div>
    <div class="pgx-card__who">${esc(wearerLine(def))}</div><div class="pgx-card__src">${esc(def.tag)}</div></div>`;
}

function forkCard(stop: RouteStop, i: number, sel: boolean, live: boolean): string {
  const tags = `${stop.elite ? tag('Elite · Dark Mirror', 'pgx-tag--elite') : ''}${stop.pays > 1 ? tag(`Pays ${stop.pays} boons`, 'pgx-tag--gold') : ''}${stop.fixedParty ? tag('Its own party', 'pgx-tag--gold') : ''}`;
  return `<div class="pgx-fork${sel ? ' pgx-fork--sel' : ''}${stop.elite ? ' pgx-fork--elite' : ''}${live ? '' : ' pgx-fork--wait'}" data-action="pg:road:${i}" data-stop="${stop.id}" role="button" tabindex="0">
    <div class="pgx-fork__art">${plateHtml(stop.chapter)}</div><div class="pgx-fork__tags">${tags}</div>
    <div class="pgx-fork__cap"><div class="n">${esc(stop.title)}</div><div class="l">${esc(stop.numeral)} · ${esc(place(stop))}</div></div></div>`;
}

const down = (title: string): string => (/( and |Aeons$)/.test(title) ? `${title} are down` : `${title} is down`);

/** (b) After a win: the recap, the road so far, three boons, then the road. */
export function boonHtml(run: RunState, view: BoonView): string {
  const stop = currentStop(run);
  const meta = getChapterMeta(stop.chapter);
  const picking = run.phase === 'boons';
  const options = picking ? ROUTE[run.road.length] ?? [] : nextOptions(run);
  const done = stop.pays - run.owed;
  const so = run.road.map((id) => `<li>${esc(stopById(id).title)}</li>`).join('');
  const next = options[view.roadSel] ?? options[0];
  const head = picking ? `Take one boon${stop.pays > 1 ? ` · ${done + 1} of ${stop.pays}` : ''}` : 'Your boons are chosen';
  const cards = picking ? run.offers.map((id, i) => boonCard(id, i, view.zone === 'boons' && i === view.boonSel)).join('') : run.pack.map((id, i) => boonCard(id, i, false).replace('data-action="pg:pick:' + i + '"', 'data-held="1"')).join('');
  return `
    <div class="pgx-page pgx-page--boons">
      <div class="pgx-top"><div class="pgx-eyebrow"><i></i>Pilgrimage · after fight ${reached(run)} of ${ROUTE_LENGTH}</div><div class="pgx-hud">${chip('Fight', String(run.won), `/ ${ROUTE_LENGTH} done`)}${chip('Boons', String(run.pack.length), 'in the pack')}</div></div>
      <aside class="pgx-side">
        <div class="pgx-recap"><div class="k">Chapter ${esc(meta?.numeral ?? stop.numeral)} · cleared</div><div class="t">${esc(down(stop.title))}</div>
          <div class="row">No gil to count</div><div class="src">One pick, then the road. A boon lasts the next fight only.</div></div>
        <div class="pgx-h pgx-h--flat">Your road so far<i></i></div><ul class="pgx-obj">${so}</ul>
        <div class="pgx-tip"><b>Road</b>Faithful party at every stop. Unused boons are gone when the fight ends.</div>
      </aside>
      <section class="pgx-main">
        <div class="pgx-h">${esc(head)}<i></i><small>for the next fight only</small></div>
        <div class="pgx-cards" data-role="cards">${cards}</div>
        <div class="pgx-h">Then choose the road<i></i><small class="pgx-note" data-role="notice">${esc(view.notice)}</small></div>
        <div class="pgx-forks" data-role="forks">${options.map((s, i) => forkCard(s, i, view.zone === 'road' && i === view.roadSel, !picking)).join('')}</div>
        <button type="button" class="pgx-btn${picking ? ' pgx-btn--wait' : ''}" data-action="pg:go"><span class="tri"></span><span>${picking ? 'Take a boon first' : `On to ${esc(next?.title ?? '')}`}</span></button>
      </section>
    </div>`;
}

/** The mockup's "why it ended" is the chapter's own tip. */
function whyHtml(run: RunState): string {
  if (run.end !== 'lost') return '';
  const tip = getChapterMeta(currentStop(run).chapter)?.tip;
  return tip ? `<div class="pgx-why"><b>Why it ended</b>${esc(tip)}</div>` : '';
}

/** (d) The run is over: the ledger, the road as four marks, why it ended, the boons used, and the two ways on. */
export function overHtml(run: RunState, summary: RunSummary, previousBest: PilgrimRecord['best'], newBest: boolean): string {
  const stop = currentStop(run);
  const won = summary.cleared;
  const left = summary.end === 'left';
  const marks = Array.from({ length: ROUTE_LENGTH }, (_, i) => (i < summary.won ? 'ok' : i === summary.reached - 1 && !won ? (left ? 'off' : 'bad') : 'off'));
  const marksLine = won ? 'Four of four' : `${summary.won} won${left ? ', then left the road' : `, fell at the ${['first', 'second', 'third', 'fourth'][summary.reached - 1] ?? 'last'}`}`;
  const bestLine = newBest ? 'New best' : previousBest ? `best so far: ${previousBest.won}${previousBest.cleared ? ', the whole road' : ''}` : '';
  const used = summary.boons.map((id) => `<div class="m"><span class="c">${esc(boonById(id).name)}</span></div>`).join('') || '<div class="m"><span class="c">No boon was used.</span></div>';
  const title = won ? 'Pilgrims’ End' : left ? 'The road is left' : 'The road ends';
  const sub = won ? `${esc(stopById('braska').title)}, and all four fights, in the order the road ran.` : `${esc(stop.title)}, fight ${summary.reached} of ${ROUTE_LENGTH}.`;
  return `
    <div class="pgx-over">
      <div class="pgx-over__ink"><div class="pgx-over__art">${won ? `<img src="${portraitUrl('tidus')}" alt="">` : plateHtml(stop.chapter)}</div></div><div class="pgx-over__stripe"></div>
      <div class="pgx-over__cap">${esc(place(stop))} · ${won ? 'the pilgrimage is over' : 'the road ends'}</div>
      <div class="pgx-over__page">
        <div class="pgx-over__chip">Run over · ${clock(summary.timeMs)}</div>
        <h1 class="pgx-over__title">${title}</h1><div class="pgx-over__rule"></div><div class="pgx-over__sub">${sub}</div>
        <div class="pgx-over__ledger">
          <div class="line"><span class="k">Reached</span><span class="v">${summary.reached} / ${ROUTE_LENGTH}</span><span class="d">${esc(bestLine)}</span></div>
          <div class="line"><span class="k">Time</span><span class="v">${clock(summary.timeMs)}</span><span class="d">${won ? 'the whole road' : 'a run ends on a loss'}</span></div>
          <div class="line"><span class="k">Boons</span><span class="v">${summary.boonsUsed} used</span><span class="d">each lasted one fight</span></div>
        </div>
        <div class="pgx-over__route">${marks.map((m) => `<span class="${m}"></span>`).join('')}<b>${esc(marksLine)}</b></div>
        ${whyHtml(run)}
        <div class="pgx-over__lbl">Boons used</div><div class="pgx-over__list">${used}</div>
        <div class="pgx-over__btns">
          <button type="button" class="pgx-btn" data-action="pg:again"><span class="tri"></span><span>Again</span></button>
          <button type="button" class="pgx-btn pgx-btn--ghost" data-action="pg:leave"><span class="tri"></span><span>Chapter select</span></button>
        </div>
      </div>
    </div>`;
}

/** The pack of the next fight as the RUN tab of party prep shows it: one row per boon with what it did to the setup. */
export function runPanelHtml(run: RunState, lines: readonly { boon: BoonId; line: string }[]): string {
  const stop = currentStop(run);
  const rows = lines.length
    ? lines.map((l) => { const def = boonById(l.boon); return `<div class="pgx-prow"><span class="pgx-prow__kind${def.isNew ? ' pgx-prow__kind--new' : ''}">${def.kind === 'NEW' ? 'NEW' : def.kind === 'ITEM' ? 'ITEM' : 'ARMOUR'}</span><div><div class="pgx-prow__name">${esc(def.name)}</div><div class="pgx-prow__fx">${esc(l.line)}</div></div></div>`; }).join('')
    : `<div class="pgx-prow"><span class="pgx-prow__kind">NONE</span><div><div class="pgx-prow__name">No boon for this fight</div><div class="pgx-prow__fx">${run.road.length === 1 ? 'The first stop is the chapter as it ships.' : 'The pack is empty.'}</div></div></div>`;
  return `<div class="pgx-run"><div class="pgx-run__main"><div class="pgx-run__k">Pilgrimage · fight ${reached(run)} of ${ROUTE_LENGTH}</div><div class="pgx-run__t">Boons for ${esc(stop.title)}</div>${rows}</div>
    <div class="pgx-run__side"><div class="pgx-run__k">The rest is faithful</div><p>Chapter ${esc(stop.numeral)}’s own party at its own numbers, and its own boss. Nothing is tuned.</p><p>A boon lasts this fight only. Esc leaves the road: the run ends.</p>
    <div class="pgx-run__k pgx-run__k--gold">${run.pack.length} in the pack · ${run.used.length} used</div></div></div>`;
}
