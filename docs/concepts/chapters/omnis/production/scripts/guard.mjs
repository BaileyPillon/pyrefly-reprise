import { checkCutoutFile } from 'file:///D:/Final%20Fantasy/tools/gen/cutout-guard.mjs';
const [f, sw, sh, comp] = process.argv.slice(2);
const r = await checkCutoutFile(f, { sourceWidth: +sw, sourceHeight: +sh, composition: comp || 'full' });
console.log(JSON.stringify({ ok: r.ok, reasons: r.reasons, m: r.measurements }, null, 0));
