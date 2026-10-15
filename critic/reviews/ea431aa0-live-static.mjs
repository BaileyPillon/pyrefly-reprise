// Live review of build ea431aa0 (bundle DzeCyPSw), the parts that need no browser (RUBRIC section 8; CHK-016, CHK-017). Adapted from critic/reviews/b8aa6f96-live-static.mjs (D:/pyrefly-r47).
//   pages      both addresses serve the bundle and the stylesheet; the live audio manifest equals the shipped one
//   removed    the 4 files of b8aa6f96 that this build replaced answer 404 at both addresses; the 4 new ones are served at both, each sha256 equal to the manifest
//   text       every TEXT file the artifact lists is downloaded from the LIVE site (scratch only) and its sha256 compared with the artifact manifest;
//              the project's own gate (tools/dist-local-paths.mjs --dir <download> --json: drive and profile paths, links to claude.ai, painting-sidecar keys
//              outside the list) runs over that download, and over a synthetic positive control; /__ffx-local/ answers 404 at both addresses
//   words      the shipped bundle carries the FFX-2 Silence card words ("no spells, Dances or Songs") and not the old ones; the FFX card words are unchanged;
//              both hidden chapters' ids and their door words are in the bundle
// Nothing but downloaded site files and the result json goes to disk (scratch only); the report never prints a path of this machine.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const ROOT = 'D:/pyrefly-r48';
const SHA = 'ea431aa0';
const BUNDLE = 'DzeCyPSw';
const CSS = 'Bu4qsaVc';
const PREV = 'b8aa6f96';
const SCRATCH = 'D:/Tools/pyrefly-scratch/2026-10-14/live-ea431aa0';
const PROGRESS = `${ROOT}/critic/reviews/PROGRESS-live-${SHA}.md`;
const LIVE = process.env.LIVE_ROOT || 'https://echoesofspira.com/';
const ADDRESSES = ['https://echoesofspira.com/', 'https://echoes-of-spira.baileypillon.workers.dev/'];
const DIR = `${SCRATCH}/site-text`;
const OUTJSON = `${SCRATCH}/static.json`;
const manifest = JSON.parse(fs.readFileSync(`${ROOT}/critic/artifacts/${SHA}.json`, 'utf8')).files;
const prevManifest = JSON.parse(fs.readFileSync(`${ROOT}/critic/artifacts/${PREV}.json`, 'utf8')).files;
const stamp = Date.now();
const R = { review: 'live-static', sha: SHA, bundle: BUNDLE, startedAt: new Date().toISOString(), assertions: [] };
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const progress = (line) => { try { fs.appendFileSync(PROGRESS, `${new Date().toISOString().slice(0, 19)}Z static: ${line}\n`); } catch { /* best effort */ } fs.writeFileSync(OUTJSON, JSON.stringify(R, null, 1)); };
function check(part, name, ok, detail) {
  R.assertions.push({ part, name, ok: !!ok, detail: detail === undefined ? null : detail });
  log(ok ? 'PASS' : 'FAIL', part, name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 260));
  return !!ok;
}
async function getBuf(u, tries = 3) {
  let last;
  for (let a = 0; a < tries; a++) {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(120000) });
      return { status: r.status, ct: (r.headers.get('content-type') || '').split(';')[0], cache: r.headers.get('cache-control'), buf: Buffer.from(await r.arrayBuffer()) };
    } catch (e) { last = e; }
  }
  throw last;
}
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const host = (a) => a.replace(/^https:\/\//, '').replace(/\/$/, '');

// ------------------------------------------------------------------ pages
{
  const pages = [];
  for (const a of ADDRESSES) {
    const r = await fetch(`${a}?cb=${stamp}`);
    const html = await r.text();
    pages.push({ address: host(a), status: r.status, ct: (r.headers.get('content-type') || '').split(';')[0], bundle: (html.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [null])[0], css: (html.match(/assets\/index-[A-Za-z0-9_-]+\.css/) || [null])[0] });
  }
  R.pages = pages;
  check('pages', `both addresses serve bundle ${BUNDLE} and stylesheet ${CSS}`, pages.every((p) => p.status === 200 && p.bundle === `assets/index-${BUNDLE}.js` && p.css === `assets/index-${CSS}.css`), pages);
  let shippedEq = null;
  try {
    const live = await (await fetch(`${LIVE}audio/manifest.json?cb=${stamp}`)).text();
    const shipped = fs.readFileSync(`${ROOT}/dist-release/audio/manifest.json`, 'utf8');
    shippedEq = JSON.stringify(JSON.parse(live)) === JSON.stringify(JSON.parse(shipped));
  } catch (e) { shippedEq = `not compared: ${String(e).slice(0, 80)}`; }
  R.audioManifestEqualsShipped = shippedEq;
  check('pages', 'the live audio manifest is the shipped dist-release one', shippedEq === true, shippedEq);
  progress(`pages done: ${pages.map((p) => `${p.bundle} ${p.css}`).join(' / ')}; audio manifest equals shipped ${shippedEq}`);
}

// ------------------------------------------------------------------ removed and added files, at both addresses
{
  const removed = Object.keys(prevManifest).filter((p) => !manifest[p]);
  const added = Object.keys(manifest).filter((p) => !prevManifest[p]);
  const rem = [];
  const add = [];
  for (const a of ADDRESSES) {
    for (const p of removed) { const r = await getBuf(`${a}${p}?cb=${stamp}`); rem.push({ address: host(a), path: p, status: r.status, ct: r.ct }); }
    for (const p of added) { const r = await getBuf(`${a}${p}?cb=${stamp}`); add.push({ address: host(a), path: p, status: r.status, ct: r.ct, cache: r.cache, sha256Equal: sha256(r.buf) === manifest[p].sha256 }); }
  }
  R.removed = rem;
  R.added = add;
  check('removed', `the ${removed.length} files of ${PREV} this build replaced answer 404 at both addresses`, removed.length === 4 && rem.every((x) => x.status === 404), rem.map((x) => `${x.address} ${x.path} ${x.status}`));
  check('removed', `the ${added.length} new files are served at both addresses with the manifest's sha256`, added.length === 4 && add.every((x) => x.status === 200 && x.sha256Equal), add.map((x) => `${x.address} ${x.path} ${x.status} ${x.ct} eq ${x.sha256Equal}`));
  progress(`removed/added done: ${removed.length} removed answer ${[...new Set(rem.map((x) => x.status))].join('/')}, ${added.length} added served and equal ${add.every((x) => x.sha256Equal)}`);
}

// ------------------------------------------------------------------ text: download, sha, the project gate
{
  const TEXT = new Set(['.json', '.js', '.mjs', '.css', '.html', '.htm', '.txt', '.md', '.svg', '.xml', '.webmanifest', '.csv', '.map']);
  const paths = Object.keys(manifest).filter((p) => TEXT.has(path.extname(p).toLowerCase()));
  const out = { files: paths.length, fetched: 0, sameSha: 0, differentSha: [], failed: [], bytes: 0 };
  let next = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (next < paths.length) {
      const p = paths[next++];
      try {
        const r = await getBuf(`${LIVE}${p}?cb=${stamp}`);
        if (r.status !== 200) { out.failed.push({ p, status: r.status }); continue; }
        const full = path.join(DIR, p);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, r.buf);
        out.fetched++;
        out.bytes += r.buf.length;
        if (sha256(r.buf) === manifest[p].sha256) out.sameSha++; else out.differentSha.push(p);
      } catch (e) { out.failed.push({ p, error: String(e).slice(0, 80) }); }
    }
  }));
  R.text = { ...out, bytesMB: Math.round((out.bytes / 1048576) * 10) / 10 };
  check('text', `all ${out.files} text files of the artifact downloaded from live, each sha256 equal to the manifest`, out.fetched === out.files && out.sameSha === out.files && out.failed.length === 0, { files: out.files, fetched: out.fetched, sameSha: out.sameSha, different: out.differentSha.length, failed: out.failed.length });

  const gate = (dir) => {
    const res = spawnSync(process.execPath, [`${ROOT}/tools/dist-local-paths.mjs`, '--dir', dir, '--json'], { encoding: 'utf8', cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
    let parsed = null;
    try { parsed = JSON.parse(res.stdout); } catch { parsed = null; }
    return { exit: res.status, scanned: parsed?.scanned ?? parsed?.files ?? null, hitCount: Array.isArray(parsed?.hits) ? parsed.hits.length : (parsed?.hitCount ?? null), kinds: Array.isArray(parsed?.hits) ? [...new Set(parsed.hits.map((h) => h.kind))] : null, head: String(res.stdout).slice(0, 700), stderr: String(res.stderr).slice(0, 300) };
  };
  R.text.gate = gate(DIR);
  check('text', 'the project\'s own gate (tools/dist-local-paths.mjs: local paths, claude.ai links, sidecar keys outside the list) over the live text download: exit 0, no hit', R.text.gate.exit === 0 && (R.text.gate.hitCount === 0 || R.text.gate.hitCount === null), { exit: R.text.gate.exit, scanned: R.text.gate.scanned, hits: R.text.gate.hitCount });
  // positive control: the same gate over a small made-up folder that carries the three things it looks for must refuse it
  const ctl = `${SCRATCH}/gate-control`;
  fs.rmSync(ctl, { recursive: true, force: true });
  fs.mkdirSync(`${ctl}/art/characters/x`, { recursive: true });
  fs.writeFileSync(`${ctl}/art/characters/x/idle.json`, '{\n"width": 10,\n"candidateSource": "X:/Some/Folder/name.png",\n"status": "made up"\n}\n');
  fs.writeFileSync(`${ctl}/notes.txt`, 'see https://claude.ai/artifact/made-up for the notes\n');
  R.text.control = gate(ctl);
  check('text', 'positive control: the gate refuses a made-up folder that carries a drive path, a sidecar key outside the list and a claude.ai link', R.text.control.exit === 1 && (R.text.control.hitCount === null || R.text.control.hitCount >= 3), { exit: R.text.control.exit, hits: R.text.control.hitCount, kinds: R.text.control.kinds });
  const dev = [];
  for (const a of ADDRESSES) for (const p of ['__ffx-local/manifest.json', '__ffx-local/']) {
    const r = await getBuf(`${a}${p}?cb=${stamp}`);
    dev.push({ address: host(a), path: p, status: r.status, ct: r.ct, bytes: r.buf.length });
  }
  R.text.devRoute = dev;
  check('text', '/__ffx-local/ (the converter\'s dev-only route) answers 404 at both addresses', dev.every((d) => d.status === 404), dev.map((d) => `${d.address} ${d.path} ${d.status}`));
  progress(`text done: ${out.fetched}/${out.files} text files (${R.text.bytesMB} MB) downloaded from live, ${out.sameSha} sha256 equal to the manifest; the project gate exit ${R.text.gate.exit} scanned ${R.text.gate.scanned} hits ${R.text.gate.hitCount}; control exit ${R.text.control.exit} hits ${R.text.control.hitCount}; dev route ${dev.map((d) => d.status).join('/')}`);
}

// ------------------------------------------------------------------ words: the Silence cards and the two hidden chapters in the bundle
{
  const assets = Object.keys(manifest).filter((p) => /^assets\/.*\.(js|css)$/.test(p));
  const found = { ffx2NewSilence: [], ffx2OldSilence: [], ffxSilence: [], ffxOldSilence: [], touristTrap: [], valeforBesaid: [], daigoroWord: [], valeforWord: [] };
  for (const p of assets) {
    const t = fs.readFileSync(path.join(DIR, p), 'utf8');
    if (/no spells, Dances or Songs/.test(t)) found.ffx2NewSilence.push(p);
    if (/no White Magic, Black Magic or Arcana/.test(t)) found.ffx2OldSilence.push(p);
    if (/no White or Black Magic\./.test(t)) found.ffxSilence.push(p);
    if (/White or Black Magic and no Summon/.test(t)) found.ffxOldSilence.push(p);
    if (/ffx2-tourist-trap/.test(t)) found.touristTrap.push(p);
    if (/ffx2-valefor-besaid/.test(t)) found.valeforBesaid.push(p);
    if (/["'`]daigoro["'`]/.test(t)) found.daigoroWord.push(p);
    if (/["'`]valefor["'`]/.test(t)) found.valeforWord.push(p);
  }
  R.words = found;
  check('words', 'the live bundle carries the FFX-2 Silence card words ("no spells, Dances or Songs") and not the old "no White Magic, Black Magic or Arcana"', found.ffx2NewSilence.length >= 1 && found.ffx2OldSilence.length === 0, found);
  check('words', 'the live bundle still carries the FFX Silence card words ("no White or Black Magic.") and not the older "and no Summon"', found.ffxSilence.length >= 1 && found.ffxOldSilence.length === 0, { ffxSilence: found.ffxSilence, ffxOldSilence: found.ffxOldSilence });
  check('words', 'the live bundle carries both hidden chapters (ffx2-tourist-trap, ffx2-valefor-besaid) and their two door words', found.touristTrap.length >= 1 && found.valeforBesaid.length >= 1 && found.daigoroWord.length >= 1 && found.valeforWord.length >= 1, { touristTrap: found.touristTrap, valeforBesaid: found.valeforBesaid, daigoroWord: found.daigoroWord, valeforWord: found.valeforWord });
  progress(`words done: ffx2 new ${found.ffx2NewSilence.length} old ${found.ffx2OldSilence.length}; ffx card ${found.ffxSilence.length} old ${found.ffxOldSilence.length}; chapters ${found.touristTrap.length}/${found.valeforBesaid.length}; door words ${found.daigoroWord.length}/${found.valeforWord.length}`);
}

R.finishedAt = new Date().toISOString();
const failed = R.assertions.filter((a) => !a.ok);
fs.writeFileSync(OUTJSON, JSON.stringify(R, null, 1));
console.log(JSON.stringify({ assertions: R.assertions.length, failed: failed.map((f) => `${f.part}: ${f.name}`) }, null, 1));
progress(`ALL DONE: ${R.assertions.length} assertions, ${failed.length} failed; json ${OUTJSON}`);
