#!/usr/bin/env node
/**
 * Writes the "Modern sound, round 1" section of docs/audio/audition.html from
 * docs/audio/round1-report.json (tools/audio/modern/round1.mjs) and
 * docs/audio/sketch-c-report.json (render-c.mjs), between the markers
 *   <!-- round1:begin -->  ...  <!-- round1:end -->
 * inserting it above the sketch A section the first time. Everything else in
 * the page is left byte for byte.
 *
 *   node tools/audio/modern/audition-round1.mjs
 *
 * Captions say what each file IS, never how it sounds (agents cannot hear,
 * hard rule 13).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const PAGE = join(ROOT, 'docs/audio/audition.html');
const r1 = JSON.parse(readFileSync(join(ROOT, 'docs/audio/round1-report.json'), 'utf8'));
const c = JSON.parse(readFileSync(join(ROOT, 'docs/audio/sketch-c-report.json'), 'utf8'));
const rel = (p) => `../../${p}`;
const sign = (v) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)).replace('-', '&minus;');
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

const CUE_TITLE = {
  'battle-ffx': 'battle-ffx &mdash; the ordinary fight (chapters 1&ndash;3, FFX)',
  'boss-ffx2-aeon': 'boss-ffx2-aeon &mdash; the chapter 4 fight (FFX-2)',
};

function captions(cue) {
  const b = r1.cues.find((x) => x.name === cue).bTake.split('-').pop();
  const cc = c.cues.find((x) => x.name === cue);
  const d = Object.fromEntries(cc.layers.map((l) => [l.layer, l.denoise.toFixed(2)]));
  return {
    current: 'What the game plays now: the same score on the shipped sample set (Sonatina, FluidR3) in the algorithmic hall.',
    A: 'The same score on new sampled instruments (VSCO&nbsp;2&nbsp;CE, VCSL), played with the phrase model, in a convolution hall.',
    B: `Today&rsquo;s recording re-played by a local music model (ACE-Step, strength 0.40, take ${b}).`,
    C: `Sketch A with two model-made layers under it: a choir pad (from A&rsquo;s sustained parts, strength ${d.choir}) 10&nbsp;dB down and a low string bed (from A&rsquo;s low parts, strength ${d.low}) 12&nbsp;dB down.`,
  };
}

const LABEL = { current: 'Today', A: 'Sketch A', B: 'Sketch B', C: 'Sketch C' };
const KEY = { current: 'today', A: 'A', B: 'B', C: 'C' };

function scoreRow(cue, which) {
  const buttons = Array.from({ length: 10 }, (_, i) => `<button type="button" data-v="${i + 1}" aria-pressed="false">${i + 1}</button>`).join('');
  return `<div class="r1-score" role="group" aria-label="Score ${LABEL[which]}, ${cue}, 1 to 10" data-cue="${cue}" data-which="${KEY[which]}">${buttons}</div>
    <input type="hidden" data-sketch="Round 1 &mdash; ${cue} ${LABEL[which]}">`;
}

function cueBlock(entry) {
  const cap = captions(entry.name);
  const cards = ['current', 'A', 'B', 'C'].map((w) => {
    const ex = entry.excerpts[w];
    return `  <article class="cue r1-card">
    <h4>${LABEL[w]}</h4>
    <p class="blurb">${cap[w]}</p>
    <audio controls preload="none" src="${rel(ex.file)}"></audio>
    ${scoreRow(entry.name, w)}
    <p class="r1-level">level-matched: ${sign(ex.gainDb)}&nbsp;dB to &minus;16 LUFS${ex.limited ? ', peak-limited' : ''}</p>
  </article>`;
  });
  const cc = c.cues.find((x) => x.name === entry.name);
  const solos = cc.layers.map((l) => `<a href="${rel(l.soloExcerpt.file)}">${l.layer === 'choir' ? 'the choir pad' : 'the low string bed'}</a>`).join(' &middot; ');
  return `<h3>${CUE_TITLE[entry.name]}</h3>
<p class="group-note r1-note">12 seconds from ${entry.excerptStartSec.toFixed(1)}&nbsp;s, the same moment in all four. Sketch C&rsquo;s two added layers alone (12&nbsp;s, raised to &minus;16 LUFS so they can be heard): ${solos}.</p>
<div class="r1-grid">
${cards.join('\n')}
</div>`;
}

function fullTable() {
  const rows = r1.cues.map((e) => {
    const cells = ['current', 'A', 'B', 'C'].map((w) => {
      const f = e.full[w];
      return `<td><audio controls preload="none" src="${rel(f.file)}"></audio><span class="r1-meta">${f.lufs.toFixed(1)} LUFS</span></td>`;
    }).join('');
    return `<tr><th scope="row">${e.name}</th>${cells}</tr>`;
  }).join('\n');
  return `<div class="r1-full"><table>
<thead><tr><th scope="col">Cue</th><th scope="col">Today</th><th scope="col">Sketch A</th><th scope="col">Sketch B</th><th scope="col">Sketch C</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>`;
}

function measured() {
  const rows = [];
  for (const e of r1.cues) {
    for (const w of ['current', 'A', 'B', 'C']) {
      const f = e.full[w];
      const o = f.onsetVsCurrent;
      rows.push(`<tr><td>${e.name}</td><td>${LABEL[w]}</td><td>${f.lra.toFixed(1)}</td><td>${f.crestDb.toFixed(1)}</td><td>${o ? `${o.lagMedianAbsMs} / ${o.lagMaxAbsMs}` : '&mdash;'}</td></tr>`);
    }
  }
  return `<details class="cue">
  <summary>What was measured (nobody on the agent side has heard any of this)</summary>
  <p class="blurb">Whole cues. LRA is the loudness range (how far loud and soft passages sit apart); crest is peak over average level; the last column is how far each version&rsquo;s note onsets sit from today&rsquo;s, median / largest, per 4-bar window. Full numbers: <code>docs/audio/round1-report.json</code>, <code>docs/audio/sketch-c-report.json</code>, and <code>docs/handoff/music-modern-sound.md</code>.</p>
  <div class="r1-full"><table>
  <thead><tr><th scope="col">Cue</th><th scope="col">Version</th><th scope="col">LRA (LU)</th><th scope="col">Crest (dB)</th><th scope="col">Onset offset vs today (ms)</th></tr></thead>
  <tbody>
  ${rows.join('\n  ')}
  </tbody></table></div>
</details>`;
}

const STYLE = `<style>
  .r1-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 0 14px; }
  .r1-card h4 { font-family: inherit; }
  .r1-score { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 4px; max-width: 420px; margin: 12px 0 0; padding-top: 10px; border-top: 1px solid var(--rule); }
  .r1-score button { min-width: 0; height: 34px; padding: 0; font: 13px/1 ui-monospace, Menlo, Consolas, monospace;
                     color: var(--ink); background: var(--paper); border: 1px solid var(--rule); border-radius: 4px; cursor: pointer; }
  .r1-score button[aria-pressed="true"] { color: var(--paper); background: var(--gold); border-color: var(--gold); }
  .r1-score button:focus-visible { outline: 2px solid var(--gold); outline-offset: 1px; }
  .r1-level, .r1-meta { display: block; margin: 8px 0 0; font: 12px/1.5 ui-monospace, Menlo, Consolas, monospace; color: var(--muted); }
  .r1-line { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .r1-line input { flex: 1 1 260px; min-width: 0; font: 12px/1.5 ui-monospace, Menlo, Consolas, monospace; padding: 6px 8px;
                   color: var(--ink); background: var(--paper); border: 1px solid var(--rule); border-radius: 4px; }
  .r1-line button { font: inherit; padding: 6px 14px; cursor: pointer; color: var(--paper); background: var(--gold); border: 0; border-radius: 6px; }
  .r1-note a { color: var(--gold); }
  .r1-full { overflow-x: auto; }
  .r1-full table { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
  .r1-full th, .r1-full td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--rule); vertical-align: top; }
  .r1-full td audio { min-width: 150px; }
</style>`;

const SCRIPT = `<script>
(function () {
  var order = [${r1.cues.map((e) => `'${e.name}'`).join(', ')}];
  var who = ['today', 'A', 'B', 'C'];
  var scores = {};
  function line() {
    return 'Modern sound round 1 (1-10) \\u2014 ' + order.map(function (cue) {
      return cue + ': ' + who.map(function (w) { return w + ' ' + ((scores[cue] || {})[w] || '-'); }).join(', ');
    }).join(' | ');
  }
  function copy(text) {
    var status = document.getElementById('r1-status');
    function fallback() {
      var box = document.getElementById('r1-line');
      box.focus(); box.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      status.textContent = ok ? 'Copied. Paste it in chat.' : 'Select the line and copy it.';
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { status.textContent = 'Copied. Paste it in chat.'; }, fallback);
    } else { fallback(); }
  }
  document.querySelectorAll('.r1-score').forEach(function (row) {
    row.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-v]');
      if (!b) return;
      var cue = row.dataset.cue, w = row.dataset.which;
      (scores[cue] = scores[cue] || {})[w] = b.dataset.v;
      row.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var hidden = row.nextElementSibling;
      if (hidden && hidden.matches('input[data-sketch]')) hidden.value = b.dataset.v;
      var text = line();
      document.getElementById('r1-line').value = text;
      copy(text);
    });
  });
  document.getElementById('r1-copy').addEventListener('click', function () { copy(document.getElementById('r1-line').value); });
  document.getElementById('r1-line').value = line();
})();
</script>`;

const section = `<!-- round1:begin — generated by tools/audio/modern/audition-round1.mjs from docs/audio/round1-report.json. -->
<!-- Re-run that script instead of editing by hand. Files: public/audio/candidates/C-round1-* (not in the manifest). -->
${STYLE}
<h2>Modern sound, round 1: today, A, B and C side by side</h2>
<p class="group-note">
  <strong>The same notes, four ways of sounding.</strong> Every player below plays the same score: what
  ships today, and three ways of making it sound like a modern recording. Each cue is the same 12 seconds in
  all four, from the same start, brought to the same loudness (&minus;16 LUFS; the gain each needed is under
  it). Score each one 1&ndash;10: pressing a number copies one line with all your round 1 scores, ready to
  paste into chat. The blind pairs further down (sketch A, sketch B) are the same material; this round is
  enough on its own.
</p>
${r1.cues.map(cueBlock).join('\n\n')}

<div class="check">
  <p style="margin-top:0"><strong>Your round 1 line</strong> &mdash; copied each time you press a score. If the copy is blocked, select it here.</p>
  <div class="r1-line"><input id="r1-line" readonly aria-label="Round 1 summary line"><button type="button" id="r1-copy">Copy</button></div>
  <p id="r1-status" class="r1-level" aria-live="polite"></p>
</div>

<h3>Whole cues</h3>
<p class="group-note">The full renders (${r1.cues.map((e) => `${e.name} ${mmss(c.cues.find((x) => x.name === e.name).durationSec)}`).join(', ')}), each already at about &minus;16 LUFS as delivered; the measured level is under each. Sketches B and C are auditions, not loopable game files yet.</p>
${fullTable()}

${measured()}
${SCRIPT}
<!-- round1:end -->
`;

let page = readFileSync(PAGE, 'utf8');
const nl = page.includes('\r\n') ? '\r\n' : '\n';
const body = section.replace(/\n/g, nl);
const begin = page.indexOf('<!-- round1:begin');
const endTag = '<!-- round1:end -->';
if (begin >= 0) {
  const end = page.indexOf(endTag, begin) + endTag.length;
  page = page.slice(0, begin) + body.trimEnd() + page.slice(end);
} else {
  const a = page.indexOf('<!-- sketch-A:begin');
  const bar = page.lastIndexOf('<!-- ====', a);
  if (a < 0 || bar < 0) throw new Error('sketch-A marker not found in audition.html');
  page = page.slice(0, bar) + body + nl + page.slice(bar);
}
writeFileSync(PAGE, page);
console.log(`  wrote the round 1 section into ${PAGE}`);
