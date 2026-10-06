// Every option on the same frozen frame of one session (the camera drift, the haze and the lamps cannot differ between options).
//   node ab.mjs --url <url> --chapter <id> --seed <n> --tag ab [--disk <public>] [--steps t0,t1,...]
import { launch, ready, startChapter, freeze, sleep, mkdirSync, writeJson, ROOT } from './lib.mjs';
import { figuresInPage, chainInPage, canvasPngInPage, setFiguresVisible } from './inpage.mjs';
import { installMods } from './mods.mjs';
import { installOpts3 } from './opts3-inpage.mjs';
import { analyzeFrame } from './report.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const url = arg('--url', 'http://127.0.0.1:6931/?coach=off');
const chapter = arg('--chapter', 'ffx2-leblanc');
const seed = Number(arg('--seed', '1'));
const tag = arg('--tag', 'ab');
const disk = arg('--disk', null);
const only = arg('--steps', '').split(',').filter(Boolean);
const STEPS = {
  t0: { label: 'today', ops: [] },
  tf: { label: 'figures true (the switch, on)', ops: [['figures', 1]] },
  tw: { label: 'whole frame true (the sRGB encode at the end of the chain)', ops: [['whole', true]] },
};
const order = (only.length ? only : Object.keys(STEPS));
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
  console.log('switch present', await page.evaluate(installOpts3));
  await sleep(900);
  chain = await page.evaluate(chainInPage);
  figs = await page.evaluate(figuresInPage);
  if (!figs.ok) throw new Error(figs.error);
  for (const name of order) {
    const st = STEPS[name];
    await page.evaluate(() => window.__o3.reset());
    for (const [op, a] of st.ops) await page.evaluate(([o, x]) => window.__o3[o](x), [op, a]);
    await sleep(900);
    const canvasPng = Buffer.from((await page.evaluate(canvasPngInPage)).split(',')[1], 'base64');
    await page.evaluate(setFiguresVisible, false); await sleep(450);
    const emptyPng = Buffer.from((await page.evaluate(canvasPngInPage)).split(',')[1], 'base64');
    await page.evaluate(setFiguresVisible, true); await sleep(150);
    frames[name] = { canvasPng, emptyPng };
    note(`captured ${name}`);
  }
} catch (e) { note(`ERROR ${String(e).slice(0, 300)}`); errors.push(String(e)); }
await ctx.close(); await browser.close();

const cache = {};
for (const name of Object.keys(frames)) {
  const dir = `${out}/${name}`; mkdirSync(dir, { recursive: true });
  const res = await analyzeFrame({ ...frames[name], figs, out: dir, meta: { url, chapter, variant: name, label: STEPS[name].label, tag, chain: name === 't0' ? chain : undefined }, disk, origin: new URL(url).origin, cache });
  const fmt = (e) => (e.error ? `${e.id}: ${e.error}` : `${e.id.padEnd(14)} dE00 ${String(e.de00?.median).padStart(5)}  C* ${String(e.render?.chroma).padStart(5)}/${e.source?.chroma}  L ${String(e.render?.meanL).padStart(5)}/${e.source?.meanL}  p2 ${e.render?.p2}  clip ${e.clip?.renderMax250}/${e.clip?.sourceMax250}  halo ${e.halo?.excess}  ring ${e.ring?.meanAddedL}`);
  console.log(`== ${chapter} ${name} (${STEPS[name].label})`);
  for (const e of res.figures) console.log('  ' + fmt(e));
}
console.log('errors', JSON.stringify(errors.slice(0, 4)));
