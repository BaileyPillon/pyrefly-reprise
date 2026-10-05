// Contact sheets: render a grid of local images with captions through headless Chromium and save one JPEG.
//   import { sheet } from './sheet.mjs'; await sheet({ out, title, cols, cellW, items: [{ file, label }] })
import fs from 'node:fs';
import { chromium } from 'file:///D:/pyrefly-r39-judg/node_modules/playwright/index.mjs';

export async function sheet({ out, title, cols = 2, cellW = 800, items, note = '' }) {
  const rows = Math.ceil(items.length / cols);
  const b64 = (f) => `data:image/${f.endsWith('.png') ? 'png' : 'jpeg'};base64,${fs.readFileSync(f).toString('base64')}`;
  const cells = items.map((it) => `<figure><img src="${b64(it.file)}" style="width:${cellW}px"><figcaption>${it.label}</figcaption></figure>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#101018;color:#e8e4d8;font:15px/1.35 'Segoe UI',Arial,sans-serif;padding:18px}
    h1{font-size:19px;margin:0 0 4px;font-weight:600} p{margin:0 0 14px;color:#a8a4b8}
    .grid{display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:16px}
    figure{margin:0} figcaption{margin-top:5px;font-size:14px;color:#cfc9b8} img{display:block;border:1px solid #2c2c3c}
  </style><h1>${title}</h1>${note ? `<p>${note}</p>` : ''}<div class="grid">${cells}</div>`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: cols * cellW + (cols - 1) * 16 + 36, height: 400 } });
  await page.setContent(html);
  await page.waitForTimeout(400);
  await page.screenshot({ path: out, type: 'jpeg', quality: 86, fullPage: true });
  await browser.close();
  return { rows, cols };
}
