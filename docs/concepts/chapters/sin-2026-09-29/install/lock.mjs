// Sin production art (FFX only, 2026-09-29): lock the installed images' hashes in docs/target/approved-hashes.json as
// the set "driver:2026-09-29-sin (D-279, delegated by Bailey)". Additive: an existing set of that name is refused.
//
//   node docs/concepts/chapters/sin-2026-09-29/install/lock.mjs <installed.json> <approved-hashes.json>
import { readFileSync, writeFileSync } from 'node:fs';

const [installedPath, hashesPath] = process.argv.slice(2);
const inst = JSON.parse(readFileSync(installedPath, 'utf8'));
const raw = readFileSync(hashesPath, 'utf8');
const doc = JSON.parse(raw);
const KEY = 'driver:2026-09-29-sin (D-279, delegated by Bailey)';
if (doc.sets[KEY]) throw new Error(`set already exists: ${KEY}`);
const set = {
  words: 'Your picks (Recommended)',
  note: "Bailey, 2026-09-29 (asleep; the driver's options round): \"Your picks (Recommended)\" to the Sin paintings, countdown display and music (D-279: the driver picks tonight; both Sin chapters listed by morning), with \"full speed ahead, godspeed. ... I will go with all your recommendations.\" These are the DRIVER'S picks under that delegation, NOT Bailey's approval of these exact files: head C repaired (five mouth stages), Fin A left and right (NEAR, FAR, charged), Genais A (out, shell), Core A (rest, gathering), the links I-II, link III and link IV (bk-a-8) plates, the two pause hero plates and the five turn-order portraits. Locked so no agent replaces them silently; Bailey's own verdict on each still decides (rule 9). FFX only. docs/concepts/chapters/sin-2026-09-29/install/INSTALL.md",
};
for (const f of inst.files) {
  if (!/\.(png|webp)$/.test(f.rel)) continue;
  set[`public/art/${f.rel}`] = { sha256: f.sha256, mtime: f.mtime, approved: '2026-09-29', by: 'driver (D-279, delegated)' };
}
doc.sets[KEY] = set;
writeFileSync(hashesPath, JSON.stringify(doc, null, 1) + (raw.endsWith('\n') ? '\n' : ''));
console.log('locked', Object.keys(set).length - 2, 'files under', KEY);
