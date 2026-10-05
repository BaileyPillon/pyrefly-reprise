// The suspects toggled one at a time on the SAME frozen frame of one session (live 38 or r39): the halo, the ring, the clip, the colour numbers.
//   node abtog.mjs --url <url> --chapter <id> --seed <n> --tag abtog38|abtog39 [--disk <public>] [--steps ...]
import { launch, ready, startChapter, freeze, sleep, mkdirSync, ROOT } from './lib.mjs';
import { figuresInPage, chainInPage, canvasPngInPage, setFiguresVisible } from './inpage.mjs';
import { installMods } from './mods.mjs';
import { analyzeFrame } from './report.mjs';

/** In-page, reversible: every toggle can be undone, so a step starts from `reset()`. */
function installToggles() {
  const api = window.__pyrefly; const r = api.app.renderer; const fx = api.fx;
  window.__ov = window.__ov || { grade: {}, bloom: {}, tilt: {}, fig: {} };
  const ov = window.__ov;
  if (!window.__ovWrapped) { // installMods wraps the composer; here we need the same wrapper if it was not installed
    window.__ovWrapped = true;
    const comp = r.composer; const orig = comp.render.bind(comp);
    comp.render = (dt) => {
      const o = window.__ov; const g = r.gradePass.uniforms;
      for (const [k, v] of Object.entries(o.grade)) { if (!g[k]) continue; if (Array.isArray(v)) g[k].value.set(...v); else g[k].value = v; }
      for (const [k, v] of Object.entries(o.bloom)) r.bloomPass[k] = v;
      if (Object.keys(o.fig).length) {
        const stage = api.app.current && api.app.current.stage;
        if (stage && stage.actors) for (const [, s] of stage.actors) for (const sl of s.actor.slots) { const u = sl.material.uniforms; for (const [k, v] of Object.entries(o.fig)) { if (!u[k]) continue; if (Array.isArray(v)) u[k].value.set(...v); else u[k].value = v; } }
      }
      return orig(dt);
    };
  }
  const g = r.gradePass.uniforms;
  const GR = ['lift', 'gain', 'gamma', 'saturation', 'vignette', 'grain', 'dither', 'shadowTintAmount', 'lookAmount'];
  const saved = {}; for (const k of GR) saved[k] = g[k] && g[k].value && g[k].value.clone ? g[k].value.clone() : g[k] ? g[k].value : undefined;
  saved.bloom = r.bloomPass.strength;
  const restoreGrade = () => { for (const k of GR) { if (!g[k]) continue; if (saved[k] && saved[k].copy) g[k].value.copy(saved[k]); else g[k].value = saved[k]; } };
  const T = {
    reset() { ov.grade = {}; ov.bloom = {}; ov.fig = {}; restoreGrade(); r.bloomPass.strength = saved.bloom; fx.sub('rim', true); fx.sub('look', true); fx.set('a', true); fx.set('b', true); fx.set('c', true); if (fx.mix) fx.mix.parts(['breathing', 'koCollapse']); },
    rim0() { fx.sub('rim', false); ov.fig.rimStrength = 0; },
    bloom0() { ov.bloom.strength = 0; },
    look0() { fx.sub('look', false); ov.grade.lookAmount = 0; },
    grade0() { Object.assign(ov.grade, { lift: [0, 0, 0], gain: [1, 1, 1], gamma: [1, 1, 1], saturation: 1, vignette: 0, grain: 0, dither: 0, shadowTintAmount: 0, lookAmount: 0 }); },
    gradeOnly0() { Object.assign(ov.grade, { lift: [0, 0, 0], gain: [1, 1, 1], gamma: [1, 1, 1], saturation: 1, shadowTintAmount: 0 }); }, // the palette's lift, gain, saturation and shadow tint, not the LUT or the vignette
    fxoff() { fx.set('a', false); fx.set('b', false); fx.set('c', false); },
    edges0() { if (fx.mix) fx.mix.parts(['breathing', 'koCollapse', 'smoothEdges']); },
    fog0() { if (fx.mix) fx.mix.parts(['breathing', 'koCollapse', 'fog']); },
    dof0() { if (fx.mix) fx.mix.parts(['breathing', 'koCollapse', 'depthOfField']); },
    pure() { this.grade0(); this.bloom0(); this.rim0(); this.fxoff(); },
    pure22() { this.pure(); ov.grade.gamma = [2.2, 2.2, 2.2]; },
  };
  window.__tg = T;
  return Object.keys(T);
}

const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const url = arg('--url'); const chapter = arg('--chapter', 'ffx2-leblanc'); const seed = Number(arg('--seed', '1'));
const tag = arg('--tag', 'abtog'); const disk = arg('--disk', null);
const steps = (arg('--steps', 't0,rim0,bloom0,look0,gradeOnly0,grade0,fxoff,edges0,fog0,dof0,pure,pure22')).split(',');
const out = `${ROOT}/runs/${tag}/${chapter}`;
const T0 = Date.now(); const note = (s) => console.log(`${((Date.now() - T0) / 1000).toFixed(1)}s ${s}`);
const { browser, ctx, page, errors } = await launch({ width: 2560, height: 1440 });
const frames = {}; let figs = null; let chain = null;
try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(page, seed);
  note(`first menu after ${await startChapter(page, chapter, seed)} ms`);
  await freeze(page, true);
  await page.evaluate(installMods, ['mix:breathing', 'mix:koCollapse']);
  await page.evaluate(installToggles);
  await sleep(900);
  chain = await page.evaluate(chainInPage);
  figs = await page.evaluate(figuresInPage);
  if (!figs.ok) throw new Error(figs.error);
  for (const s of steps) {
    await page.evaluate(() => window.__tg.reset());
    if (s !== 't0') await page.evaluate((n) => window.__tg[n](), s);
    await sleep(900);
    const canvasPng = Buffer.from((await page.evaluate(canvasPngInPage)).split(',')[1], 'base64');
    await page.evaluate(setFiguresVisible, false); await sleep(450);
    const emptyPng = Buffer.from((await page.evaluate(canvasPngInPage)).split(',')[1], 'base64');
    await page.evaluate(setFiguresVisible, true); await sleep(150);
    frames[s] = { canvasPng, emptyPng };
    note(`captured ${s}`);
  }
} catch (e) { note(`ERROR ${String(e).slice(0, 300)}`); errors.push(String(e)); }
await ctx.close(); await browser.close();
const cache = {};
for (const s of Object.keys(frames)) {
  const dir = `${out}/${s}`; mkdirSync(dir, { recursive: true });
  await analyzeFrame({ ...frames[s], figs, out: dir, meta: { url, chapter, variant: s, tag, chain: s === 't0' ? chain : undefined }, disk, origin: new URL(url).origin, cache });
}
console.log('done', Object.keys(frames).join(','), 'errors', JSON.stringify(errors.slice(0, 3)));
