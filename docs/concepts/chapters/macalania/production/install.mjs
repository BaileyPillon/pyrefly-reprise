#!/usr/bin/env node
/**
 * Install the Macalania production picks (FFX only) as CANDIDATES. Never
 * approves: nothing here touches docs/target/approved-hashes.json, and Anima's
 * board-approved idle, attack and overdrive are never written. What a pick
 * replaces was copied to D:/Tools/pyrefly-art-backup/candidates/2026-09-22-macalania/
 * replaced-2026-09-21/ before the first install; every pick (cutout, raw,
 * sidecar) is copied to the same backup folder under picks/.
 *
 *   node docs/concepts/chapters/macalania/production/install.mjs
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, renameSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..');
const BACKUP = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-22-macalania';
const REL = 'docs/concepts/chapters/macalania/production';
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const NEVER = ['public/art/characters/anima/idle.png', 'public/art/characters/anima/attack.png', 'public/art/characters/anima/overdrive.png'];

const picks = JSON.parse(readFileSync(join(HERE, 'picks.json'), 'utf8'));
const now = new Date().toISOString();

// The 2026-09-21 run left numbered candidates and .raw.png files inside
// public/art/characters/guado-guardian/ (candidates never belong there). They
// are already in the backup; move them out of public/art.
for (const dir of ['public/art/characters/guado-guardian', 'public/art/characters/seymour-macalania']) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) continue;
  for (const f of readdirSync(abs)) {
    if (/\.\d+\.(raw\.)?(png|json)$/.test(f) || f.endsWith('.raw.png')) {
      const dest = join(BACKUP, 'replaced-2026-09-21', basename(dir), f);
      mkdirSync(dirname(dest), { recursive: true });
      renameSync(join(abs, f), existsSync(dest) ? `${dest}.moved-out` : dest);
    }
  }
}

for (const it of picks.items) {
  if (NEVER.includes(it.installed)) throw new Error(`refusing to write the approved ${it.installed}`);
  const out = join(ROOT, it.installed);
  mkdirSync(dirname(out), { recursive: true });
  const src = join(HERE, it.source);
  const side = JSON.parse(readFileSync(src.replace(/(\.2x)?\.png$/, '.json'), 'utf8'));
  const pickDir = join(BACKUP, 'picks', it.kind === 'sprite' ? it.subject : it.kind);
  mkdirSync(pickDir, { recursive: true });
  for (const f of [src, src.replace(/\.png$/, '.raw.png'), src.replace(/\.png$/, '.json'), src.replace(/\.png$/, '.2x.png')]) {
    if (existsSync(f)) copyFileSync(f, join(pickDir, basename(f)));
  }
  let sidecar;
  if (it.kind === 'sprite') {
    const c = side.cutout;
    sidecar = {
      width: c.width, height: c.height, baselineY: c.baselineY, seed: side.seed,
      prompt: side.positive, negative: side.negative, cropBox: c.cropBox,
      source: { width: c.sourceWidth, height: c.sourceHeight },
      model: side.model, steps: side.steps, cfg: side.cfg, sampler: side.sampler, scheduler: side.scheduler,
      pose: side.state, composition: side.composition, nonBiped: side.nonBiped,
      // Which way the painting faces, as looked at: most picks face the party
      // (left); a pick that came back facing away says so in picks.json.
      facing: it.facing ?? 'left',
      emphasis: side.emphasis, canvas: side.canvas,
      ref: side.ref.images, refWeight: side.ref.weight, refWeightType: side.ref.type, refScaling: side.ref.scaling,
      refCombine: side.ref.combine, refStart: side.ref.start, refEnd: side.ref.end, ipadapter: side.ref.ipadapter,
      lint: { stripped: [] }, cutout: c,
    };
    copyFileSync(src, out);
  } else if (it.kind === 'backdrop') {
    sidecar = { ...side };
    copyFileSync(src, out);
  } else if (it.kind === 'hero') {
    sidecar = { ...side, focal: it.focal, master: { file: basename(it.installed).replace(/\.png$/, '.2x.webp'), width: 2688, height: 1536, route: 'RealESRGAN_x4plus x4 -> lanczos 0.5', webpQuality: 88, note: 'PNG is the 1x decode of the same render; the master is its upscale.' } };
    copyFileSync(src, out);
    const webp = out.replace(/\.png$/, '.2x.webp');
    const r = spawnSync(PY, ['-s', '-c', 'import sys\nfrom PIL import Image\nImage.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "WEBP", quality=88)', src.replace(/\.png$/, '.2x.png'), webp], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(r.stderr);
  }
  Object.assign(sidecar, {
    status: 'CANDIDATE',
    candidateOf: it.installed,
    candidateSource: `${REL}/${it.source}`,
    method: it.kind === 'sprite' ? side.method : it.kind === 'backdrop' ? `img2img from the picked backdrop A at denoise ${side.denoise}, §9.1 painter's brief words` : 'hero preset (1344x768, 30 steps, hero framing and negatives), IP-Adapter on the installed Seymour idle head at 0.35',
    judged: it.note,
    production: `${REL}/production.md`,
    installedAt: now,
  });
  writeFileSync(out.replace(/\.png$/, '.json'), `${JSON.stringify(sidecar, null, 2)}\n`);
  process.stderr.write(`[macalania install] ${it.installed} <- ${it.source}\n`);
}
