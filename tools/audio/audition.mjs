#!/usr/bin/env node
/**
 * Build `docs/audio/audition.html` — the page Bailey listens to.
 *
 * Generated rather than hand-written, because the measurements printed beside
 * each player have to be the ones this pass actually measured. A hand-kept
 * page drifts from the files within a day and then quietly lies about them.
 *
 *   node tools/audio/qa.mjs --json=<report>
 *   node tools/audio/audition.mjs --qa=<report>
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const qaPath = args.find((a) => a.startsWith('--qa='))?.slice(5);

const { TRACK_BLURBS } = await import('../../src/audio/tracks/index.ts');
const manifest = JSON.parse(await readFile(path.join(ROOT, 'public/audio/manifest.json'), 'utf8'));
const qa = qaPath ? JSON.parse(await readFile(qaPath, 'utf8')) : { cues: [] };
const measured = new Map(qa.cues.map((c) => [c.name, c]));

/** The cue map's "one emotion" column — the line that says what to listen for. */
const EMOTION = {
  title: 'A story that is already over, being told anyway',
  'chapter-select': 'Unhurried choosing; nothing here can hurt you yet',
  pause: 'The game holding its breath',
  'battle-ffx': 'We can win this',
  'boss-dread': 'Something is watching, and it is patient',
  'boss-seymour': 'Contempt that has convinced itself it is mercy',
  'boss-yunalesca': 'A rite that will finish with or without you',
  'boss-jecht': 'Two people talking over each other, and both of them are right',
  'boss-yu-yevon': 'No end',
  'scene-gagazet': 'The mountain does not care',
  'scene-zanarkand-dome': 'Warmth remembered, which is worse than cold',
  'scene-dreams-end': 'Unmoored',
  'scene-bevelle-underground': 'The machine under the cathedral',
  'scene-farplane': 'Rest without forgetting',
  'victory-ffx': 'Relief, not triumph',
  'ending-ffx': 'Permission to stop',
  'boss-ffx2-aeon': 'A pop star fighting a god, and enjoying it',
  'boss-vegnagun': 'Something enormous, and nobody is driving',
  'boss-shuyin': 'Grief that has curdled',
  'victory-ffx2': 'That was fun',
  'ending-ffx2': 'The second game says goodbye more gently, because it can',
};

const GROUPS = [
  {
    title: 'The frame',
    note: 'Everything outside a fight. These are the two cues a player hears most, which is why neither is allowed the goodbye’s heart.',
    cues: ['title', 'chapter-select', 'pause'],
  },
  {
    title: 'Chapter I — Seymour Flux, Mt. Gagazet',
    note: 'The mountain, the demonic mass, and the ordinary fight music the rest of the game is measured against.',
    cues: ['scene-gagazet', 'battle-ffx', 'boss-dread', 'boss-seymour', 'victory-ffx'],
  },
  {
    title: 'Chapter II — Yunalesca, the Zanarkand dome',
    note: 'The only time the prayer is ever warm, and the only time it is ever cold.',
    cues: ['scene-zanarkand-dome', 'boss-yunalesca'],
  },
  {
    title: 'Chapter III — Braska’s Final Aeon, and Yu Yevon',
    note: 'The father’s riff and the goodbye, played over each other on purpose; then the prayer stretched until its last chord never arrives.',
    cues: ['scene-dreams-end', 'boss-jecht', 'boss-yu-yevon', 'ending-ffx'],
  },
  {
    title: 'Chapter IV — FFX-2, Bahamut',
    note: 'The second game’s register: pop-jazz piano, brass, kit — and the pop hook recast in minor.',
    cues: ['scene-farplane', 'boss-ffx2-aeon', 'victory-ffx2'],
  },
  {
    title: 'Chapter V — Vegnagun and Shuyin',
    note: 'The same jump, mechanised and then grieved over.',
    cues: ['scene-bevelle-underground', 'boss-vegnagun', 'boss-shuyin', 'ending-ffx2'],
  },
];

/** The eight to hear first, if there is only time for eight. */
const FIRST_EIGHT = [
  ['title', 'The goodbye, unfinished — solo piano, a tone below its own key.'],
  ['chapter-select', 'The same tune as a waltz. This is the Clair Obscur register.'],
  ['battle-ffx', 'The ordinary fight. Everything else is measured against this.'],
  ['boss-seymour', 'Organ and band. He never gets loud; the band does.'],
  ['boss-yunalesca', 'The prayer turned Phrygian and made into a machine.'],
  ['boss-jecht', 'The riff and the goodbye, at the same time, arguing.'],
  ['boss-ffx2-aeon', 'The other game entirely — and the same four opening degrees.'],
  ['__montage', 'Twelve effects in twenty-five seconds: glass, steel, choir, sub.'],
];

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function player(name) {
  if (name === '__montage') {
    return `<audio controls preload="none" src="sfx-montage.mp3"></audio>`;
  }
  const entry = manifest.music[name];
  return `<audio controls preload="none" src="../../public/audio/${entry.file}"></audio>`;
}

function stats(name) {
  const entry = manifest.music[name];
  const m = measured.get(name);
  const bits = [
    `${Math.floor(entry.duration / 60)}:${String(Math.round(entry.duration % 60)).padStart(2, '0')}`,
    `${(entry.bytes / 1e6).toFixed(2)} MB`,
    `${entry.lufs} LUFS`,
    `${entry.truePeakDb} dBTP`,
    `loop ${entry.loopStart.toFixed(2)}s → ${entry.loopEnd.toFixed(2)}s`,
  ];
  if (m) {
    bits.push(`tilt ${m.tilt.toFixed(1)} dB/band`);
    bits.push(m.failures.length === 0 ? 'all gates pass' : `${m.failures.length} finding(s)`);
  }
  return bits.map((b) => `<span>${esc(b)}</span>`).join('');
}

const cueBlock = (name) => `
        <article class="cue">
          <h4>${esc(name)}</h4>
          <p class="emotion">${esc(EMOTION[name] ?? '')}</p>
          <p class="blurb">${esc(TRACK_BLURBS[name] ?? '')}</p>
          ${player(name)}
          <p class="stats">${stats(name)}</p>
        </article>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pyrefly Reprise — audition</title>
<style>
  :root {
    --ink: #17140f; --paper: #f6f1e6; --gold: #8a6a2f; --rule: #d8cdb6;
    --muted: #6b6055; --panel: #fffdf8;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ink: #ece4d6; --paper: #14120f; --gold: #d2ac5e; --rule: #3a342a;
      --muted: #9b9184; --panel: #1c1916;
    }
  }
  :root[data-theme="dark"] {
    --ink: #ece4d6; --paper: #14120f; --gold: #d2ac5e; --rule: #3a342a;
    --muted: #9b9184; --panel: #1c1916;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--paper); color: var(--ink);
    font: 16px/1.6 "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  }
  .wrap { max-width: 860px; margin: 0 auto; padding: 48px 16px 96px; }
  h1 { font-size: 2rem; margin: 0 0 4px; letter-spacing: 0.01em; }
  .sub { color: var(--muted); margin: 0 0 40px; font-style: italic; }
  h2 {
    font-size: 1.25rem; margin: 56px 0 8px; padding-bottom: 6px;
    border-bottom: 2px solid var(--gold);
  }
  h3 { font-size: 1.05rem; margin: 32px 0 4px; color: var(--gold); }
  h4 { font-size: 1rem; margin: 0 0 2px; font-family: ui-monospace, Menlo, Consolas, monospace; }
  .group-note { color: var(--muted); margin: 0 0 20px; font-size: 0.92rem; }
  .cue {
    background: var(--panel); border: 1px solid var(--rule); border-radius: 8px;
    padding: 16px 18px; margin: 0 0 14px;
  }
  .emotion { margin: 0 0 6px; font-style: italic; color: var(--gold); }
  .blurb { margin: 0 0 10px; font-size: 0.92rem; color: var(--muted); }
  audio { width: 100%; height: 36px; }
  .stats { margin: 10px 0 0; display: flex; flex-wrap: wrap; gap: 4px 14px;
           font: 12px/1.5 ui-monospace, Menlo, Consolas, monospace; color: var(--muted); }
  .guide { background: var(--panel); border-left: 3px solid var(--gold);
           padding: 20px 22px; border-radius: 0 8px 8px 0; }
  .guide ol { padding-left: 20px; }
  .guide li { margin-bottom: 14px; }
  .guide strong { color: var(--gold); }
  .check { border: 1px dashed var(--rule); border-radius: 8px; padding: 16px 20px; margin-top: 24px; }
  .first .cue { border-color: var(--gold); }
  footer { margin-top: 64px; padding-top: 16px; border-top: 1px solid var(--rule);
           color: var(--muted); font-size: 0.85rem; }
  @media (max-width: 480px) { .wrap { padding: 28px 16px 64px; } h1 { font-size: 1.5rem; } }
</style>
</head>
<body>
<div class="wrap">

<h1>Pyrefly Reprise — the score</h1>
<p class="sub">Twenty-one cues and 134 effects, rendered from sampled instruments and mixed in one hall. Nothing here quotes anything.</p>

<div class="guide">
  <h2 style="margin-top:0">What to listen for</h2>
  <p>There are six tunes in the whole game, and they are all related.</p>
  <ol>
    <li><strong>The prayer.</strong> A crowd singing with no instruments. Sixteen slow bars, and it never uses the chord that would make it sound like a <em>song</em> — so it sounds like something people have done for a thousand years instead. You hear it in the pause screen (just one voice and a drone), in the Zanarkand dome (warm, with strings, the only time it is ever kind), and in the Yu Yevon fight, where it is stretched to three minutes and the last chord never arrives.</li>
    <li><strong>The goodbye.</strong> This is the one. Solo piano, sixteen bars. It starts already falling, climbs once with everything it has, reaches a note it cannot hold, and comes home a step slower. If you only love one piece of music in this game, it should be this one — and if you don’t, tell us, because everything else is arranged around it. You have already heard four notes of it: it is the title theme, finished at last. It turns into a <strong>waltz</strong> in the menus, a <strong>nocturne</strong> in the dome, a <strong>lament over heavy guitars</strong> in the fight against the father, and at the very end the full orchestra plays it with three chords changed — nothing else — and it stops being sad.</li>
    <li><strong>Seymour.</strong> Six notes on a church organ, low and quiet. A polite little bow upward and then a slither downward. He never gets loud; the band around him does. In his last form the tune walks off the edge of its own scale.</li>
    <li><strong>The father.</strong> A rock riff, entirely off the beat, proud of itself. Its secret is that it is the prayer with every note shoved sideways — and in the mountain scene a single horn plays it <em>straight</em>, and it turns back into the prayer. In the Final Aeon fight the riff and the goodbye play <strong>at the same time</strong>, on purpose, over each other. It is supposed to sound like an argument.</li>
    <li><strong>The pop hook.</strong> FFX-2. Bright, jazzy, and its whole identity is one jump upward. Flatten the two notes of that jump and you get Shuyin’s tragedy; mechanise it and you get Vegnagun. Same jump, three worlds. There is one bar in the middle of the happy version that is pure joy — a chord that doesn’t belong, dropped in and taken straight back out. In Shuyin’s version that bar is just… ordinary. That’s the whole story of the character in one bar.</li>
    <li><strong>The battle music and the victory fanfare.</strong> Both original. The fanfare deliberately does the opposite of the famous one: it starts on a <em>long</em> note instead of three short ones, it falls instead of rising, and it ends on a gentle “amen” chord rather than a triumphant one — so winning feels like relief rather than a trophy.</li>
  </ol>
  <div class="check">
    <p style="margin-top:0"><strong>Three things to check if something feels wrong</strong></p>
    <p><strong>Does it breathe?</strong> There should be rests you notice — a beat where everything stops. If a cue never stops, it will feel like a synthesiser.</p>
    <p><strong>Are the sad notes loud?</strong> In this music the note that <em>aches</em> is meant to be louder than the note it falls to. If the aching note is the quiet one, we got it backwards and it will sound mechanical.</p>
    <p style="margin-bottom:0"><strong>Does it sound like one room?</strong> Sword hits, menu clicks and the orchestra all go through the same concert hall. If an effect sounds pasted on top, that is a bug, not a taste question.</p>
  </div>
</div>

<h2>Start here — eight files</h2>
<p class="group-note">If there is only time for eight, these eight say what changed.</p>
<div class="first">
${FIRST_EIGHT.map(
  ([name, why]) => `        <article class="cue">
          <h4>${esc(name === '__montage' ? 'sound effects — montage' : name)}</h4>
          <p class="emotion">${esc(why)}</p>
          ${player(name)}
          ${name === '__montage' ? '<p class="stats"><span>0:25</span><span>12 effects</span><span>cursor · confirm · menu · slash ×2 · guard · critical · cure · thunder · overdrive · summon · fayth</span></p>' : `<p class="stats">${stats(name)}</p>`}
        </article>`,
).join('\n')}
</div>

<h2>Everything, in play order</h2>
${GROUPS.map(
  (g) => `
<h3>${esc(g.title)}</h3>
<p class="group-note">${esc(g.note)}</p>
${g.cues.map(cueBlock).join('\n')}`,
).join('\n')}

<footer>
  <p>Every cue is rendered offline from the score data with sampled instruments (Salamander Grand Piano, CC-BY 3.0; Sonatina Symphonic Orchestra, CC Sampling Plus 1.0; FluidR3 GM, MIT) and mixed through one concert hall. The game fetches these files and falls back to runtime synthesis only if one is missing.</p>
  <p><strong>Measurements.</strong> LUFS is programme loudness — every cue is within a decibel of −16, so nothing jumps when the music changes. dBTP is the loudest instantaneous peak, held under −1 so no decoder clips it. “tilt” is how fast the spectrum rolls off above 250 Hz: a recorded ensemble slopes down, an oscillator stack does not, and every cue here slopes. “loop” is where the music wraps, stored to the sample so the join is silent.</p>
  <p>Generated by <code>tools/audio/audition.mjs</code>. Nothing in this score quotes any existing work.</p>
</footer>

</div>
</body>
</html>
`;

const out = path.join(ROOT, 'docs/audio/audition.html');
await writeFile(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(1)} KB, ${Object.keys(manifest.music).length} cues)`);
