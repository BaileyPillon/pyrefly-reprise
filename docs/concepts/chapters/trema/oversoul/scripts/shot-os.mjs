// Real 1600x900 battle frames with the installed candidates drawn BY THE ENGINE: Chapter IV (ffx2-bahamut) staging at
// its first command menu; Playwright request interception serves the Cloister 100 plate in place of
// bevelle-underground and the chosen candidate pose in place of the boss's files; the Chapter XIII line-up dresspheres
// in place of Chapter IV's. The boss actor can be scaled to the chapter's size. Writes <out>-full.png (HUD) and
// <out>-clean.png (HUD off). Usage:
//   node shot2.mjs <out> --boss <subject>/<pose> [--bossScale k] [--name A=B ...] [--hideEnemy] [--wait ms]
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const ART = 'D:/Final Fantasy/public/art/';
const [out, ...rest] = process.argv.slice(2);
let boss = null, bossScale = 1, hideEnemy = false, waitMs = 12000; const names = [];
let castGain = 1.6, tex = null, cast = 0, castColor = '#6fa8ff', rim = 0, rimColor = '#8cc8ff', motes = 0;
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--boss') boss = rest[++i];
  else if (rest[i] === '--bossScale') bossScale = Number(rest[++i]);
  else if (rest[i] === '--name') { const [k, v] = rest[++i].split('='); names.push([k, v]); }
  else if (rest[i] === '--hideEnemy') hideEnemy = true;
  else if (rest[i] === '--wait') waitMs = Number(rest[++i]);
  else if (rest[i] === '--tex') tex = rest[++i];
  else if (rest[i] === '--castGain') castGain = Number(rest[++i]);
  else if (rest[i] === '--cast') cast = Number(rest[++i]);
  else if (rest[i] === '--castColor') castColor = rest[++i];
  else if (rest[i] === '--rim') rim = Number(rest[++i]);
  else if (rest[i] === '--rimColor') rimColor = rest[++i];
  else if (rest[i] === '--motes') motes = Number(rest[++i]);
}
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('PAGEERR', e.message));
const served = [];
const swap = async (from, to, fixedPose) => page.route(u => u.href.includes(`/characters/${from}/`), r => {
  const url = r.request().url().split('?')[0]; const isJson = url.endsWith('.json');
  const pose = fixedPose ?? 'idle';
  const file = (!isJson && tex && from === 'ffx2-bahamut') ? tex : ART + 'characters/' + to + '/' + pose + (isJson ? '.json' : '.png');
  served.push(url.split('/').slice(-2).join('/') + ' <- ' + to + '/' + pose + (isJson ? '.json' : '.png'));
  r.fulfill({ status: 200, contentType: isJson ? 'application/json' : 'image/png', body: readFileSync(file) });
});
await swap('yuna-white-mage', 'yuna-dark-knight'); await swap('rikku-dark-knight', 'rikku-alchemist'); await swap('paine-warrior', 'paine-dark-knight');
if (boss) { const [subj, pose] = boss.split('/'); await swap('ffx2-bahamut', subj, pose); }
await page.route(u => u.href.includes('backdrops/bevelle-underground.png'), r => { served.push('bevelle-underground.png <- via-infinito.png'); r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(ART + 'backdrops/via-infinito.png') }); });
await page.goto('http://127.0.0.1:5890/', { waitUntil: 'commit', timeout: 150000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 150000 });
await page.evaluate(async () => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.gotoChapter('ffx2-bahamut', { skipCutscenes: true }); await p.waitForScreen('battle', 60000); });
await page.waitForTimeout(waitMs);
await page.keyboard.press('Enter'); await page.waitForTimeout(700);
await page.keyboard.press('g'); await page.waitForTimeout(300);
await page.keyboard.press('e'); await page.waitForTimeout(400);
await page.keyboard.press('n'); await page.waitForTimeout(400);
if (names.length) await page.evaluate((names) => {
  const apply = () => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.__rn === n.nodeValue) continue; let v = n.nodeValue; for (const [a, b] of names) { if (a.startsWith('^')) { if (v.trim() === a.slice(1)) v = v.replace(a.slice(1), b); } else if (v.includes(a)) v = v.split(a).join(b); } if (v !== n.nodeValue) n.nodeValue = v; n.__rn = v; } };
  apply(); window.__rnObs = new MutationObserver(() => { window.__rnObs.disconnect(); apply(); window.__rnObs.observe(document.body, { subtree: true, childList: true, characterData: true }); }); window.__rnObs.observe(document.body, { subtree: true, childList: true, characterData: true });
}, names);
const info = await page.evaluate(async ({ bossScale, hideEnemy }) => {
  const p = window.__pyrefly; const b = p.battle();
  const cam = b.scene.battleCamera.isCamera ? b.scene.battleCamera : b.scene.battleCamera.camera;
  const res = {};
  for (const [k, e] of b.stage.actors.entries()) {
    const a = e.actor;
    if (e.side === 'enemy') { if (hideEnemy) a.visible = false; else if (bossScale !== 1) a.scale.multiplyScalar(bossScale); }
    a.updateMatrixWorld(true);
    const base = a.position.clone(); a.parent && a.parent.localToWorld(base);
    const top = base.clone(); top.y += a.worldHeight * (e.side === 'enemy' ? bossScale : 1);
    const pr = (v) => { const q = v.clone().project(cam); return [Math.round((q.x + 1) / 2 * innerWidth), Math.round((1 - q.y) / 2 * innerHeight)]; };
    res[k] = { side: e.side, wh: a.worldHeight, base: pr(base), top: pr(top) };
  }
  await p.frames(8); return res;
}, { bossScale, hideEnemy });
const treat = await page.evaluate(async ({ cast, castColor, castGain, rim, rimColor, motes }) => {
  const THREE = await import('/node_modules/.vite/deps/three.js').catch(() => null);
  const { ParticleField, ParticlePresets } = await import('/src/engine/Particles.ts');
  const p = window.__pyrefly; const b = p.battle(); const log = [];
  for (const [k, e] of b.stage.actors.entries()) {
    if (e.side !== 'enemy') continue; const a = e.actor;
    // (1) the proposed shader term, injected at runtime into this actor's own materials (src/ is not edited):
    //     c = mix(c, luma(c) * castColor * 1.6, castAmount), placed just before the quiet dim.
    const mats = new Set(); a.traverse(o => { if (o.material && o.material.uniforms && 'desaturate' in o.material.uniforms) mats.add(o.material); });
    for (const m of mats) {
      if (cast > 0) {
        const col = m.uniforms.tint.value.clone().set(castColor);
        m.uniforms.castColor = { value: col }; m.uniforms.castAmount = { value: cast };
        m.fragmentShader = m.fragmentShader.replace('uniform float desaturate;', 'uniform float desaturate;\n  uniform vec3 castColor;\n  uniform float castAmount;')
          .replace('// --- the quiet dim', ('// --- Oversoul blue cast (proposal)\n    { float lc = dot(c, vec3(0.2126, 0.7152, 0.0722)); c = mix(c, clamp(pow(lc, 0.85) * castColor * CASTGAIN, 0.0, 1.0), clamp(castAmount, 0.0, 1.0)); }\n    // --- the quiet dim').replace('CASTGAIN', castGain.toFixed(3)));
        m.needsUpdate = true;
      }
      if (rim > 0) { m.uniforms.rimColor.value.set(rimColor); m.uniforms.rimStrength.value = rim; }
    }
    log.push({ k, mats: mats.size, injected: [...mats].every(m => !cast || m.fragmentShader.includes('castAmount')) });
    if (motes > 0) {
      a.updateMatrixWorld(true); const base = a.position.clone(); a.parent && a.parent.localToWorld(base);
      let root = a; while (root.parent) root = root.parent;
      const f = new ParticleField(ParticlePresets.pyreflies({ count: motes, bounds: { x: 3.3, y: 2.4, z: 1.2 },
        colors: [0x4f9dff, 0x7cc4ff, 0xbfe4ff, 0x2f6dff, 0xffffff], size: 26, drift: [0, 0.5, 0], wobble: [0.35, 0.18, 0.25] }));
      f.position.set(base.x, base.y + 2.2, base.z + 0.3); root.add(f); f.update(3.7);
      log.push({ motes, at: [base.x, base.y, base.z] });
    }
  }
  await p.frames(12); return log;
}, { cast, castColor, castGain, rim, rimColor, motes });
console.log('treat', JSON.stringify(treat));
await page.waitForTimeout(600);
await page.screenshot({ path: out + '-full.png' });
await page.evaluate(async () => { const p = window.__pyrefly; p.trigger('hud:off'); await p.frames(10); });
await page.waitForTimeout(500);
await page.screenshot({ path: out + '-clean.png' });
writeFileSync(out + '.json', JSON.stringify({ info, served: [...new Set(served)] }, null, 1));
console.log(JSON.stringify(info)); console.log([...new Set(served)].join('\n'));
await browser.close();
