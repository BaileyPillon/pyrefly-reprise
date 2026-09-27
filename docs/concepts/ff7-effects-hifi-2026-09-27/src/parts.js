// FF7 effects hi-fi options (2026-09-27): the sheet parts. FF7 ONLY: nothing here applies to FFX or FFX-2.
import { load, canvas, crop } from '../../ff7-options-2026-09-27/src/base.js';
import { MOMENTS, frame } from './fx.js';

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
function panel(parent, src, r, cap, Wd = 1024) {
  const [x0, y0, x1, y1] = r ?? [0, 0, src.width, src.height];
  const c = canvas(Wd, Math.round((Wd * (y1 - y0)) / (x1 - x0))); crop(c, src, [x0, y0, x1, y1]);
  const f = el('figure'); f.append(c); if (cap) f.append(el('figcaption', null, cap)); parent.append(f); return f;
}
function opt(parent, title, lines, rec) {
  const d = el('div', 'opt' + (rec ? ' rec' : '')); d.append(el('h3', null, title + (rec ? '<span class="tag">RECOMMENDED</span>' : '')));
  for (const l of lines) d.append(el('p', null, l)); parent.append(d); return d;
}
function head(root, t, s) { root.append(el('h1', null, t)); root.append(el('div', 'sub', s)); }
const GAME = 'FF7 only (rule 14): the hidden Guard Scorpion fight, sides switched (party left facing right, boss right facing left). Nothing here changes FFX or FFX-2. Figures are placeholders: the new right-facing paintings are owed and no painting is ever mirrored.';

const T = {
  plus: ['1 · A3 plus: hard light, cast glow', [
    '<span>Reads:</span> FF7’s own vocabulary (flat polygon beams, jagged bolts, faceted bursts) with a glow pass, bloom, and the effect’s colour thrown onto the fighters (a rim on the side that faces it), a pool on the floor and a shadow away from it.',
    '<span>Eye candy:</span> moderate. Crisp and clean; the light on the fighters is what lifts it past 1997.',
    '<span>Cost:</span> the A1 registry plus a bloom pass and one light per effect. Cheapest of the three; light on a phone.']],
  spectacle: ['2 · Spectacle: particles, sparks, haze, shake', [
    '<span>Reads:</span> the same shapes buried in layered shader particles (the method of the house spell-FX option B you liked), hot sparks, embers, anamorphic flare streaks, heat haze, a short camera shake on hits, heavy bloom and one flash frame on the big hits. The lock-on stays calm: no flash, no shake.',
    '<span>Eye candy:</span> the most by far; this is “higher fidelity than the original”.',
    '<span>Reduced motion / Reduce flashes:</span> the calm version drops shake, haze and the flash frame and thins the particles to 40 % (part 6).',
    '<span>Cost:</span> spell-FX B’s particle system plus a post pass (bloom, haze, shake). The heaviest; on a phone it needs the particle cap spell-FX B already has.']],
  cel: ['3 · Cel light: ink and flat colour', [
    '<span>Reads:</span> anime-style effects: flat stepped colour bands with a hard ink edge, speed lines, a stepped burst, and hard-edged cel light on the fighters (a flat rim band, a two-step floor pool, a crisp shadow). No bloom.',
    '<span>Eye candy:</span> bold and graphic rather than glowing. Best if the new paintings go cel-lit; odd next to soft painted light.',
    '<span>Cost:</span> about A1’s cost; flat fills are cheap on a phone. Its look depends on the art round’s pick.']],
};
const ORDER = ['laser', 'bolt', 'braver', 'scope'];

async function partOverview(root) {
  head(root, 'FF7 effects, higher fidelity · three treatments', `${GAME} Each frame is the key moment, drawn once, headless, over our backdrop and the real fight’s FF7 band.`);
  for (const t of ['plus', 'spectacle', 'cel']) panel(root, frame('laser', t), [0, 0, 1600, 636], `<b>${T[t][0]}</b> · Tail Laser`);
  const tb = el('table'); tb.innerHTML = `<tr><th>Option</th><th>Eye candy</th><th>Fits FF7’s shapes</th><th>Phone cost</th></tr>
    <tr><td>1 · A3 plus</td><td>moderate</td><td>closest</td><td>low</td></tr>
    <tr><td>2 · Spectacle</td><td>most</td><td>same shapes, dressed up</td><td>high (particle cap)</td></tr>
    <tr><td>3 · Cel light</td><td>bold, graphic</td><td>restyled</td><td>low</td></tr>`;
  root.append(el('h2', null, 'Compare')); root.append(tb);
  opt(root, 'Recommendation: 2 · Spectacle, on top of 1', ['You asked for “tons of eye candy”, higher fidelity than the original: 2 is the only one that clearly delivers it, and it grows out of the spell-FX option B method you already liked. Build it as 1 (FF7’s shapes, glow, cast light) plus the particle, spark, haze, shake and flash layers, so the calm reduced-motion version is simply 1 with a few particles. Pick 3 only if the art round goes cel-lit.', 'A pick approves only what you name (for example “2, but no shake”).'], true);
}
async function partMoments(root, t, ids, n) {
  head(root, `${T[t][0]} · ${n}`, GAME);
  for (const id of ids) panel(root, frame(id, t), null, MOMENTS[id].cap);
  opt(root, T[t][0], T[t][1], t === 'spectacle');
}
async function partFlash(root) {
  head(root, '2 · Spectacle · flash frames and the calm version', `${GAME} The flash is one frame (about 17 ms) on the two big hits, never repeated. Reduced motion or Reduce flashes shows the calm version: no shake, no haze, no flash, particles at 40 %.`);
  const g = el('div', 'grid'); root.append(g);
  panel(g, frame('laser', 'spectacle', { flash: true }), null, '<b>Flash frame</b> · Tail Laser hit', 502);
  panel(g, frame('braver', 'spectacle', { flash: true }), null, '<b>Flash frame</b> · Braver hit', 502);
  for (const id of ORDER) panel(g, frame(id, 'spectacle', { reduced: true }), null, `<b>Calm</b> · ${MOMENTS[id].name}`, 502);
}

export async function build(n, root) {
  await load();
  if (n === 1) return partOverview(root);
  if (n === 2) return partMoments(root, 'plus', ['laser', 'bolt'], 'Tail Laser, Bolt');
  if (n === 3) return partMoments(root, 'plus', ['braver', 'scope'], 'Braver, Search Scope');
  if (n === 4) return partMoments(root, 'spectacle', ['laser', 'bolt'], 'Tail Laser, Bolt');
  if (n === 5) return partMoments(root, 'spectacle', ['braver', 'scope'], 'Braver, Search Scope');
  if (n === 6) return partFlash(root);
  if (n === 7) return partMoments(root, 'cel', ['laser', 'bolt'], 'Tail Laser, Bolt');
  if (n === 8) return partMoments(root, 'cel', ['braver', 'scope'], 'Braver, Search Scope');
}
