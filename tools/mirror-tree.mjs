// A control tree for a before-and-after comparison: the repo as it was at a commit, in its own folder, with this repo's node_modules and the
// gitignored art linked in as directory junctions (so it can run its own dev server, its own vitest, its own tsc, on the same art).
// Built from `git archive`, so it has no .git (a page served from it reports build sha "unknown").
//
//   node tools/mirror-tree.mjs make   <rev> <destDir>   (destDir must not exist or be empty; takes a few minutes: it writes every tracked file)
//   node tools/mirror-tree.mjs unlink <destDir>         (removes ONLY the junctions; then the folder is safe to delete as a plain folder)
//
// Why `unlink` exists: a recursive delete that follows a junction deletes the TARGET's files (this repo's node_modules, the art). Always run
// `unlink` first, and check `Test-Path` on the targets afterwards. In PowerShell 7 `Remove-Item -Recurse` does not follow junctions; Git Bash's
// `rm -rf` does not follow them either; `rmdir /s` is fine; a script or tool of unknown behaviour is not worth the risk.
// The split lane's control tree (docs/handoff/split.md) was found gone twice in one day, so its job spec starts with `make`, not with a path.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, lstatSync, realpathSync, symlinkSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const LINKS = ['node_modules', 'public/art', 'public/fx']; // relative to the tree's root; each is linked only when this repo has it
const [mode, a, b] = process.argv.slice(2);
const root = execFileSync('git', ['rev-parse', '--show-toplevel']).toString('utf8').trim();

function fail(message) { console.error(message); process.exit(2); }

if (mode === 'make' && a && b) {
  const dest = b;
  if (existsSync(dest) && readdirSync(dest).length > 0) fail(`${dest} exists and is not empty`);
  mkdirSync(dest, { recursive: true });
  execFileSync('git', ['rev-parse', '--verify', `${a}^{tree}`], { cwd: root, stdio: 'pipe' }); // fails loudly on an unknown rev
  const archive = spawn('git', ['archive', '--format=tar', a], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] });
  const untar = spawn('tar', ['-x', '-C', dest], { stdio: ['pipe', 'inherit', 'inherit'] });
  archive.stdout.pipe(untar.stdin);
  untar.on('close', (code) => {
    if (code !== 0) fail(`tar failed (${code})`);
    for (const rel of LINKS) {
      const from = join(root, rel);
      if (!existsSync(from)) { console.log(`skipped ${rel}: this repo has none`); continue; }
      const to = join(dest, rel);
      if (existsSync(to)) { console.log(`skipped ${rel}: the archive already has it`); continue; }
      mkdirSync(join(to, '..'), { recursive: true });
      symlinkSync(realpathSync(from), to, 'junction');
      console.log(`linked ${rel} -> ${realpathSync(from)}`);
    }
    console.log(`done: ${dest} is ${a}. Serve it with: cd <destDir> && ./node_modules/.bin/vite --port <port>. When finished: node tools/mirror-tree.mjs unlink <destDir>`);
  });
} else if (mode === 'unlink' && a) {
  for (const rel of LINKS) {
    const path = join(a, rel);
    let stat = null;
    try { stat = lstatSync(path); } catch { /* absent */ }
    if (!stat) continue;
    if (!stat.isSymbolicLink()) { console.log(`left ${rel}: it is a real folder here`); continue; }
    unlinkSync(path); // removes the link, never what it points at
    console.log(`unlinked ${rel}`);
  }
  console.log(`done: ${a} holds no junction now; it can be deleted as an ordinary folder.`);
} else {
  fail('usage: node tools/mirror-tree.mjs make <rev> <destDir> | unlink <destDir>');
}
