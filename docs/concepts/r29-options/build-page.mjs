// Builds options.html: one self-contained page, every screenshot embedded as a data: URI.
//   node docs/concepts/r29-options/build-page.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('./', import.meta.url));
const img = (n, alt, cls) => `<img class="${cls}" alt="${alt}" src="data:image/jpeg;base64,${readFileSync(dir + 'shots/' + n + '.jpg').toString('base64')}">`;

const options = [
  {
    id: 'A1', title: 'A1 · Reduce motion + Low effects', pick: false,
    what: 'Two ON/OFF rows under TEXT SPEED in the pause OPTIONS column, wired to the flags that already exist in SaveData (reduceMotion, lowEffects). Nothing else changes.',
    cost: 'Smallest: two rows and the presenters read a flag they mostly already read. No new layout work. Does not help low-vision players.',
    shots: [['desk-A1', 'A1 at 1600x900', 'desk'], ['phone-A1', 'A1 at 390x844', 'phone']],
  },
  {
    id: 'A2', title: 'A2 · Those two + Text size (100 / 115 / 130 %)', pick: true,
    what: 'A1 plus a TEXT SIZE row with three steps, nudged with Left / Right like TEXT SPEED. Grows the battle HUD, dialogue and menus.',
    cost: 'Medium: real layout work, not one CSS line (the HUD sits on a fixed 640x360 grid; each panel must grow as a unit and the FFX-2 HUD needs its own pass; phone party card caps at 115 %). See docs/concepts/accessibility-2026-09-26 for the 130 % frames.',
    shots: [['desk-A2', 'A2 at 1600x900', 'desk'], ['phone-A2', 'A2 at 390x844', 'phone']],
  },
  {
    id: 'A3', title: 'A3 · Those three + Remap controls', pick: false,
    what: 'A2 plus a REMAP CONTROLS row that opens the CONTROLS tab, whose rows become rebindable (Enter on a row, press the new key, swap on conflict, RESET TO DEFAULTS). Hidden on a touch-only phone until a keyboard or pad is used, so the phone frame equals A2.',
    cost: 'Largest: a rebindable key map in Input and SaveData (migration, conflict swap, reset), a new CONTROLS-tab state, hint strips that read the live map, plus its own test matrix. Pad layout stays fixed.',
    shots: [['desk-A3', 'A3 options at 1600x900', 'desk'], ['desk-A3-controls', 'A3 CONTROLS tab rebinding a key, 1600x900', 'desk'], ['phone-A3', 'A3 at 390x844 (remap hidden on touch)', 'phone']],
  },
];

const bopts = [
  {
    id: 'B1', title: 'B1 · Real 44 px page buttons', pick: true,
    what: 'The inert up/down marks become two 44 px buttons in the ITEMS header with a "1–6 OF 27" counter. Tapping moves the window one page without confirming; a dimmed button means no more that way.',
    cost: 'Small: the two buttons and a page step in CommandMenu (renderRows / computeMenuWindow), a Playwright tap test. Works for every long list, needs no gesture, and the header has the room (shown between ITEMS and GUIDE).',
    shots: [['phone-B1-a', 'B1 first page, up disabled', 'phone'], ['phone-B1-b', 'B1 last page (rows 22-27 with Poison Fang), down disabled', 'phone']],
  },
  {
    id: 'B2', title: 'B2 · Drag-scroll list with a scrollbar thumb', pick: false,
    what: 'Drag the grid up or down to scroll it; a slim gold thumb at the right edge shows where you are, with a small "5–10 OF 27 · DRAG LIST" label.',
    cost: 'Medium: pointer-drag handling that must not steal taps on rows, momentum and snap to rows, a thumb that follows the window, a hint the player may still miss. A 6 px thumb is not a touch target.',
    shots: [['phone-B2-a', 'B2 mid-list with the thumb and a finger', 'phone']],
  },
];

const card = (o) => `
<section class="opt${o.pick ? ' rec' : ''}" id="${o.id}">
  <h3>${o.title}${o.pick ? '<span class="tag">RECOMMENDED</span>' : ''}</h3>
  <p><b>What it is.</b> ${o.what}</p>
  <p><b>What it costs.</b> ${o.cost}</p>
  <div class="shots">${o.shots.map(([n, a, c]) => `<figure>${img(n, a, c)}<figcaption>${a}</figcaption></figure>`).join('')}</div>
</section>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Round 29 options</title>
<style>
:root{--bg:#0B0A12;--fg:#F4F1E8;--mut:#a8a3b4;--gold:#E3B94A;--line:#2a2736}
@media (prefers-color-scheme: light){:root{--bg:#F4F1E8;--fg:#0B0A12;--mut:#5a5466;--gold:#B8862A;--line:#d8d2c2}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif;padding:24px 16px 64px}
main{max-width:1100px;margin:0 auto}
h1{font-size:28px;margin:0 0 4px}h2{margin:40px 0 4px;border-top:1px solid var(--line);padding-top:24px}
h3{margin:0 0 8px;font-size:19px}
.lede,.note{color:var(--mut)}
.opt{border-left:4px solid var(--line);padding:4px 0 12px 16px;margin:28px 0}
.opt.rec{border-color:var(--gold)}
.tag{margin-left:10px;font-size:11px;letter-spacing:.12em;color:#0B0A12;background:var(--gold);padding:3px 7px;vertical-align:middle}
.shots{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start;margin-top:12px}
figure{margin:0}figcaption{font-size:13px;color:var(--mut);margin-top:4px;max-width:520px}
img{display:block;height:auto;border:1px solid var(--line)}
img.desk{width:min(100%,520px)}img.phone{width:min(100%,240px)}
@media (max-width:600px){img.desk{width:100%}}
</style></head><body><main>
<h1>Round 29 options for Bailey</h1>
<p class="lede">Two proposals from critic round 15 that change screens you see (AGENTS.md rules 9 and 10). Nothing here is built into the game. Frames are the live build with the proposed controls drawn in, in the approved Ink &amp; Gold chrome. Pick, mix, or say none.</p>

<h2>A · Accessibility rows in OPTIONS (PR-0032)</h2>
<p class="note">Game case: both (shared plumbing: pause screen, SaveData, both presenters). Frames are FFX Chapter I. Today's OPTIONS tab for comparison:</p>
<div class="shots"><figure>${img('desk-A0-today', 'Today, 1600x900', 'desk')}<figcaption>Today, 1600x900</figcaption></figure><figure>${img('phone-A0-today', 'Today, 390x844', 'phone')}<figcaption>Today, 390x844</figcaption></figure></div>
${options.map(card).join('')}
<p><b>Recommendation: A2.</b> Text size is the setting that most changes who can read the game (the HUD's smallest type is what the interface checks keep flagging), and A2 adds it for a bounded, already-scoped layout cost. A1 is a fine first step if you want it this week; A3's remapping is the biggest job and helps a smaller group, so it can follow.</p>

<h2>B · Paging long command lists on a phone (PR-0218, FFX only)</h2>
<p class="note">Game case: FFX only (the FFX command menu and its CTB HUD; FFX-2 has its own battle menu). Today, rows below the sixth are reachable only by an undiscoverable tap-then-Back ladder, and the ▼ mark is inert. Chapter IX Items has 27 rows; Fire Gem is row 19, Poison Fang row 23. Today:</p>
<div class="shots"><figure>${img('phone-B0-today', 'Today, 390x844, Items window', 'phone')}<figcaption>Today: 6 of 27 rows, a small inert ▼</figcaption></figure></div>
${bopts.map(card).join('')}
<p><b>Recommendation: B1.</b> It is the fix the critic asked for, it is discoverable at a glance, it gives a real touch target, and it needs no gesture logic that could fight with tapping a row.</p>
</main></body></html>`;
writeFileSync(dir + 'options.html', html);
console.log('bytes', html.length);
