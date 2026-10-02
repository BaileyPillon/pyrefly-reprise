// Natural width of candidate labels in the settings column's key style, at both sizes (the key cell is 163px at 1600x900, 150px on a phone).
import { mkdirSync, writeFileSync } from 'node:fs';
import { openBattle, openOptions, OUT } from './lib.mjs';
const LABELS = ['BATTLE SPECTACLE', 'LIVING PAINTINGS', 'DEPTH OF FIELD', 'CHAPTER FRAMING', 'SMOOTH EDGES', 'KO COLLAPSE', 'BREATHING', 'SPLASH ART', 'FOG',
  'OVERDRIVE HERO SHOT', 'OVERDRIVE SHOT', 'OVERDRIVE CAMERA', 'HERO SHOT', 'SPHERECHANGE SHOT', 'SPHERECHANGE', 'DRESSPHERE SHOT', 'CHANGE SHOT', 'SPHERE SHOT', 'ALL LOOKS', 'EYE CANDY', 'CUSTOMIZE'];
const out = {};
for (const size of ['desk', 'phone']) {
  const { browser, page } = await openBattle('ffx', size);
  await openOptions(page);
  out[size] = await page.evaluate((labels) => {
    const col = document.querySelector('.pause__col[data-col="settings"]');
    const probe = document.createElement('div');
    probe.className = 'pause__row pause__row--word';
    probe.style.cssText = 'position:absolute;visibility:hidden;height:auto';
    probe.innerHTML = '<span class="pause__k" style="width:auto;overflow:visible"></span>';
    col.appendChild(probe);
    const k = probe.querySelector('.pause__k');
    const real = document.querySelector('.pause__col[data-col="settings"] .pause__k');
    const cell = Math.round(real.getBoundingClientRect().width);
    const res = {};
    for (const l of labels) { k.textContent = l; res[l] = Math.round(k.getBoundingClientRect().width); }
    probe.remove();
    return { cell, res };
  }, LABELS);
  await browser.close();
}
mkdirSync(OUT, { recursive: true });
writeFileSync(OUT + 'measure.json', JSON.stringify(out, null, 1));
for (const s of Object.keys(out)) {
  console.log(s, 'key cell', out[s].cell, Object.entries(out[s].res).map(([l, w]) => `${l}=${w}${w > out[s].cell ? '!' : ''}`).join('  '));
}
