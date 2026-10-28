import { openRoute } from '../../runner/lib/route-evidence.mjs';
import fs from 'node:fs';
const [base, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const res = [];
for (const q of ['', '?timing=frames', '?timing=today', '?motion=classic', '?timing=frames&motion=classic']) {
  process.env.PYREFLY_QUERY = q;
  const { browser, page, consoleErrors } = await openRoute({ base, width: 1600, height: 900 });
  const r = { q };
  try { r.timing = await page.evaluate(() => window.__pyrefly.timing?.()); r.feel = await page.evaluate(() => JSON.stringify(window.__pyrefly.feel?.() ?? null).slice(0, 400)); }
  catch (e) { r.error = String(e).slice(0, 200); }
  r.errors = consoleErrors.length; res.push(r); console.log(JSON.stringify(r)); await browser.close();
}
fs.writeFileSync(`${out}/switch-probe.json`, JSON.stringify(res, null, 1));
