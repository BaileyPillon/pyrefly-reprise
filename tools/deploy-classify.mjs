/**
 * Decide which `git status --porcelain` lines should stop a release.
 *
 * The deploy used to refuse on *any* dirty path. That was a reasonable rule
 * when a human owned the working tree, and a useless one now: the art fleet
 * writes `docs/screenshots/**`, `docs/handoff/*.md` and `tools/gen/sheet-*.json`
 * continuously, so a file lands during almost every 15-40s preflight window.
 * On 2026-09-18 three green preflights were thrown away that way and the
 * release only went out under `--allow-dirty`, which is the blunt override
 * that turns the check off entirely — exactly the wrong habit to build.
 *
 * So the question this module answers is narrower and actually worth asking:
 * *could this dirty path change what `vite build` puts in the bundle?* If yes
 * the deploy stops, because shipping a build from a tree that does not match
 * `HEAD` makes the deploy log a lie. If no, it is noise from the fleet and the
 * release carries on.
 *
 * Unrecognised paths count as build-relevant. A false refusal costs one
 * `--allow-dirty`; a false pass ships an unreproducible bundle.
 *
 * Pure and dependency-free (node built-ins only, and in practice none at all),
 * so `tests/unit/deploy-dirty-classify.test.ts` can exercise every rule
 * without a repo, a git binary or a filesystem. Types live in
 * `deploy-classify.d.mts`, same arrangement as `tools/gen/manifest.d.mts`.
 */

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

/**
 * Paths the art/critic fleet churns through. Checked before the build rules,
 * so `tools/gen/sheet-*.json` wins over the blanket `tools/` rule below.
 */
const NOISE_RULES = [
  { rule: 'docs/**', test: (p) => underDir(p, 'docs') },
  { rule: 'critic/scratch/**', test: (p) => underDir(p, 'critic/scratch') },
  {
    rule: 'tools/gen/sheet-*.json',
    test: (p) => dirOf(p) === 'tools/gen' && /^sheet-.*\.json$/.test(baseOf(p)),
  },
  {
    rule: 'tools/zz-*.tmp.*',
    test: (p) => dirOf(p) === 'tools' && /^zz-.*\.tmp\..+$/.test(baseOf(p)),
  },
  { rule: 'public/art/**', test: (p) => underDir(p, 'public/art') },
  {
    rule: 'untracked under docs/ or critic/',
    test: (p, code) => isUntracked(code) && (underDir(p, 'docs') || underDir(p, 'critic')),
  },
];

/**
 * Paths `vite build` reads, directly or through the type-check. These only
 * pick the label printed next to a refusal — anything that matches no rule at
 * all is build-relevant too.
 */
const BUILD_RULES = [
  { rule: 'src/**', test: (p) => underDir(p, 'src') },
  { rule: 'tests/**', test: (p) => underDir(p, 'tests') },
  { rule: 'public/** (outside public/art)', test: (p) => underDir(p, 'public') },
  { rule: 'index.html', test: (p) => p === 'index.html' },
  { rule: 'package.json', test: (p) => p === 'package.json' },
  { rule: 'package-lock.json', test: (p) => p === 'package-lock.json' },
  { rule: 'vite.config.*', test: (p) => /^vite\.config\.[^/]+$/.test(p) },
  { rule: 'tsconfig*.json', test: (p) => /^tsconfig[^/]*\.json$/.test(p) },
  { rule: 'tools/** (outside the fleet scratch files)', test: (p) => underDir(p, 'tools') },
];

const UNCLASSIFIED_RULE = 'unclassified (treated as build-relevant)';

function underDir(path, dir) {
  return path === dir || path.startsWith(`${dir}/`);
}

function dirOf(path) {
  const i = path.lastIndexOf('/');
  return i === -1 ? '' : path.slice(0, i);
}

function baseOf(path) {
  const i = path.lastIndexOf('/');
  return i === -1 ? path : path.slice(i + 1);
}

/** `??` (and `!!` for ignored) are the codes git uses for paths it has no index entry for. */
function isUntracked(code) {
  return typeof code === 'string' && code.includes('?');
}

/**
 * Undo git's `core.quotePath` escaping: `"docs/caf\303\251.png"` -> `docs/café.png`.
 * Octal escapes are UTF-8 *bytes*, so they are collected and decoded together.
 */
export function unquoteGitPath(raw) {
  if (typeof raw !== 'string') return '';
  if (raw.length < 2 || !raw.startsWith('"') || !raw.endsWith('"')) return raw;
  const body = raw.slice(1, -1);
  const bytes = [];
  const pushChar = (ch) => {
    for (const b of ENCODER.encode(ch)) bytes.push(b);
  };
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch !== '\\') {
      pushChar(ch);
      continue;
    }
    const next = body[++i];
    if (next === undefined) break;
    switch (next) {
      case 'a': bytes.push(0x07); break;
      case 'b': bytes.push(0x08); break;
      case 't': bytes.push(0x09); break;
      case 'n': bytes.push(0x0a); break;
      case 'v': bytes.push(0x0b); break;
      case 'f': bytes.push(0x0c); break;
      case 'r': bytes.push(0x0d); break;
      case '"': bytes.push(0x22); break;
      case '\\': bytes.push(0x5c); break;
      default:
        if (next >= '0' && next <= '7') {
          bytes.push(parseInt(body.slice(i, i + 3), 8) & 0xff);
          i += 2;
        } else {
          pushChar(next);
        }
    }
  }
  return DECODER.decode(Uint8Array.from(bytes));
}

/** Repo-relative, forward slashes, no `./` prefix — the shape the rules expect. */
export function normalizePath(raw) {
  let p = unquoteGitPath(String(raw ?? '').trim());
  p = p.replace(/\\/g, '/');
  while (p.startsWith('./')) p = p.slice(2);
  p = p.replace(/\/+$/, '');
  return p;
}

/**
 * Split one porcelain v1 line into its status code and the path(s) it names.
 * Returns null for blank lines. Rename/copy lines (`R  old -> new`) carry two
 * paths and both are returned — a file renamed *out of* `src/` still changes
 * the build.
 */
export function parsePorcelainLine(line) {
  if (typeof line !== 'string') return null;
  const raw = line.replace(/\r$/, '');
  if (!raw.trim()) return null;

  // `XY path`: two status columns, one space, then the path. Older git and
  // hand-written fixtures sometimes trim the leading space, so fall back to
  // splitting on the first run of whitespace.
  let code;
  let rest;
  if (raw.length > 3 && raw[2] === ' ') {
    code = raw.slice(0, 2);
    rest = raw.slice(3);
  } else {
    const m = raw.match(/^(\S{1,2})\s+(.*)$/);
    if (!m) return null;
    code = m[1].padEnd(2, ' ');
    rest = m[2];
  }
  rest = rest.trim();
  if (!rest) return null;

  // Only rename/copy statuses use the arrow, so an ordinary filename
  // containing " -> " is not mistaken for one.
  const paths = [];
  const isRenameCopy = code.includes('R') || code.includes('C');
  const arrow = isRenameCopy ? rest.indexOf(' -> ') : -1;
  if (arrow !== -1) {
    paths.push(normalizePath(rest.slice(0, arrow)));
    paths.push(normalizePath(rest.slice(arrow + 4)));
  } else {
    paths.push(normalizePath(rest));
  }

  return { code, paths: paths.filter(Boolean), raw };
}

/**
 * Classify one repo-relative path. `code` is the porcelain status, needed only
 * by the "untracked under docs/ or critic/" rule.
 */
export function classifyPath(path, code = '') {
  const p = normalizePath(path);
  if (!p) return { category: 'build', rule: UNCLASSIFIED_RULE };
  for (const { rule, test } of NOISE_RULES) {
    if (test(p, code)) return { category: 'noise', rule };
  }
  for (const { rule, test } of BUILD_RULES) {
    if (test(p, code)) return { category: 'build', rule };
  }
  return { category: 'build', rule: UNCLASSIFIED_RULE };
}

/**
 * Classify one porcelain line. A line is build-relevant if *any* of its paths
 * is, so a rename that straddles the boundary stops the deploy.
 */
export function classifyPorcelainLine(line) {
  const parsed = parsePorcelainLine(line);
  if (!parsed) return null;
  const verdicts = parsed.paths.map((p) => classifyPath(p, parsed.code));
  const build = verdicts.find((v) => v.category === 'build');
  const chosen = build ?? verdicts[0] ?? { category: 'build', rule: UNCLASSIFIED_RULE };
  return {
    raw: parsed.raw,
    code: parsed.code,
    paths: parsed.paths,
    category: chosen.category,
    rule: chosen.rule,
  };
}

/**
 * Classify a whole `git status --porcelain` dump.
 *
 * `blocked` is the deploy's answer: true when at least one build-relevant path
 * is dirty. An empty or all-noise tree is not blocked.
 */
export function classifyPorcelain(porcelain) {
  const entries = String(porcelain ?? '')
    .split('\n')
    .map((line) => classifyPorcelainLine(line))
    .filter((e) => e !== null);
  const buildRelevant = entries.filter((e) => e.category === 'build');
  const fleetNoise = entries.filter((e) => e.category === 'noise');
  return { entries, buildRelevant, fleetNoise, blocked: buildRelevant.length > 0 };
}
