/**
 * Pure helpers for `tools/audio/elevenlabs.mjs`: prices and credits, the key, the safety gates, the catalogues
 * (the voice-line inventory, the design prompts in voice-casting.md, the music briefs), the usage log, the
 * request bodies and the audition page. Nothing here touches the network.
 *
 * Prices and limits were read from elevenlabs.io on 2026-10-07 (sources in docs/audio/elevenlabs-plan.md,
 * section "Cost"). They are an estimate for the local cap, not the bill: the server-side cap is the API key's own
 * credit limit, which Bailey sets when he makes the key.
 *
 * Game case: both. The tool is game-neutral; every line it voices carries its game from the inventory.
 */

import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
/** Outside the repo: the key, the usage log, the voice ids and every candidate. Never committed. */
export const HOME = path.resolve(process.env.ELEVENLABS_HOME ?? 'D:/Tools/elevenlabs');

export const PRICES = {
  checked: '2026-10-07',
  /** Dollars per 1,000 characters at the API list price (elevenlabs.io/pricing/api). */
  usdPer1kChars: { eleven_v4: 0.08, eleven_v4_turbo: 0.04, eleven_v3: 0.08, eleven_multilingual_v2: 0.08, eleven_flash_v2_5: 0.04, eleven_flash_v2: 0.04 },
  /** A promotion on the same page: v4 at 72 percent off until 2026-10-12. Not assumed anywhere. */
  promo: { eleven_v4: { usdPer1kChars: 0.022, until: '2026-10-12' }, eleven_v4_turbo: { usdPer1kChars: 0.011, until: '2026-10-12' } },
  usdPerMusicMinute: 0.15,
  /** Credits per character (docs/overview/models): half for the Flash and Turbo models. */
  creditMultiplier: { eleven_v4: 1, eleven_v4_turbo: 0.5, eleven_v3: 1, eleven_multilingual_v2: 1, eleven_flash_v2_5: 0.5, eleven_flash_v2: 0.5 },
  musicCreditsPerMinute: 900,
  /** Voice Design bills the preview text once per generation, not per voice (help center: how much does voice design cost). */
  designCreditsPerChar: 1,
  /** The cheapest plan that lists a commercial licence, and what each plan holds (elevenlabs.io/pricing; slots from the help center). */
  plans: [
    { name: 'Free', usd: 0, credits: 10000, voiceSlots: 3, commercial: false },
    { name: 'Starter', usd: 6, credits: 30000, voiceSlots: 10, commercial: true },
    { name: 'Creator', usd: 22, credits: 121000, voiceSlots: 30, commercial: true },
    { name: 'Pro', usd: 99, credits: 600000, voiceSlots: 160, commercial: true },
  ],
};

export const creditsForTts = (chars, model) => Math.ceil(chars * (PRICES.creditMultiplier[model] ?? 1));
export const creditsForMusic = (ms) => Math.ceil((ms / 60000) * PRICES.musicCreditsPerMinute);
export const creditsForDesign = (previewChars) => Math.ceil(previewChars * PRICES.designCreditsPerChar);
export const usdForTts = (chars, model) => (chars / 1000) * (PRICES.usdPer1kChars[model] ?? 0.08);
export const usdForMusic = (ms) => (ms / 60000) * PRICES.usdPerMusicMinute;
export const money = (n) => `$${n.toFixed(n < 1 ? 3 : 2)}`;
export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// ---------------------------------------------------------------------------
// The key and the safety gates
// ---------------------------------------------------------------------------

/** True when `child` is `parent` or below it (a different drive gives an absolute relative path: not inside). */
export function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}
/** True when `p` is inside the repo (the key and the candidates must never be). */
export const insideRepo = (p) => isInside(ROOT, path.resolve(p));
/** Output may not land under public/ (nothing here ships without Bailey's pick and the ship chain). */
export const underPublic = (p) => isInside(path.join(ROOT, 'public'), path.resolve(p));

/** The key from ELEVENLABS_API_KEY, else from key.txt beside the usage log. Returns null when there is none. Never prints it. */
export function loadKey(env = process.env, home = HOME) {
  if (env.ELEVENLABS_API_KEY?.trim()) return { key: env.ELEVENLABS_API_KEY.trim(), source: 'ELEVENLABS_API_KEY' };
  const file = path.join(home, 'key.txt');
  if (insideRepo(file)) throw new Error(`refusing a key file inside the repo: ${file}`);
  if (existsSync(file)) {
    const key = readFileSync(file, 'utf8').trim();
    if (key) return { key, source: file };
  }
  return null;
}

/** The API base. Only api.elevenlabs.io, or a loopback server for the tool's own tests: a key is never sent anywhere else. */
export function apiBase(env = process.env) {
  const base = env.ELEVENLABS_API_BASE?.replace(/\/+$/, '');
  if (!base) return 'https://api.elevenlabs.io';
  const host = new URL(base).hostname;
  if (host === '127.0.0.1' || host === 'localhost' || host === '[::1]') return base;
  throw new Error(`ELEVENLABS_API_BASE may only point at a loopback server (got ${host})`);
}

// ---------------------------------------------------------------------------
// Catalogues
// ---------------------------------------------------------------------------

export function loadInventory(root = ROOT) {
  const doc = JSON.parse(readFileSync(path.join(root, 'docs/audio/voice-line-inventory.json'), 'utf8'));
  return { doc, byId: new Map(doc.lines.map((l) => [l.id, l])) };
}

/** Fenced blocks tagged `<kind> <id>` in a markdown file: "```design tidus" ... "```" gives id -> body. */
export function loadFenced(file, kind) {
  const out = new Map();
  if (!existsSync(file)) return out;
  const re = new RegExp(`^\`\`\`${kind} (\\S+)\\r?\\n([\\s\\S]*?)\\r?\\n\`\`\``, 'gm');
  for (const m of readFileSync(file, 'utf8').matchAll(re)) out.set(m[1], m[2].trim());
  return out;
}

/** The pilot scenes (docs/audio/elevenlabs-plan.md): which script parts, and which speakers get three options. */
export const SCENES = {
  'pilot-a': { game: 'ffx', parts: [['seymour-flux', 'pre'], ['seymour-flux', 'post']], optioned: ['seymour', 'tidus', 'yuna', 'lulu', 'auron', 'wakka', 'kimahri'] },
  'pilot-b': { game: 'ffx2', parts: [['ffx2-leblanc', 'pre']], optioned: ['rikku-x2', 'paine', 'yuna-x2', 'leblanc', 'logos', 'ormi', 'brother'] },
};

/** Voiced primary lines of a scene, in play order. */
export function sceneLines(inv, name) {
  const scene = SCENES[name];
  if (!scene) throw new Error(`unknown scene "${name}" (have ${Object.keys(SCENES).join(', ')})`);
  return scene.parts.flatMap(([chapter, part]) => inv.doc.lines.filter((l) => l.chapter === chapter && l.part === part && l.voiced === 'yes' && l.kind !== 'fallback'));
}

/** Preview text for Voice Design (100 to 1000 characters): the voice's own scene lines, topped up from its other lines. */
export function previewTextFor(inv, voice, preferredIds = []) {
  const own = inv.doc.lines.filter((l) => l.voice === voice && l.voiced === 'yes' && l.kind !== 'fallback' && !l.treatment);
  const ordered = [...preferredIds.map((id) => inv.byId.get(id)).filter((l) => l && l.voice === voice), ...own.filter((l) => !preferredIds.includes(l.id)).sort((a, b) => b.chars - a.chars)];
  let text = '';
  for (const l of ordered) {
    const next = text ? `${text} ${l.text}` : l.text;
    if (next.length > 1000) break;
    text = next;
    if (text.length >= 250) break;
  }
  return text;
}

// ---------------------------------------------------------------------------
// Design rounds. Round 1 is the first set of previews; a later round redesigns the voices that were not picked, in a folder of its
// own, with previews that open with the speaker's comparison line so the three can be heard against the real clip.
// ---------------------------------------------------------------------------

/** Where a design round lands under <out>: design (round 1), design-r2, design-r3... A later round never writes into an earlier one's folder. */
export const designDir = (round) => (round <= 1 ? 'design' : `design-r${round}`);
/** The key a saved voice is kept under in voices.json and picks.json: A, B, C for round 1; r2A, r2B, r2C for round 2, so saving a later pick never replaces an earlier one. */
export const saveKey = (round, option) => (round <= 1 ? option : `r${round}${option}`);

/** True when `p` or any folder above it holds a .git entry (the comparison lines stay out of every repo, not only this one). */
export function inGitRepo(p) {
  for (let dir = path.resolve(p); ; dir = path.dirname(dir)) {
    if (existsSync(path.join(dir, '.git'))) return true;
    if (path.dirname(dir) === dir) return false;
  }
}

/**
 * The comparison lines a voice is judged against, by speaker: { speaker, line, videoId, t, verified }. The file is a private comparison
 * kept in the candidates folder (outside every repo). It is read when a command runs and never copied into a repo, a doc or a game file.
 */
export function loadCompareLines(file) {
  const p = path.resolve(file);
  if (insideRepo(p) || inGitRepo(p)) throw new Error(`the comparison lines are a private comparison and never go in a repo (got ${p})`);
  if (!existsSync(p)) throw new Error(`no comparison lines at ${p} (pass --compare-lines <file>, or --out <the candidates folder that holds compare-lines.json>)`);
  const rows = JSON.parse(readFileSync(p, 'utf8'));
  if (!Array.isArray(rows)) throw new Error(`${p} must be an array of { speaker, line, videoId, t }`);
  const bySpeaker = new Map();
  for (const row of rows) {
    if (typeof row?.speaker !== 'string' || typeof row.line !== 'string' || !row.line.trim()) throw new Error(`${p}: every entry needs a "speaker" and a non-empty "line"`);
    bySpeaker.set(row.speaker, row);
  }
  return bySpeaker;
}

/** The real-game clip of a comparison entry, checked before it goes into a page address: an 11-character video id and a whole second. Null when it has none. */
export function clipOf(entry) {
  if (!entry || !/^[A-Za-z0-9_-]{11}$/.test(entry.videoId ?? '') || !Number.isInteger(entry.t) || entry.t < 0) return null;
  return { videoId: entry.videoId, t: entry.t, note: entry.verified === true ? 'verified from subtitle' : 'not verified' };
}

/** The lines named in a "preview-rN <voice>" block (ids, split on spaces or commas): this voice's own plain voiced lines in our inventory, never anything else. */
export function padLinesFor(inv, voice, block) {
  return String(block ?? '').split(/[\s,]+/).filter(Boolean).map((id) => {
    const line = inv.byId.get(id);
    if (!line) throw new Error(`${voice}: pad line "${id}" is not in docs/audio/voice-line-inventory.json`);
    if (line.voice !== voice) throw new Error(`${voice}: pad line "${id}" is ${line.voice}'s, not ${voice}'s`);
    if (line.voiced !== 'yes' || line.kind === 'fallback' || line.treatment) throw new Error(`${voice}: pad line "${id}" is not a plain voiced line`);
    return line;
  });
}

/** A later round's preview text: the comparison line first, then our own pad lines (the service wants 100 to 1000 characters and the comparison lines are shorter). */
export const comparePreviewText = (entry, padLines) => [entry.line.trim(), ...padLines.map((l) => l.text)].join(' ');

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

/** Delivery words for models that take audio tags (v3, v4). The script's `emotion` field is the only source. */
const EMOTION_TAGS = { sad: '[sadly]', angry: '[angrily]', surprised: '[surprised]', determined: '[firmly]', pained: '[pained]', smug: '[smugly]', happy: '[cheerfully]' };
export const TAG_MODELS = new Set(['eleven_v3', 'eleven_v4', 'eleven_v4_turbo']);

export function buildTtsBody(line, { model, settings = {}, tags = false, seed, previous, next }) {
  const text = tags && TAG_MODELS.has(model) && EMOTION_TAGS[line.emotion] ? `${EMOTION_TAGS[line.emotion]} ${line.text}` : line.text;
  // v4 has no Style or Speed (docs: Eleven v4); the older models do.
  const voice_settings = model.startsWith('eleven_v4') ? { stability: settings.stability ?? 0.5, similarity_boost: settings.similarity ?? 0.75 }
    : { stability: settings.stability ?? 0.5, similarity_boost: settings.similarity ?? 0.75, style: settings.style ?? 0, speed: settings.speed ?? 1, use_speaker_boost: true };
  return { text, chars: [...text].length, body: { text, model_id: model, language_code: 'en', voice_settings, apply_text_normalization: 'auto', ...(seed !== undefined ? { seed } : {}), ...(previous ? { previous_text: previous } : {}), ...(next ? { next_text: next } : {}) } };
}

/** Names and phrases a voice description or a music prompt must never contain: the franchise, its people and places, a composer, or "like <someone>". */
const BANNED = /\b(?:final fantasy|square enix|ffx|spira|yevon|zanarkand|bevelle|gagazet|macalania|ronso|fayth|blitzball|gullwings|tidus|yunalesca|yuna|auron|wakka|lulu|kimahri|rikku|seymour|jecht|braska|isaaru|shuyin|lenne|nooj|baralai|gippal|trema|paine|leblanc|ormi|shinra|uematsu|sounds? like|in the style of|in the manner of|impression of|imitat\w*|clon(?:e|es|ed|ing))\b/i;
export const bannedIn = (text) => BANNED.exec(text)?.[0] ?? null;

/** A voice is never designed to sound like a minor (the service keeps child-sounding voices out of its library): no child words, no age under 18. */
export function minorIn(description) {
  const word = /\b(child|children|kid|kids|boy|girl|minor|toddler|infant|teen|teens|teenage|teenager|adolescent|juvenile)\b/i.exec(description)?.[0];
  if (word) return word;
  const young = [...description.matchAll(/\b(\d{1,2})\b/g)].map((m) => Number(m[1])).find((n) => n >= 1 && n < 18);
  return young === undefined ? null : `age ${young}`;
}

export function validateDesign(description, text) {
  const problems = [];
  const minor = minorIn(description);
  if (minor) problems.push(`the description names a minor ("${minor}"): cast a youthful adult, 18 or over`);
  const hit = bannedIn(description);
  if (hit) problems.push(`the description contains "${hit}": describe the voice, never who it resembles`);
  if (description.length < 20 || description.length > 1000) problems.push(`voice_description is ${description.length} characters (20 to 1000)`);
  if (text.length < 100 || text.length > 1000) problems.push(`preview text is ${text.length} characters (100 to 1000)`);
  return problems;
}

// ---------------------------------------------------------------------------
// The usage log (D:/Tools/elevenlabs/usage.jsonl): one line per real call
// ---------------------------------------------------------------------------

export function appendUsage(entry, home = HOME) {
  mkdirSync(home, { recursive: true });
  appendFileSync(path.join(home, 'usage.jsonl'), `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
}

export function readUsage(home = HOME) {
  const file = path.join(home, 'usage.jsonl');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

// ---------------------------------------------------------------------------
// The audition page: a static page over a candidates folder, in the style of docs/audio/audition.html
// ---------------------------------------------------------------------------

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** m:ss for the second a clip starts at. */
const stamp = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
/** The real-game clip beside a row, in the embed style of voices-vs-ffx.html: youtube-nocookie starting a second early and ending seven seconds on, and a link to the video. */
const clipBlock = (c) => `<div class="real"><div class="lab">REAL FFX</div><iframe width="256" height="144" src="https://www.youtube-nocookie.com/embed/${esc(c.videoId)}?start=${Math.max(0, c.t - 1)}&amp;end=${c.t + 7}&amp;rel=0&amp;modestbranding=1&amp;playsinline=1" title="real FFX line" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><br><a target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${esc(c.videoId)}&amp;t=${c.t}s">&#9654; open at ${stamp(c.t)}</a><div class="src"> &middot; ${esc(c.note)}</div></div>`;
/** Extra rules for a page that has a section heading or a real-game clip; a page with neither is written exactly as before. */
const CLIP_CSS = 'h2{margin:1.4em 0 .2em}.cols{display:grid;grid-template-columns:272px 1fr;gap:18px}@media(max-width:700px){.cols{grid-template-columns:1fr}}.lab{font-size:11px;letter-spacing:.08em;color:#9aa0ad;margin-bottom:6px}.real a{display:inline-block;background:#c9a24a;color:#14121b;padding:8px 12px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:6px}.src{font-size:12px;color:#9aa0ad;margin-top:6px}';

/**
 * `groups`: [{ id, title, note, options: [{ label, file, caption }] }] is a row to pick one from (a radio group per row);
 * the same with `clip: { videoId, t, note }` puts the real-game clip beside the options (see `clipOf`);
 * [{ id, title, note, scene: [{ speaker, text, file }] }] is a read-through with a button that plays it in order;
 * [{ heading, note }] is a section heading (a design round).
 * "Collect my picks" fills a textarea, as the other sections of docs/audio/audition.html do.
 */
export function auditionHtml(title, groups) {
  const pickRow = (g) => `${g.options.map((o) => `<label class="opt"><input type="radio" name="${esc(g.id)}" value="${esc(o.label)}"><strong>${esc(o.label)}</strong> <audio controls preload="none" src="${esc(o.file)}"></audio> <span>${esc(o.caption ?? '')}</span></label>`).join('')}<label class="opt"><input type="radio" name="${esc(g.id)}" value="none"> none of these (say why in chat)</label>`;
  const sceneRow = (g) => `<button type="button" class="play">Play the scene in order</button><ol>${g.scene.map((l) => `<li><strong>${esc(l.speaker)}</strong> ${esc(l.text)} <audio controls preload="none" src="${esc(l.file)}"></audio></li>`).join('')}</ol>`;
  const pickBody = (g) => (g.clip ? `<div class="cols">${clipBlock(g.clip)}<div class="ours">${pickRow(g)}</div></div>` : pickRow(g));
  const rows = groups.map((g) => (g.heading ? `<h2>${esc(g.heading)}</h2><p>${esc(g.note ?? '')}</p>` : `<section><h3>${esc(g.title)}</h3><p>${esc(g.note ?? '')}</p>${g.scene ? sceneRow(g) : pickBody(g)}</section>`)).join('\n');
  const extraCss = groups.some((g) => g.clip || g.heading) ? CLIP_CSS : '';
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:860px;margin:2rem auto;padding:0 16px;background:#14121b;color:#eee8d8}section{border:1px solid #ffffff22;border-radius:8px;padding:12px 16px;margin:14px 0}h3{margin:.2em 0}.opt{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:6px 0}audio{height:34px}button{font:inherit;padding:8px 16px;background:#c9a24a;color:#14121b;border:0;border-radius:6px;cursor:pointer}textarea{width:100%;font:12px ui-monospace,monospace;background:#0d0c13;color:#eee8d8;border:1px solid #ffffff33;border-radius:6px;padding:8px}${extraCss}</style>
<h1>${esc(title)}</h1><p>Candidates only: nothing here is in the game. Listen, pick one per row, then press the button and paste the result into chat. Agents cannot hear; only your ear counts.</p>
${rows}
<p><button type="button" id="collect">Collect my picks</button></p><textarea id="out" rows="8" readonly></textarea>
<script>document.getElementById('collect').onclick=function(){var o={};document.querySelectorAll('input[type=radio]:checked').forEach(function(r){o[r.name]=r.value});document.getElementById('out').value=JSON.stringify(o,null,1)};
document.querySelectorAll('.play').forEach(function(b){b.onclick=function(){var a=[].slice.call(b.parentNode.querySelectorAll('audio')),i=0;(function next(){if(i<a.length){var x=a[i++];x.onended=next;x.play()}})()}})</script></html>`;
}
