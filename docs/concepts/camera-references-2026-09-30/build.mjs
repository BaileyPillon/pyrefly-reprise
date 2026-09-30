// Builds index.html: a static page that compares how Clair Obscur and Persona 5 / Royal frame a battle.
// Reads research/battle-camera-clair-obscur.json and battle-camera-persona5.json (plus the numbered Sources
// in their .md notes) and writes index.html next to this file. Run: node build.mjs (or from the repo root:
// node docs/concepts/camera-references-2026-09-30/build.mjs). Nothing here needs a network.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, plain, evidenceLine, expandCodes, sourcePhrase, toSeconds } from './text.mjs';
import { diagramSvg, place, coverage } from './diagram.mjs';
import { CAM, BOTH, DIFFER, VIDEO, SIDE_ROWS, OUR, THIN_CO, THIN_P5, ROYAL_SRC, ROYAL_UNSEEN, CAMERA_SETTING, P5_SRC_FIX } from './copy.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const co = JSON.parse(read('research/battle-camera-clair-obscur.json'));
const p5 = JSON.parse(read('research/battle-camera-persona5.json'));
const warn = [];

const a = (href, text, cls) => `<a${cls ? ` class="${cls}"` : ''} href="${esc(href)}" target="_blank" rel="noopener">${text}</a>`;
const yt = (id, s) => `https://www.youtube.com/watch?v=${id}&t=${s}s`;
const vid = (url) => (String(url).match(/[?&]v=([\w-]+)/) || [])[1];
const two = (i) => String(i + 1).padStart(2, '0');

// ---- numbered Sources from the .md notes ----
function parseSources(md, style) {
  const body = md.split(/^## Sources.*$/m)[1] ?? '';
  const items = [];
  let group = '';
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    const g = line.match(/^\*\*([^*]+)\*\*$/);
    if (g) { group = g[1]; continue; }
    const m = style === 'co' ? line.match(/^- \*\*S(\d+)\.\*\*\s+(.*)$/) : line.match(/^(\d+)\.\s+(.*)$/);
    if (!m) continue;
    const urls = (m[2].match(/https?:\/\/\S+/g) || []).map((u) => u.replace(/[.,;)]+$/, ''));
    const first = m[2].indexOf(urls[0]);
    const last = m[2].lastIndexOf(urls[urls.length - 1]);
    items.push({
      n: Number(m[1]), label: (style === 'co' ? 'S' : '') + m[1], group, urls,
      title: m[2].slice(0, first).replace(/[\s.:,;]+$/, ''),
      trail: m[2].slice(last + urls[urls.length - 1].length).replace(/^[\s.;,]+/, ''),
    });
  }
  return items;
}
const coSrc = parseSources(read('research/battle-camera-clair-obscur.md'), 'co');
const p5Src = parseSources(read('research/battle-camera-persona5.md'), 'p5');
const p5ByN = Object.fromEntries(p5Src.map((s) => [s.n, s]));
if (coSrc.length !== co.sources.length) warn.push(`Clair Obscur sources: md has ${coSrc.length}, json has ${co.sources.length}`);

// ---- diagram key ----
const glyph = (inner) => `<svg viewBox="0 0 22 14" width="22" height="14" aria-hidden="true">${inner}</svg>`;
const keyHtml = () => `<ul class="key" aria-label="How to read the diagrams">
<li>${glyph('<circle class="d-active" cx="11" cy="7" r="5"/>')}The hero whose turn it is</li>
<li>${glyph('<circle class="d-party" cx="11" cy="7" r="5"/>')}Party</li>
<li>${glyph('<polygon class="d-enemy" points="11 0 19 7 11 14 3 7"/>')}Enemy</li>
<li>${glyph('<line class="d-axis" x1="1" y1="7" x2="21" y2="7"/>')}Party to enemy</li>
<li>${glyph('<polygon class="d-keywedge" points="2 7 21 1 21 13"/>')}Camera: tip is the lens, wider is a wider lens</li></ul>
<p class="key-note">Top-down sketches on the same arena. Angles and heights are eyeballed from footage; no game publishes them.</p>`;

// ---- shot cards ----
function watchHtml(shot) {
  const ok = (shot.watch || []).filter((w) => w.verified === true && /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]+&t=\d+s$/.test(w.url));
  if (ok.length !== (shot.watch || []).length) warn.push(`${shot.id}: a watch link was dropped (not verified or unexpected url)`);
  const note = shot.watchNote ? `<p class="wnote">${esc(plain(shot.watchNote))}</p>` : '';
  if (!ok.length) return `<p class="none">No checked official footage for this moment</p>${note}`;
  const items = ok.map((w) => {
    if (Number(w.url.match(/&t=(\d+)s/)[1]) !== toSeconds(w.t)) warn.push(`${shot.id}: timecode ${w.t} does not match ${w.url}`);
    const label = VIDEO[vid(w.url)] ?? (warn.push(`${shot.id}: no label for video ${vid(w.url)}`), 'Video');
    return `<li>${a(w.url, `<svg viewBox="0 0 10 12" width="10" height="12" aria-hidden="true"><path class="d-play" d="M1 .8v10.4L9.4 6z"/></svg><span class="t">${esc(w.t)}</span><span class="v">${esc(label)}</span><span class="sr">, opens YouTube in a new tab</span>`, 'chip')}<p class="look">${esc(plain(w.lookFor))}</p></li>`;
  });
  return `<ul class="chips">${items.join('')}</ul>${note}`;
}

const BADGE = { same: ['Same in Royal', 'same'], changed: ['Changed in Royal', 'changed'], new: ['Royal only', 'new'] };

function shotCard(shot, i, game) {
  const c = CAM[shot.id] ?? (warn.push(`missing copy for ${shot.id}`), { cam: '', h: '' });
  const cov = coverage(place(shot));
  if (cov && cov.gapToParty < 9) warn.push(`${shot.id}: lens sits ${cov.gapToParty.toFixed(1)} units from a party circle`);
  const unseen = shot.royal === 'same' && ROYAL_UNSEEN.has(shot.id);
  const badge = shot.royal ? `<span class="badge ${unseen ? 'same presumed' : BADGE[shot.royal][1]}">${unseen ? 'Presumed same in Royal' : BADGE[shot.royal][0]}</span>` : '';
  const srcs = (shot.sources || []).map((s) =>
    `<li>${a(s.url, esc(s.title))}${s.note ? ` <span class="note">${esc(plain(s.note))}</span>` : ''}</li>`).join('');
  const evid = evidenceLine(shot.confidence, shot.whyItWorks);
  return `<article class="shot" id="${shot.id}">
<header class="shot-head"><span class="shot-num">${two(i)}</span><div class="shot-title"><p class="phase">${esc(shot.phase)}</p><h3>${esc(shot.name)}</h3></div>${badge}</header>
<div class="shot-body">
<figure class="diagram">${diagramSvg(shot)}<figcaption><span class="lab">Height</span>${esc(c.h)}</figcaption></figure>
<div class="shot-text">
<dl class="rows">
<div class="row"><dt>Camera</dt><dd>${esc(c.cam)}</dd></div>
<div class="row"><dt>Frame</dt><dd>${esc(plain(shot.frame))}</dd></div>
<div class="row"><dt>Why it reads as premium</dt><dd>${esc(plain(shot.whyItWorks))}</dd></div>
<div class="row"><dt>Watch</dt><dd>${watchHtml(shot)}</dd></div>
</dl>
<p class="conf"><span class="lab">Evidence</span>${esc(evid)}</p>
<details class="src"><summary>Sources</summary><p class="evid"><strong>Evidence notes.</strong> ${esc(plain(expandCodes(shot.confidence)))}</p><ul class="srcs">${srcs}</ul></details>
</div></div></article>`;
}

function gameSection({ id, cls, tag, name, data, lede, extra = '' }) {
  return `<section class="sec ${cls}" id="${id}" aria-labelledby="${id}-h">
<div class="sec-head"><p class="tag"><span class="sw"></span>${esc(tag)}</p><h2 id="${id}-h">${esc(name)}</h2>
<p class="prose lede">${esc(plain(lede))}</p>${extra}</div>
<div class="strip-head"><p class="count">${data.shots.length} shots, in the order a turn plays</p>${keyHtml()}</div>
<div class="strip">${data.shots.map((s, i) => shotCard(s, i, cls)).join('\n')}</div></section>`;
}

// ---- Persona camera grammar (from the JSON), tags stripped ----
const grammar = p5.cameraGrammar.map((s) => s.replace(/\s*\[(?:derived|observed)[^\]]*\]\s*$/i, '').replace(/\[([^\]]+)\]/, '($1)'));

// ---- Royal ----
function srcLinks(spec) {
  return spec.map(([label, ref]) => {
    if (typeof ref === 'number') return p5ByN[ref] ? a(p5ByN[ref].urls[0], esc(label)) : (warn.push(`royal: no source ${ref}`), esc(label));
    const [, id, s] = ref.match(/^yt:([\w-]+)@(\d+)$/);
    return a(yt(id, s), esc(label));
  }).join(' · ');
}
function royalSection() {
  const changed = p5.shots.map((s, i) => [s, i]).filter(([s]) => s.royal !== 'same');
  const SHORT = { 'p5-encounter': 'The ambush', 'p5-baton': 'Baton Pass', 'p5r-showtime': 'Showtime' };
  const links = changed.map(([s, i]) => `<a href="#${s.id}">${two(i)} ${esc(SHORT[s.id] ?? s.phase)}</a> (${s.royal})`).join(', ');
  const rows = p5.royalChanges.filter((c) => !/^IDENTICAL/.test(c.detail)).map((c) => {
    const spec = ROYAL_SRC.find(([re]) => re.test(c.what));
    if (!spec) warn.push(`royal: no sources for "${c.what}"`);
    return `<div><dt>${esc(c.what)}</dt><dd>${esc(plain(c.detail))}<span class="from">Sources: ${spec ? srcLinks(spec[1]) : esc(c.source)}</span></dd></div>`;
  });
  const same = p5.royalChanges.find((c) => /^IDENTICAL/.test(c.detail));
  const sameSpec = ROYAL_SRC.find(([re]) => re.test(same.what));
  return `<section class="sec game-p5" id="royal" aria-labelledby="royal-h">
<div class="sec-head"><p class="tag"><span class="sw"></span>Persona 5 Royal, 2019</p><h2 id="royal-h">What Royal changes</h2>
<p class="prose lede">${changed.length} of the ${p5.shots.length} shots above differ in Royal: ${links}. The other ${p5.shots.length - changed.length} read as the same as the base game. Negotiation, enemy turns and an ordinary victory were not seen in Royal footage, so those are “same” only because no source lists a change.</p></div>
<dl class="royal-list">${rows.join('\n')}</dl>
<p class="same-line"><span class="badge same">Identical in Royal</span>${esc(plain(same.detail).replace(/^IDENTICAL/, 'Identical'))} <span class="from">Sources: ${srcLinks(sameSpec[1])}</span></p></section>`;
}

// ---- side by side ----
const ourItem = (o) => {
  const m = OUR[o.img] ?? (warn.push(`no size for ${o.img}`), { w: 960, h: 540, alt: o.name });
  if (!fs.existsSync(path.join(here, 'our', o.img))) warn.push(`missing thumbnail our/${o.img}`);
  const score = o.scores
    ? o.scores.map(([v, on]) => `${esc(v)}<small>/10 in ${esc(on)}</small>`).join(' · ')
    : `${esc(o.score)}<small>/10</small>`;
  return `<figure${o.img.includes('strip') ? ' class="wide"' : ''}><img src="our/${o.img}" width="${m.w}" height="${m.h}" alt="${esc(m.alt)}" loading="lazy"><figcaption><span class="opt">${esc(o.name)}</span><span class="sc"><span class="lab">Eye candy</span>${score}</span><span class="frm">${esc(o.frame)}</span></figcaption></figure>`;
};
function sideSection() {
  const rows = SIDE_ROWS.map((r) => {
    const ours = r.ours ? `<div class="ours">${r.ours.map(ourItem).join('')}</div>${r.note ? `<p class="ours-note">${esc(r.note)}</p>` : ''}` : `<p class="none">${esc(r.none)}</p>`;
    return `<tr><th scope="row">${esc(r.moment)}</th><td data-label="Clair Obscur">${esc(r.co)}</td><td data-label="Persona 5 / Royal">${esc(r.p5)}</td><td data-label="Closest in our mockups">${ours}</td></tr>`;
  });
  return `<section class="sec" id="side-by-side" aria-labelledby="sbs-h">
<div class="sec-head"><h2 id="sbs-h">Side by side, with our mockups</h2><p class="prose lede">Six moments of a turn: what each game does, and the closest thing in our own perspectives round.</p></div>
<div class="sbs-wrap" role="region" aria-label="Comparison table, scrolls sideways on narrow screens" tabindex="0"><table class="sbs">
<thead><tr><th scope="col">Moment</th><th scope="col"><span class="sw" style="--tag:var(--co)"></span>Clair Obscur</th><th scope="col"><span class="sw" style="--tag:var(--p5)"></span>Persona 5 / Royal</th><th scope="col">Closest in our mockups</th></tr></thead>
<tbody>${rows.join('\n')}</tbody></table></div>
<p class="sbs-foot">Scores are the mean of three AI judges across both chapters from our perspectives round. Full round: ${a('https://claude.ai/artifact/YSdFH3hWkYL7RKbvYqpRWH', 'Battle Perspectives gallery')}.</p></section>`;
}

// ---- settings, thin sources, sources ----
function settingsCol(title, cls, list) {
  const items = list.map((s) => {
    const cam = CAMERA_SETTING.some((re) => re.test(s.name)) && !/^Battle camera/.test(s.name) ? ' <span class="badge same">Battle camera</span>' : '';
    return `<div class="setting"><dt>${esc(s.name)}${cam}</dt><dd>${esc(plain(s.effect))}<span class="from">Source: ${esc(plain(sourcePhrase(s.source)))}</span></dd></div>`;
  });
  return `<div class="${cls}"><h3>${esc(title)}</h3><dl>${items.join('')}</dl></div>`;
}
const thinCol = (title, cls, lines) => `<div class="${cls}"><h3>${esc(title)}</h3><ul class="thin">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>`;
function srcCol(title, cls, items, style) {
  let prev = '';
  const lis = items.map((s) => {
    const fix = style === 'p5' ? P5_SRC_FIX[s.n] : null;
    const title2 = fix ? fix.title : s.title;
    const extra = fix ? s.urls.slice(1).map((u, k) => a(u, esc(fix.labels[k + 1] ?? 'link'))).join(' · ') : s.urls.slice(1).map((u) => a(u, 'link')).join(' · ');
    const head = s.group && s.group !== prev ? `<li class="g">${esc(s.group)}</li>` : '';
    prev = s.group;
    const trail = !fix && s.trail ? `<span class="x">${esc(s.trail)}</span>` : '';
    return `${head}<li><span class="n">${esc(s.label)}</span><span>${a(s.urls[0], esc(title2))}${extra ? ` <span class="x">Also: ${extra}</span>` : ''}${trail}</span></li>`;
  });
  return `<div class="${cls}"><h3>${esc(title)}</h3><ol class="srclist">${lis.join('')}</ol></div>`;
}

const NAV = [['clair-obscur', 'Clair Obscur', 'co'], ['persona-5', 'Persona 5', 'p5'], ['royal', 'Royal', 'p5'], ['side-by-side', 'Side by side'], ['settings', 'Settings'], ['sources', 'Sources']];
const nav = `<nav class="nav" aria-label="Sections"><ul>${NAV.map(([id, label, g]) =>
  `<li><a href="#${id}">${g ? `<span class="sw" style="--tag:var(--${g})" aria-hidden="true"></span>` : ''}${label}</a></li>`).join('')}</ul></nav>`;

const page = `<title>Clair Obscur and Persona Cameras</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&amp;family=Cormorant+Garamond:ital,wght@1,700&amp;family=Exo+2:wght@400;600&amp;family=Rajdhani:wght@700&amp;display=swap">
<style>
${read('docs/concepts/camera-references-2026-09-30/page.css')}</style>
<div class="wrap">
<header class="top">
<p class="eyebrow">Pyrefly Reprise · Camera research · 30 September 2026</p>
<h1>Clair Obscur and Persona Cameras</h1>
<p class="dek">How Clair Obscur: Expedition 33, Persona 5 and Persona 5 Royal point the camera at each moment of a battle. Every timestamp below was checked against a frame of an official video; click one to see the moment in the real game.</p>
</header>
<main>
<section aria-labelledby="lin-h">
<h2 class="sr" id="lin-h">Where the camera idea comes from</h2>
<ol class="lineage">
<li class="node"><p class="n-name"><span class="sw" style="--tag:var(--p5)"></span>Persona 5 · 2016</p><p class="n-sub">The battle camera Broche names.</p></li>
<li class="node"><p class="n-name"><span class="sw" style="--tag:var(--p5)"></span>Persona 5 Royal · 2019</p><p class="n-sub">The same battle camera, plus new Showtime scenes.</p></li>
<li class="node"><p class="n-name"><span class="sw" style="--tag:var(--co)"></span>Clair Obscur: Expedition 33 · 2025</p><p class="n-sub">Names Persona 5 as its model.</p></li>
</ol>
<figure class="quote"><p class="prose">Clair Obscur’s director, Guillaume Broche, names Persona 5’s battle camera as his model:</p>
<blockquote>“The way the camera shifts dramatically with each action from the player”</blockquote>
<figcaption>${a('https://www.pcgamesn.com/clair-obscur-expedition-33/persona-5-influence', 'Denfaminicogamer interview, May 2025, as reported by PCGamesN')}</figcaption></figure>
<p class="fx">${a('https://www.rpgsite.net/interview/17041-clair-obscur-expedition-33-interview-celebrating-turn-based-games-classic-rpg-influences-in-making-something-new', 'Sandfall credits Final Fantasy X for the party, the pacing and the story.')} No source ties Clair Obscur’s camera to FFX.</p>
</section>
<section class="sec dual" aria-label="What the two games share and where they differ">
<div><h2>What both games do</h2><ul class="pts">${BOTH.map((t) => `<li>${t}</li>`).join('')}</ul></div>
<div><h2>Where they differ</h2><ul class="pts">${DIFFER.map((d) => `<li>${d.html}<span class="note">${esc(d.note)}</span></li>`).join('')}</ul></div>
</section>
${nav}
${gameSection({ id: 'clair-obscur', cls: 'game-co', tag: 'Clair Obscur · 2025', name: 'Clair Obscur: Expedition 33', data: co, lede: co.identity })}
${gameSection({ id: 'persona-5', cls: 'game-p5', tag: 'Persona 5 · 2016', name: 'Persona 5', data: p5, lede: p5.identity,
  extra: `<div class="gram"><p class="phase">Persona’s camera grammar, in six lines</p><ul class="pts">${grammar.map((g) => `<li>${esc(plain(g))}</li>`).join('')}</ul></div>` })}
${royalSection()}
${sideSection()}
<section class="sec" id="settings" aria-labelledby="set-h">
<div class="sec-head"><h2 id="set-h">Camera settings</h2><p class="prose lede">Clair Obscur lets you switch battle-camera movement off, which gives a still, wider camera. Persona 5 Royal has no battle-camera option.</p></div>
<div class="cols2">${settingsCol('Clair Obscur', 'game-co', co.settings)}${settingsCol('Persona 5 Royal', 'game-p5', p5.settings)}</div></section>
<section class="sec" id="thin" aria-labelledby="thin-h">
<div class="sec-head"><h2 id="thin-h">Where the sources are thin</h2><p class="prose lede">Read the cards with these gaps in mind.</p></div>
<div class="cols2">${thinCol('Clair Obscur', 'game-co', THIN_CO)}${thinCol('Persona 5 and Royal', 'game-p5', THIN_P5)}</div></section>
<section class="sec" id="sources" aria-labelledby="src-h">
<div class="sec-head"><h2 id="src-h">Sources</h2><p class="prose lede">Numbering follows the two research notes. All links were accessed on 30 September 2026.</p></div>
<div class="cols2">${srcCol('Clair Obscur', 'game-co', coSrc, 'co')}${srcCol('Persona 5 and Royal', 'game-p5', p5Src, 'p5')}</div></section>
</main>
<footer class="foot"><p>Frames were checked by our research agents in official uploads and then deleted; this page links to the videos and shows no game footage. Research notes: <code>research/battle-camera-clair-obscur.md</code> and <code>research/battle-camera-persona5.md</code>.</p></footer>
</div>
<script>
${read('docs/concepts/camera-references-2026-09-30/page.js')}</script>
`;

// ---- checks, then write ----
const emoji = page.match(/\p{Extended_Pictographic}/gu);
if (emoji) warn.push(`emoji found: ${[...new Set(emoji)].join(' ')}`);
for (const m of page.matchAll(/<a [^>]*href="(https?:[^"]+)"[^>]*>/g)) if (!/target="_blank" rel="noopener"/.test(m[0])) warn.push(`external link without target/rel: ${m[1]}`);
fs.writeFileSync(path.join(here, 'index.html'), page);
const thumbs = fs.readdirSync(path.join(here, 'our')).reduce((n, f) => n + fs.statSync(path.join(here, 'our', f)).size, 0);
console.log(`index.html ${(Buffer.byteLength(page) / 1024).toFixed(0)} KB + thumbnails ${(thumbs / 1024).toFixed(0)} KB; ${co.shots.length + p5.shots.length} shots; ${coSrc.length} + ${p5Src.length} sources`);
if (warn.length) console.warn('WARNINGS:\n- ' + warn.join('\n- '));
