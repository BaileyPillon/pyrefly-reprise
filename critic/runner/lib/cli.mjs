// Tiny CLI-arg helper shared by play.mjs, supp.mjs and gap-audio.mjs.
// Not a general-purpose argv parser: just enough to read `--flag=value` pairs
// and positional args, and to fail loudly (not with a hardcoded fallback)
// when a script needs --base or --evidence and neither the flag nor the
// matching env var was given. Hardcoding a port or a round's evidence path
// into the harness itself is exactly how these scripts drifted out of date
// between rounds (round-06's lib.mjs baked in `127.0.0.1:5473` and
// `critic/rounds/round-06/evidence`); the caller must say both explicitly.
export function parseArgs(argv) {
  const out = { _: [] };
  for (const raw of argv) {
    const m = /^--([^=]+)=(.*)$/.exec(raw);
    if (m) {
      out[m[1]] = m[2];
    } else if (raw.startsWith('--')) {
      out[raw.slice(2)] = true;
    } else {
      out._.push(raw);
    }
  }
  return out;
}

export function requireBase(args) {
  const base = args.base ?? process.env.PYREFLY_BASE;
  if (!base) {
    throw new Error('Missing --base=<url> (or PYREFLY_BASE): the URL the subject is served on, e.g. http://127.0.0.1:5473/pyrefly-reprise/.');
  }
  return base.endsWith('/') ? base : `${base}/`;
}

export function requireEvidence(args) {
  const evidence = args.evidence ?? process.env.PYREFLY_EVIDENCE;
  if (!evidence) {
    throw new Error('Missing --evidence=<dir> (or PYREFLY_EVIDENCE): the round\'s evidence directory to write into, e.g. critic/rounds/round-07/evidence.');
  }
  return evidence;
}
