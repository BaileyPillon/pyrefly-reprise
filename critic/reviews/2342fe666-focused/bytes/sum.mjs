import fs from 'node:fs';
import zlib from 'node:zlib';
const live = 'https://echoesofspira.com';
async function tally(label, html, get) {
  const urls = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]))];
  let raw = 0, gz = 0;
  for (const u of urls) { const b = await get(u); raw += b.length; gz += zlib.gzipSync(b, { level: 9 }).length; }
  console.log(label, urls.length, 'files', 'raw', raw, 'gzip', gz);
  return { raw, gz };
}
const lhtml = fs.readFileSync('D:/Tools/pyrefly-scratch/2026-11-03/r74/focused/bytes/live-index.html', 'utf8');
const L = await tally('live  ', lhtml, async (u) => Buffer.from(await (await fetch(live + u)).arrayBuffer()));
const chtml = fs.readFileSync('D:/pyrefly-release55/dist-gate/index.html', 'utf8');
const C = await tally('cand  ', chtml, async (u) => fs.readFileSync('D:/pyrefly-release55/dist-gate' + u));
console.log('delta raw', ((C.raw / L.raw - 1) * 100).toFixed(2) + '%', 'gzip', ((C.gz / L.gz - 1) * 100).toFixed(2) + '%');
