/**
 * The BEHIND THE SCENES page as markup: a painted backdrop, the header with its section tabs, the two-minute summary (five
 * cards) and the six chapters. Pure `data -> string` over `content.ts` and `facts.ts`; `page.ts` makes it move.
 *
 * Every number is a 1440x810 grid unit times `--fe-k` in the stylesheet, as on the title, and no text is under the game's
 * 14 px floor. Game case: both.
 */

import { escapeHtml } from '../../ui/common/html.ts';
import { BTS_TITLE } from '../changelog/behindTheScenes.ts';
import { FAN_NOTICE } from '../credits/creditsData.ts';
import { CARDS, CHAPTERS, COUNTS_NOTE, IMAGES, INTRO, type Card, type Chapter, type Figure, type Img, type Tile } from './content.ts';
import { COMMUNITY_SOURCES, CRITIC, CRITIC_ROWS, MADE_WITH } from './facts.ts';
import { btsImageUrl } from './images.ts';

/** Escape, then turn `**bold**` and `==highlight==` into their marks. */
export function inline(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/==(.+?)==/g, '<span class="bts__hl">$1</span>');
}

const img = (i: Img, cls = ''): string => `<img${cls ? ` class="${cls}"` : ''} src="${escapeHtml(btsImageUrl(i.file))}" alt="${escapeHtml(i.alt)}" loading="lazy" decoding="async" draggable="false">`;

const caption = (c: string, note?: string): string =>
  c ? `<figcaption>${escapeHtml(c)}${note ? `<em>${escapeHtml(note)}</em>` : ''}</figcaption>` : '';

const tilesHtml = (tiles: readonly Tile[], cls: string): string =>
  `<div class="${cls}">${tiles
    .map((t) => `<div class="bts__tile"><div class="bts__tn">${escapeHtml(t.n)}</div><div class="bts__tl">${escapeHtml(t.l)}</div><div class="bts__ts">${escapeHtml(t.s)}</div></div>`)
    .join('')}</div>`;

/** The critic's chart: every category's first score and latest, on a 4 to 10 scale with the 9.0 floor and the 9.6 gate marked. */
function chartHtml(): string {
  const rows = CRITIC_ROWS.map((r) => {
    if (r.first === null || r.latest === null) {
      return `<div class="bts__row bts__row--na"><span class="bts__nm">${escapeHtml(r.label)}</span><div class="bts__tr"><span class="bts__why">${escapeHtml(r.why ?? '')}</span></div><span class="bts__vb">&mdash;</span></div>`;
    }
    const ok = r.latest >= CRITIC.floor ? ' bts__pb--ok' : '';
    return (
      `<div class="bts__row" style="--a:${r.first};--b:${r.latest}"><span class="bts__nm">${escapeHtml(r.label)}</span>` +
      `<div class="bts__tr"><i class="bts__line"></i><i class="bts__pa"></i><i class="bts__pb${ok}"></i><span class="bts__va">${r.first.toFixed(1)}</span></div>` +
      `<span class="bts__vb">${r.latest.toFixed(1)}</span></div>`
    );
  }).join('');
  const summary = CRITIC_ROWS.filter((r) => r.first !== null && r.latest !== null)
    .map((r) => `${r.label} ${r.first?.toFixed(1)} to ${r.latest?.toFixed(1)}`)
    .join(', ');
  return (
    `<div class="bts__chart" role="img" aria-label="${escapeHtml(`For each category, the critic’s first score and its latest score out of ten: ${summary}. Audio has no score.`)}">` +
    `<div class="bts__charthead"><div class="bts__chartt">First score to latest</div>` +
    `<div class="bts__legend"><span class="bts__lg-a"><i></i>First scored</span><span class="bts__lg-b"><i></i>${escapeHtml(CRITIC.latestDate)}, round ${CRITIC.latestRound}</span></div></div>` +
    `<div class="bts__rows"><div class="bts__axis"><div class="bts__ln bts__ln--floor"><span>${CRITIC.floor.toFixed(1)} floor</span></div>` +
    `<div class="bts__ln bts__ln--gate"><span>${CRITIC.gate.toFixed(1)} gate</span></div></div>${rows}</div>` +
    `<p class="bts__chartfoot">Scale ${CRITIC.scaleMin} to ${CRITIC.scaleMax}. “First scored” is the first review under the current rules (round ${CRITIC.firstRound}, 20 September; feel and narrative from round 6). Latest is round ${CRITIC.latestRound}.</p></div>`
  );
}

function sourcesHtml(): string {
  const items = COMMUNITY_SOURCES.map((s) => `<li><b>${escapeHtml(s.name)}</b><span>${escapeHtml(s.what)}</span></li>`).join('');
  return (
    `<aside class="bts__sources"><h3>Thanks to the people whose work this stands on</h3>` +
    `<p>Numbers and facts were read from these community sources and checked against each other. The words of the game and of this page are our own.</p>` +
    `<ul>${items}</ul><p>And the other guides and forum posts that each research note names beside its own numbers.</p></aside>`
  );
}

function madeWithHtml(): string {
  const tools = MADE_WITH.map((m) => `${escapeHtml(m.name)} (${escapeHtml(m.by)}) for ${escapeHtml(m.did)}`).join(', ');
  return (
    `<div class="bts__fine"><p><b>Made with:</b> ${tools}.</p>` +
    `<p><b>Fan tribute:</b> ${escapeHtml(FAN_NOTICE)} (the same notice as on the game’s Credits screen, where every licence is listed).</p>` +
    `<p>${escapeHtml(COUNTS_NOTE)}</p></div>`
  );
}

/** One figure of the page. Cards and chapters share them. */
export function figureHtml(f: Figure): string {
  switch (f.kind) {
    case 'split':
      return (
        `<figure class="bts__fig"><div class="bts__plate"><div class="bts__split">${img(f.left)}${img(f.right, 'bts__now')}<div class="bts__edge"></div>` +
        `<span class="bts__tag bts__tag--l">${escapeHtml(f.leftTag)}</span><span class="bts__tag bts__tag--r">${escapeHtml(f.rightTag)}</span></div></div>${caption(f.caption, f.note)}</figure>`
      );
    case 'dirs':
      return (
        `<figure class="bts__fig"><div class="bts__dirs">${f.items
          .map((d) => `<div class="bts__dir${d.pick ? ' bts__dir--pick' : ''}">${img(d.img)}<span>${escapeHtml(d.label)}</span></div>`)
          .join('')}</div>${caption(f.caption, f.note)}</figure>`
      );
    case 'photo':
      return `<figure class="bts__fig"><div class="bts__plate">${img(f.img)}</div>${caption(f.caption, f.note)}</figure>`;
    case 'compare':
      return (
        `<figure class="bts__fig"><div class="bts__plate bts__plate--ba">${img(f.img)}<span class="bts__tag bts__tag--l">${escapeHtml(f.leftTag)}</span>` +
        `<span class="bts__tag bts__tag--r">${escapeHtml(f.rightTag)}</span></div>${caption(f.caption, f.note)}</figure>`
      );
    case 'duo':
      return `<figure class="bts__fig"><div class="bts__duo"><div class="bts__plate">${img(f.imgs[0])}</div><div class="bts__plate">${img(f.imgs[1])}</div></div>${caption(f.caption, f.note)}</figure>`;
    case 'big':
      return `<div class="bts__bigcount"><span class="bts__bn">${escapeHtml(f.from)}</span><span class="bts__arrow">&rarr;</span><span class="bts__bn">${escapeHtml(f.to)}</span><span class="bts__bt">${inline(f.text)}</span></div>`;
    case 'tiles':
      return tilesHtml(f.tiles, 'bts__tiles');
    case 'numbers':
      return tilesHtml(f.tiles, 'bts__numbers');
    case 'callout':
      return `<p class="bts__callout">${inline(f.text)}</p>`;
    case 'steps':
      return `<ol class="bts__steps">${f.steps.map((s) => `<li class="bts__step"><b>${escapeHtml(s.name)}</b><span>${escapeHtml(s.text)}</span></li>`).join('')}</ol>`;
    case 'listen':
      return (
        `<figure class="bts__fig"><div class="bts__listen"><div class="bts__lis-art" role="img" aria-label="An illustration of how a cue is chosen: a player, and a score box from 1 to 10.">` +
        `<div class="bts__player"><span class="bts__play"></span><span class="bts__ptrack"><i></i></span><span class="bts__ptime">0:12 / 1:26</span></div>` +
        `<div class="bts__score"><span>Score</span><ol>${Array.from({ length: 10 }, (_, k) => `<li${k === 7 ? ' class="is-on"' : ''}>${k + 1}</li>`).join('')}</ol></div></div>` +
        `<div class="bts__lis-rows">${f.rows.map((r) => `<div class="bts__lis-row"><b>${escapeHtml(r.n)}</b><span>${escapeHtml(r.s)}</span></div>`).join('')}</div></div>${caption(f.caption)}</figure>`
      );
    case 'chart':
      return chartHtml();
    case 'firstScore':
      return (
        `<div class="bts__first"><div class="bts__fn">${CRITIC.firstHeadline}<small>/10</small></div><div><p class="bts__fq">“The game does not reliably finish.”</p>` +
        `<p class="bts__fby">The critic’s first review · ${escapeHtml(CRITIC.firstDate)}</p></div></div>`
      );
    case 'sources':
      return sourcesHtml();
    case 'madeWith':
      return madeWithHtml();
  }
}

function cardHtml(c: Card, index: number): string {
  const big = c.big ? `<div class="bts__big"><b>${escapeHtml(c.big.n)}</b><span>${escapeHtml(c.big.text)}</span></div>` : '';
  const chips = c.chips ? `<ul class="bts__chips">${c.chips.map((k) => `<li><b>${escapeHtml(k.n)}</b><span>${escapeHtml(k.s)}</span></li>`).join('')}</ul>` : '';
  const credit = c.credit === 'madeWith' ? madeWithHtml() : c.credit ? `<p class="bts__credit">${inline(c.credit)}</p>` : '';
  return (
    `<section class="bts__card" data-bts-card="${c.id}" data-bts-bg="${escapeHtml(c.backdrop.file)}" aria-label="Card ${index + 1} of ${CARDS.length}"${index === 0 ? '' : ' hidden'}>` +
    `<div class="bts__vis">${figureHtml(c.visual)}</div><div class="bts__txt"><div class="bts__kick"><span class="bts__kn">${index + 1} / ${CARDS.length}</span><span class="bts__label">${escapeHtml(c.label)}</span></div>` +
    `<h2 class="bts__h">${escapeHtml(c.title)}</h2>${big}<p class="bts__t">${inline(c.text)}</p>${chips}${credit}</div></section>`
  );
}

function introHtml(): string {
  const dots = CARDS.map((c, i) => `<button class="bts__dot" type="button" data-bts-go-card="${i}" aria-label="Card ${i + 1}: ${escapeHtml(c.label)}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('');
  return (
    `<section class="bts__sec bts__intro" data-bts-sec="summary" data-bts-bg="${escapeHtml(CARDS[0]?.backdrop.file ?? IMAGES.keyart.file)}">` +
    `<div class="bts__hero"><div><span class="bts__label bts__label--rule">${escapeHtml(INTRO.eyebrow)}</span><h1 class="bts__title">${escapeHtml(INTRO.title)}</h1>` +
    `<p class="bts__lead2">${escapeHtml(INTRO.lead)}</p></div><p class="bts__t">${escapeHtml(INTRO.text)}</p></div>` +
    `<div class="bts__deckhead"><span class="bts__label">${escapeHtml(INTRO.twoMinutes)}</span><span class="bts__asof">${escapeHtml(INTRO.asOf)}</span></div>` +
    `<div class="bts__deck">${CARDS.map(cardHtml).join('')}</div>` +
    `<div class="bts__deckbar"><div class="bts__dots">${dots}</div><div class="bts__deckbtns">` +
    `<button class="bts__nbtn bts__nbtn--ghost" type="button" data-bts-card-step="-1">Back</button><button class="bts__nbtn" type="button" data-bts-card-step="1">Next</button></div></div>` +
    `<h2 class="bts__storyhead"><span class="bts__label">${escapeHtml(INTRO.storyHeading)}</span></h2></section>`
  );
}

function chapterHtml(ch: Chapter): string {
  const top = (ch.top ?? []).map(figureHtml).join('');
  const bottom = (ch.bottom ?? []).map(figureHtml).join('');
  const prose = ch.prose.length ? `<p class="bts__lead">${inline(ch.lead)}</p>${ch.prose.map((p) => `<p>${inline(p)}</p>`).join('')}` : `<p class="bts__lead">${inline(ch.lead)}</p>`;
  const grid = ch.side.length
    ? `<div class="bts__grid"><div class="bts__prose">${prose}</div><div class="bts__figs">${ch.side.map(figureHtml).join('')}</div></div>`
    : `<div class="bts__prose bts__prose--wide">${prose}</div>`;
  return (
    `<section class="bts__sec bts__chap" data-bts-sec="${ch.id}" data-bts-bg="${escapeHtml(ch.band.file)}">` +
    `<div class="bts__band" style="background-image:url('${escapeHtml(btsImageUrl(ch.band.file))}')"><div class="bts__bandin"><span class="bts__label">Chapter ${escapeHtml(ch.numeral)}</span>` +
    `<h2 class="bts__bandh">${escapeHtml(ch.heading).split('|').join('<br>')}</h2></div></div>${top}${grid}${bottom}</section>`
  );
}

/** The backdrops the stage can show, each once: the cards' and the chapters'. */
function backdropFiles(): string[] {
  const seen = new Set<string>();
  for (const c of CARDS) seen.add(c.backdrop.file);
  for (const ch of CHAPTERS) seen.add(ch.band.file);
  return [...seen];
}

/** The whole page, to be set as the overlay's inner markup. */
export function behindTheScenesHtml(): string {
  const stage = backdropFiles()
    .map((f, i) => `<div class="bts__bg${i === 0 ? ' is-on' : ''}" data-bts-bg-file="${escapeHtml(f)}" style="background-image:url('${escapeHtml(btsImageUrl(f))}')"></div>`)
    .join('');
  const tabs =
    `<button class="bts__tab" type="button" data-bts-go="summary" aria-current="true"><i>&middot;</i>In two minutes</button>` +
    CHAPTERS.map((c) => `<button class="bts__tab" type="button" data-bts-go="${c.id}"><i>${escapeHtml(c.numeral)}</i>${escapeHtml(c.name)}</button>`).join('');
  return (
    `<div class="bts" data-bts role="dialog" aria-modal="true" aria-label="${escapeHtml(BTS_TITLE)}">` +
    `<div class="bts__stage" aria-hidden="true">${stage}</div>` +
    `<header class="bts__head"><div class="bts__top"><span class="bts__label bts__label--rule">${escapeHtml(BTS_TITLE)}</span>` +
    `<button class="fe-info__close" type="button" data-info-act="close"><b>Esc</b> Close</button></div>` +
    `<nav class="bts__tabs" aria-label="Sections">${tabs}</nav><div class="bts__progress"><span data-bts-progress></span></div></header>` +
    `<main class="bts__scroll" data-role="info-scroll" tabindex="-1"><div class="bts__col">${introHtml()}${CHAPTERS.map(chapterHtml).join('')}</div></main>` +
    `<footer class="bts__keys"><span><b>&uarr; &darr;</b> scroll</span><span><b>&larr; &rarr;</b> card or chapter</span><span><b>Esc</b> or <b>Enter</b> close</span></footer></div>`
  );
}
