// Live review of build b8aa6f96 (bundle DA6NOD0r), the parts that need no browser (RUBRIC section 8; CHK-016, CHK-017):
//   pages      both addresses serve the bundle; the live audio manifest equals the shipped one
//   text       every TEXT file the artifact lists is downloaded from the LIVE site (scratch only) and its sha256 compared with the artifact manifest;
//              the project's own gate (tools/dist-local-paths.mjs --dir <download> --json: drive and profile paths, links to claude.ai, painting-sidecar keys
//              outside the list) runs over that download, and over a synthetic positive control; /__ffx-local/ answers 404 at both addresses
//   words      the shipped bundle carries the new FFX Silence card words and not the old ones; the REDUCE FLASHES and COLOUR VISION rules are in the live stylesheet
//   sidecars   30 painting sidecars picked at random from the live site, and every sidecar of the artifact: each is a JSON object whose top-level keys are among the ten
//              the game reads (SIDECAR_FIELDS), the values equal the master's for the keys kept, the master holds keys the live file lacks (the control)
//   rikku      the idle paintings of Rikku's ten FFX-2 dresspheres (and her FFX painting) as the live site serves them, saved to scratch, then measured by
//              b8aa6f96-rikku-measure.py against the corrected masters (D:/pyrefly-art-r47: must be equal) and the old ones (D:/pyrefly-art-r44: must differ)
// Nothing but downloaded site files and the result json goes to disk (scratch only); the report never prints a path of this machine.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

import { SIDECAR_FIELDS, NON_SIDECAR_ART_JSON, isSidecarJson } from 'file:///D:/pyrefly-r47/tools/art-sidecar-fields.mjs';

const ROOT = 'D:/pyrefly-r47';
const SHA = 'b8aa6f96';
const BUNDLE = 'DA6NOD0r';
const SCRATCH = 'D:/Tools/pyrefly-scratch/2026-10-14/live-b8aa6f96';
const PROGRESS = `${ROOT}/critic/reviews/PROGRESS-live-${SHA}.md`;
const LIVE = process.env.LIVE_ROOT || 'https://echoesofspira.com/';
const ADDRESSES = ['https://echoesofspira.com/', 'https://echoes-of-spira.baileypillon.workers.dev/'];
const DIR = `${SCRATCH}/site-text`;
const OUTJSON = `${SCRATCH}/static.json`;
const TEN = ['width', 'height', 'baselineY', 'scale', 'anchorY', 'facing', 'seed', 'prompt', 'focal', 'headTop'];
const manifest = JSON.parse(fs.readFileSync(`${ROOT}/critic/artifacts/${SHA}.json`, 'utf8')).files;
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
      return { status: r.status, ct: (r.headers.get('content-type') || '').split(';')[0], buf: Buffer.from(await r.arrayBuffer()) };
    } catch (e) { last = e; }
  }
  throw last;
}
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');

// ------------------------------------------------------------------ pages
{
  const pages = [];
  for (const a of ADDRESSES) {
    const r = await fetch(`${a}?cb=${stamp}`);
    const html = await r.text();
    pages.push({ address: a.replace(/^https:\/\//, '').replace(/\/$/, ''), status: r.status, ct: (r.headers.get('content-type') || '').split(';')[0], bundle: (html.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [null])[0], css: (html.match(/assets\/index-[A-Za-z0-9_-]+\.css/) || [null])[0] });
  }
  R.pages = pages;
  check('pages', `both addresses serve bundle ${BUNDLE}`, pages.every((p) => p.status === 200 && p.bundle === `assets/index-${BUNDLE}.js`), pages);
  let shippedEq = null;
  try {
    const live = await (await fetch(`${LIVE}audio/manifest.json?cb=${stamp}`)).text();
    const shipped = fs.readFileSync(`${ROOT}/dist-release/audio/manifest.json`, 'utf8');
    shippedEq = JSON.stringify(JSON.parse(live)) === JSON.stringify(JSON.parse(shipped));
  } catch (e) { shippedEq = `not compared: ${String(e).slice(0, 80)}`; }
  R.audioManifestEqualsShipped = shippedEq;
  check('pages', 'the live audio manifest is the shipped dist-release one', shippedEq === true, shippedEq);
  progress(`pages done: ${pages.map((p) => p.bundle).join(' / ')}; audio manifest equals shipped ${shippedEq}`);
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
    dev.push({ address: a.replace(/^https:\/\//, '').replace(/\/$/, ''), path: p, status: r.status, ct: r.ct, bytes: r.buf.length });
  }
  R.text.devRoute = dev;
  check('text', '/__ffx-local/ (the converter\'s dev-only route) answers 404 at both addresses', dev.every((d) => d.status === 404), dev.map((d) => `${d.address} ${d.path} ${d.status}`));
  progress(`text done: ${out.fetched}/${out.files} text files (${R.text.bytesMB} MB) downloaded from live, ${out.sameSha} sha256 equal to the manifest; the project gate exit ${R.text.gate.exit} scanned ${R.text.gate.scanned} hits ${R.text.gate.hitCount}; control exit ${R.text.control.exit} hits ${R.text.control.hitCount}; dev route ${dev.map((d) => d.status).join('/')}`);
}

// ------------------------------------------------------------------ words: the Silence card and the two stylesheet halves
{
  const assets = Object.keys(manifest).filter((p) => /^assets\/.*\.(js|css)$/.test(p));
  const found = { newSilence: [], oldSilence: [], ffx2Silence: [], flashesCss: [], colourCss: [], softHurt: [] };
  for (const p of assets) {
    const t = fs.readFileSync(path.join(DIR, p), 'utf8');
    if (/no White or Black Magic\./.test(t)) found.newSilence.push(p);
    if (/White or Black Magic and no Summon/.test(t)) found.oldSilence.push(p);
    if (/no White Magic, Black Magic or Arcana/.test(t)) found.ffx2Silence.push(p);
    if (/data-reduce-flashes\]/.test(t) && /ffx-hurt-soft/.test(t)) found.flashesCss.push(p);
    if (/data-colour-vision\]/.test(t) && /--cvd-gate-r/.test(t)) found.colourCss.push(p);
    if (/ffx-hurt-soft/.test(t)) found.softHurt.push(p);
  }
  R.words = found;
  check('words', 'the live bundle carries the FFX Silence card words ("no White or Black Magic.") and not the old "and no Summon"; the FFX-2 card is still its own', found.newSilence.length >= 1 && found.oldSilence.length === 0 && found.ffx2Silence.length >= 1, found);
  check('words', 'the live stylesheet carries the REDUCE FLASHES rules (ffx-hurt-soft under html[data-reduce-flashes]) and the COLOUR VISION rules (--cvd-gate-r under html[data-colour-vision])', found.flashesCss.length >= 1 && found.colourCss.length >= 1, { flashesCss: found.flashesCss, colourCss: found.colourCss });
  progress(`words done: Silence card words in ${found.newSilence.join(',')} (old words in ${found.oldSilence.length} files); flashes css ${found.flashesCss.join(',')}; colour css ${found.colourCss.join(',')}`);
}

// ------------------------------------------------------------------ sidecars: the ten game fields
{
  const out = (R.sidecars = {});
  check('sidecars', 'the project\'s SIDECAR_FIELDS is the ten the brief names', JSON.stringify([...SIDECAR_FIELDS]) === JSON.stringify(TEN), [...SIDECAR_FIELDS]);
  const artJson = Object.keys(manifest).filter((p) => p.startsWith('art/') && p.endsWith('.json')).sort();
  const sidecars = artJson.filter(isSidecarJson);
  const others = artJson.filter((p) => !isSidecarJson(p));
  out.artJson = artJson.length; out.sidecars = sidecars.length; out.nonSidecar = others;
  check('sidecars', 'the non-sidecar art JSON files are exactly the two manifests and the build\'s derived.json', JSON.stringify(others) === JSON.stringify([...NON_SIDECAR_ART_JSON].sort()), others);
  const keysOf = (txt) => { const o = JSON.parse(txt); return { obj: o, isObject: o !== null && typeof o === 'object' && !Array.isArray(o), keys: o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o) : [] }; };
  // every sidecar of the artifact, from the downloaded (and hash-checked) live copies
  const freq = {};
  const bad = [];
  let empty = 0;
  for (const p of sidecars) {
    const k = keysOf(fs.readFileSync(path.join(DIR, p), 'utf8'));
    if (!k.isObject) { bad.push({ p, why: 'not an object' }); continue; }
    if (k.keys.length === 0) empty++;
    for (const key of k.keys) { freq[key] = (freq[key] || 0) + 1; if (!TEN.includes(key)) bad.push({ p, key }); }
  }
  out.allSidecars = { n: sidecars.length, emptyObjects: empty, keyFrequency: freq, outsideTheTen: bad.length };
  check('sidecars', `every sidecar of the live site (${sidecars.length}) is a JSON object with only keys among the ten`, bad.length === 0 && sidecars.length > 1000, { n: sidecars.length, outside: bad.slice(0, 5), keyFrequency: freq });
  // 30 picked at random, fetched fresh from live, compared with the masters
  const pool = [...sidecars];
  const pick = [];
  while (pick.length < 30) pick.push(pool.splice(crypto.randomInt(0, pool.length), 1)[0]);
  out.random = [];
  let masterExtra = 0;
  for (const p of pick) {
    const r = await getBuf(`${LIVE}${p}?cb=${stamp}`);
    const row = { path: p, status: r.status, ct: r.ct };
    try {
      const k = keysOf(r.buf.toString('utf8'));
      row.isObject = k.isObject; row.keys = k.keys; row.outsideTheTen = k.keys.filter((x) => !TEN.includes(x));
      const mp = `D:/pyrefly-art-r47/${p.replace(/^art\//, '')}`;
      const m = JSON.parse(fs.readFileSync(mp, 'utf8'));
      const kept = Object.keys(m).filter((x) => TEN.includes(x));
      row.masterKeys = Object.keys(m).length;
      row.masterExtraKeys = Object.keys(m).filter((x) => !TEN.includes(x)).length;
      row.sameKeysAsMasterTen = JSON.stringify(kept) === JSON.stringify(k.keys);
      row.valuesEqualMaster = kept.every((x) => JSON.stringify(m[x]) === JSON.stringify(k.obj[x]));
      masterExtra += row.masterExtraKeys > 0 ? 1 : 0;
      row.privateLink = /claude\.ai/i.test(r.buf.toString('utf8'));
    } catch (e) { row.error = String(e).slice(0, 100); }
    out.random.push(row);
  }
  out.randomSummary = { n: out.random.length, allStatus200: out.random.every((x) => x.status === 200), allJson: out.random.every((x) => /json/.test(x.ct)), allObjects: out.random.every((x) => x.isObject === true), outsideTheTen: out.random.filter((x) => (x.outsideTheTen || []).length).length, keysAndValuesAsMasterTen: out.random.filter((x) => x.sameKeysAsMasterTen && x.valuesEqualMaster).length, masterHadExtraKeys: masterExtra, privateLinks: out.random.filter((x) => x.privateLink).length, errors: out.random.filter((x) => x.error).length };
  const s = out.randomSummary;
  check('sidecars', '30 sidecars picked at random and fetched fresh from live: all 200 JSON objects, no key outside the ten, the kept keys and values equal the master\'s, no claude.ai link', s.n === 30 && s.allStatus200 && s.allJson && s.allObjects && s.outsideTheTen === 0 && s.keysAndValuesAsMasterTen === 30 && s.privateLinks === 0 && s.errors === 0, s);
  check('sidecars', 'the control: the masters of those 30 hold keys the live files lack (so the cut is real, not a file that never had them)', s.masterHadExtraKeys > 0, { masterHadExtraKeys: s.masterHadExtraKeys, of: 30 });
  progress(`sidecars done: SIDECAR_FIELDS == the ten ${JSON.stringify([...SIDECAR_FIELDS]) === JSON.stringify(TEN)}; all ${sidecars.length} sidecars: keys outside the ten ${bad.length}; random 30: ${s.keysAndValuesAsMasterTen}/30 equal the master's ten, outside the ten ${s.outsideTheTen}, masters with extra keys ${s.masterHadExtraKeys}, claude.ai links ${s.privateLinks}`);
}

// ------------------------------------------------------------------ rikku: the served idle paintings against the two masters
{
  const out = (R.rikku = {});
  const changed = ['alchemist', 'berserker', 'black-mage', 'gunner', 'lady-luck', 'songstress', 'thief', 'white-mage'];
  const unchanged = ['dark-knight', 'warrior'];
  const list = [];
  const add = (id, rel) => list.push({ id, rel });
  for (const d of changed) { add(`${d}/idle`, `art/characters/rikku-${d}/idle.png`); if (d !== 'lady-luck') add(`${d}/idle@2x`, `art/characters/rikku-${d}/idle@2x.png`); }
  for (const d of unchanged) add(`${d}/idle (unchanged control)`, `art/characters/rikku-${d}/idle.png`);
  add('rikku (FFX painting, unchanged control)', 'art/characters/rikku/idle.png');
  const dir = `${SCRATCH}/rikku-live`;
  fs.mkdirSync(dir, { recursive: true });
  const files = [];
  for (const e of list) {
    const shipped = manifest[e.rel] ? e.rel : e.rel.replace(/\.png$/, '.webp');
    const r = await getBuf(`${LIVE}${shipped}?cb=${stamp}`);
    const f = `${dir}/${e.id.replace(/[^A-Za-z0-9@-]+/g, '_')}${path.extname(shipped)}`;
    fs.writeFileSync(f, r.buf);
    files.push({ id: e.id, rel: shipped, served: f, status: r.status, ct: r.ct, sha256: sha256(r.buf), manifestSha: manifest[shipped]?.sha256 ?? null });
  }
  out.fetched = files.map((f) => ({ id: f.id, rel: f.rel, status: f.status, ct: f.ct, equalsManifest: f.sha256 === f.manifestSha }));
  check('rikku', `${files.length} Rikku idle paintings fetched from live: all 200, each sha256 equal to the manifest`, files.every((f) => f.status === 200 && f.sha256 === f.manifestSha), out.fetched.filter((f) => !f.equalsManifest || f.status !== 200));
  fs.writeFileSync(`${SCRATCH}/rikku-live-files.json`, JSON.stringify(files.map((f) => ({ id: f.id, served: f.served, rel: f.rel })), null, 1));
  const py = spawnSync('python', ['-I', `${ROOT}/critic/reviews/b8aa6f96-rikku-measure.py`, `${SCRATCH}/rikku-live-files.json`, `${SCRATCH}/rikku-live-measure.json`], { encoding: 'utf8', cwd: SCRATCH, maxBuffer: 16 * 1024 * 1024 });
  out.python = { exit: py.status, stdout: String(py.stdout).slice(0, 2500), stderr: String(py.stderr).slice(0, 400) };
  if (py.status === 0) {
    const m = JSON.parse(fs.readFileSync(`${SCRATCH}/rikku-live-measure.json`, 'utf8'));
    out.measure = m;
    const isCtl = (r) => /control/.test(r.id);
    const ch = m.filter((r) => !isCtl(r));
    const ct = m.filter(isCtl);
    check('rikku', 'each changed Rikku painting as served is pixel-identical to the corrected master in the art mirror r47 (RGBA, every pixel)', ch.length > 0 && ch.every((r) => r.vsMaster47?.identicalRGBA === true), ch.map((r) => `${r.id}:${r.vsMaster47?.identicalRGBA}`));
    check('rikku', 'each changed Rikku painting as served DIFFERS from the old master in the art mirror r44 (and its mean saturation is lower)', ch.every((r) => r.vsMaster44?.identicalRGBA === false && r.meanSaturationThumb256.served < r.meanSaturationThumb256.master44), ch.map((r) => `${r.id}:${r.meanSaturationThumb256.master44?.toFixed(3)}->${r.meanSaturationThumb256.served.toFixed(3)}`));
    check('rikku', 'the unchanged controls (Dark Knight, Warrior, her FFX painting) as served equal BOTH masters', ct.every((r) => r.vsMaster47?.identicalRGBA === true && r.vsMaster44?.identicalRGBA === true), ct.map((r) => `${r.id}:${r.vsMaster47?.identicalRGBA}/${r.vsMaster44?.identicalRGBA}`));
  } else check('rikku', 'the measuring script ran', false, out.python);
  progress(`rikku done: ${files.length} idle paintings fetched and measured (python exit ${py.status}); ${(out.measure || []).filter((r) => !/control/.test(r.id) && r.vsMaster47?.identicalRGBA).length} changed ones equal master r47, ${(out.measure || []).filter((r) => !/control/.test(r.id) && r.vsMaster44?.identicalRGBA === false).length} differ from r44`);
}

R.finishedAt = new Date().toISOString();
const failed = R.assertions.filter((a) => !a.ok);
fs.writeFileSync(OUTJSON, JSON.stringify(R, null, 1));
console.log(JSON.stringify({ assertions: R.assertions.length, failed: failed.map((f) => `${f.part}: ${f.name}`) }, null, 1));
progress(`ALL DONE: ${R.assertions.length} assertions, ${failed.length} failed; json ${OUTJSON}`);
