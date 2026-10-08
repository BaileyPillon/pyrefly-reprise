/**
 * Reading and writing `public/audio/manifest.json` when more than one agent is
 * rendering at once.
 *
 * The old code did the obvious thing: read the manifest at the top of the run,
 * hold it in memory for the six minutes the renders take, add its own entries
 * and write the whole object back at the end. Two renders overlapping means
 * the second one's write is built on a snapshot from before the first one
 * finished, so the first one's cues **vanish from the manifest** while their
 * MP3s sit on disk unlisted — and an unlisted cue silently falls back to the
 * oscillator render, which is the one failure this pipeline exists to prevent.
 * It has happened: `docs/audio/PIPELINE.md` records a `title` entry whose
 * `loopEnd` was eleven seconds past the end of the file it named.
 *
 * Three things fix it, and all three are needed:
 *
 * 1. **A lock.** `open(..., 'wx')` is atomic on every platform we run on, so
 *    exactly one process holds `manifest.json.lock` at a time. The lock file
 *    carries its owner's pid and start time so a crashed render can be
 *    detected rather than blocking the next one forever.
 * 2. **Re-read inside the lock.** The merge is against what is on disk *now*,
 *    not against whatever was there when this process started. A render only
 *    ever writes the cues it rendered; every other key is copied through
 *    untouched.
 * 3. **Atomic rename.** Write a temp file in the same directory and `rename`
 *    it over the target. A reader either sees the whole old file or the whole
 *    new one — never a half-written one, which `JSON.parse` would reject and
 *    the game would treat as "nothing is pre-rendered".
 */

import { createHash } from 'node:crypto';
import { mkdir, open, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** How long to wait for another render's lock before assuming it died. */
const STALE_LOCK_MS = 120_000;
/** How long to keep trying before giving up entirely. */
const LOCK_TIMEOUT_MS = 180_000;
const RETRY_MS = 120;

const EMPTY = { version: 1, sampleRate: 44100, music: {}, sfx: null };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function manifestPath(outRoot) {
  return join(outRoot, 'manifest.json');
}

/**
 * Read the manifest, tolerating absence and corruption.
 *
 * A manifest that will not parse is treated as empty rather than fatal: the
 * game already treats it that way, and refusing to render because a previous
 * crash left a truncated file would be the wrong end of the stick.
 */
export async function readManifest(outRoot) {
  try {
    const parsed = JSON.parse(await readFile(manifestPath(outRoot), 'utf8'));
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY };
    return {
      ...EMPTY,
      ...parsed,
      music: parsed.music && typeof parsed.music === 'object' ? parsed.music : {},
    };
  } catch {
    return { ...EMPTY };
  }
}

async function readLock(lockPath) {
  try {
    return JSON.parse(await readFile(lockPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Is this lock file abandoned?
 *
 * Getting this wrong in either direction hurts: never stealing means one
 * crashed render blocks every later one, and stealing too eagerly is the race
 * back again. So: a lock whose owner process is gone is free immediately, a
 * lock held by a live process is respected until it is two minutes old (the
 * critical section is a merge and a rename — milliseconds), and a lock we
 * cannot read at all is judged on its age.
 */
async function lockIsStale(lockPath) {
  let info;
  try {
    info = await stat(lockPath);
  } catch {
    // It went away while we were looking: not stale, just gone.
    return false;
  }
  const ageMs = Date.now() - info.mtimeMs;
  const owner = await readLock(lockPath);
  if (owner && typeof owner.pid === 'number') {
    // Our own lock, further up our own stack. Never steal it from ourselves.
    if (owner.pid === process.pid) return false;
    try {
      // Signal 0 tests for existence without touching the process.
      process.kill(owner.pid, 0);
    } catch (error) {
      // ESRCH: nobody is home. EPERM: somebody is, we just cannot signal them.
      return error?.code === 'ESRCH';
    }
    if (ageMs > STALE_LOCK_MS) {
      console.warn(
        `audio manifest: taking ${lockPath} from pid ${owner.pid}, which has held it for ` +
          `${(ageMs / 1000).toFixed(0)}s.`,
      );
      return true;
    }
    return false;
  }
  return ageMs > STALE_LOCK_MS;
}

/**
 * Hold the manifest lock for the duration of `fn`.
 *
 * Keep `fn` short. It runs with every other renderer on the machine waiting,
 * so it should merge and return — not render, not encode, not measure.
 */
export async function withManifestLock(outRoot, fn) {
  await mkdir(outRoot, { recursive: true });
  const lockPath = `${manifestPath(outRoot)}.lock`;
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  let handle = null;
  for (;;) {
    try {
      handle = await open(lockPath, 'wx');
      break;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      if (await lockIsStale(lockPath)) {
        // Whoever wrote this is gone. Taking it is safe because the write it
        // guards is a single rename: a dead process cannot be mid-write.
        await rm(lockPath, { force: true });
        continue;
      }
      if (Date.now() > deadline) {
        const owner = await readLock(lockPath);
        throw new Error(
          `Timed out waiting for ${lockPath}` +
            (owner?.pid ? ` (held by pid ${owner.pid} since ${owner.since})` : '') +
            '. If no render is running, delete it.',
        );
      }
      await sleep(RETRY_MS + Math.floor(Math.random() * RETRY_MS));
    }
  }
  try {
    await handle.writeFile(
      JSON.stringify({ pid: process.pid, since: new Date().toISOString(), argv: process.argv.slice(2) }),
    );
    await handle.close();
    handle = null;
    return await fn();
  } finally {
    if (handle) await handle.close().catch(() => {});
    await rm(lockPath, { force: true });
  }
}

/**
 * Write the manifest so a reader never sees a partial file.
 *
 * The rename is retried because Windows fails it with EPERM while any other
 * process has the destination open — and something usually does: `qa.mjs`,
 * the audition page builder, a dev server, an editor. A handful of retries
 * costs nothing and keeps the swap atomic, which writing in place would not.
 */
async function writeManifestAtomically(outRoot, manifest) {
  const target = manifestPath(outRoot);
  const temp = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temp, `${JSON.stringify(manifest, null, 2)}\n`);
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(temp, target);
      return;
    } catch (error) {
      const transient = error?.code === 'EPERM' || error?.code === 'EACCES' || error?.code === 'EBUSY';
      if (!transient || attempt >= 24) {
        await rm(temp, { force: true });
        throw error;
      }
      await sleep(20 + attempt * 5);
    }
  }
}

/**
 * Merge this render's entries into whatever is on disk, under the lock.
 *
 * `patch` is `{ music?, sfx?, sampleRate? }`. Only the music keys it names are
 * replaced; cues another render added while this one was working are left
 * exactly as they are. Returns the merged manifest.
 */
export async function mergeIntoManifest(outRoot, patch) {
  return withManifestLock(outRoot, async () => {
    const live = await readManifest(outRoot);
    const merged = {
      ...live,
      version: live.version ?? 1,
      sampleRate: patch.sampleRate ?? live.sampleRate ?? EMPTY.sampleRate,
      music: { ...live.music, ...(patch.music ?? {}) },
      sfx: patch.sfx === undefined ? (live.sfx ?? null) : patch.sfx,
    };
    // Keys in a stable order so two renders of the same cue produce the same
    // file and the diff in a commit is only what actually changed.
    merged.music = Object.fromEntries(Object.entries(merged.music).sort(([a], [b]) => a.localeCompare(b)));
    await writeManifestAtomically(outRoot, merged);
    return merged;
  });
}

/**
 * Edit the live manifest in place under the lock.
 *
 * For changes that are a function of what is already there — moving a loop
 * point onto the right sample, say — where re-reading outside the lock and
 * writing a whole entry back would clobber a fresher render of that cue.
 * `mutate` is handed the on-disk manifest and may change it; whatever it
 * returns (or the object itself) is written atomically.
 */
export async function updateManifest(outRoot, mutate) {
  return withManifestLock(outRoot, async () => {
    const live = await readManifest(outRoot);
    const next = (await mutate(live)) ?? live;
    await writeManifestAtomically(outRoot, next);
    return next;
  });
}

/**
 * Loop points, rounded the one way they are allowed to be rounded.
 *
 * Six decimals, not four. Four decimal places of a second is 4.4 samples at
 * 44.1 kHz, so a rounded loop point lands *beside* the sample the seam
 * crossfade matched and the wrap steps by whatever the waveform was doing in
 * between — an impulse, once per loop, on cues that are otherwise seamless.
 * Six decimals resolves to a twentieth of a sample and costs two bytes.
 * `tests/unit/audio-shipped-files.test.ts` fails if an entry drifts off a
 * sample boundary again.
 */
export const LOOP_DECIMALS = 6;

/**
 * The shipping budget for public/audio (music files + the sfx sprite), in bytes. Raised from 60 MB to
 * 85 MB under D-292 (music O1): Bailey, 2026-09-29, "yes, all your recommendations", accepting the
 * whole score re-encoded at LAME V0, which grows the music from 40.2 MB to 78.2 MB (the recommendation
 * said "about 73 MB"; the measured total is 80.9 MB with the 2.7 MB sfx sprite). Raised from 85 MB to
 * 90 MB under D-306: Bailey, 2026-09-30, "I'll go with all of your recommendations please keep going",
 * accepting the driver's recommendation that the recorded set's second sprite (sfx/sprite-v2.mp3, D-302)
 * ship at LAME V0 like the music: 3.30 MB at q3 to 4.89 MB at V0, total 86.90 MB to 88.49 MB.
 * qa.mjs, render.mjs and tests/unit/audio-shipped-files.test.ts all read this one constant.
 */
export const AUDIO_BUDGET_BYTES = 90e6;

/**
 * The recorded voice-over's own budget line, beside {@link AUDIO_BUDGET_BYTES} (which stays 90 MB for music and the sfx sprites,
 * and stood at 88.49 MB with 1.5 MB to spare when the voice work began). PROPOSED, awaiting Bailey's decision:
 * docs/audio/voice-integration-design.md section 2 sizes the whole game's voice at about 15 MB (mono, 24 kHz, 64 kbps) and proposes a
 * separate 20 MB line, loaded lazily per chapter and never at first load. Pass 1 (Tidus, Yuna and Auron, FFX only) is a fraction of it
 * (docs/handoff/r395-voice.md has the measured size). `tools/audio/voice-audit.mjs` enforces it; qa.mjs (the deploy preflight) and the audio-voice-shipped test call that.
 */
export const VOICE_BUDGET_BYTES = 20e6;

export function secondsAtSample(sample, sampleRate) {
  return Number((sample / sampleRate).toFixed(LOOP_DECIMALS));
}

/**
 * A fingerprint of the score an MP3 was rendered from.
 *
 * Every other check in this folder can be passed by a file that is simply out
 * of date. `themes-audit.mjs` reads the score and says the theme is present;
 * `qa.mjs` decodes the MP3 and says it is well mastered; and both are content
 * with an MP3 rendered from a composition that was replaced afterwards. That
 * is not hypothetical — `battle-ffx` shipped exactly that way: the score was
 * rewritten in a79e4bb and the render was never redone, so every tool agreed
 * the cue was correct while the player heard the previous composition.
 *
 * So the renderer records what it rendered from. The hash covers only what
 * changes the audio: tempo, meter, loop, and every channel's instrument,
 * level, placement, sends, performance overrides and notes. Prose in the
 * file's header does not move it, which matters — a comment-only edit must
 * not demand six minutes of CPU on a shared machine.
 */
export function scoreFingerprint(track) {
  const channels = (track.channels ?? []).map((c) => [
    c.name ?? null,
    c.instrument ?? null,
    c.volume ?? null,
    c.pan ?? null,
    c.gate ?? null,
    c.fx ? Object.entries(c.fx).sort(([a], [b]) => (a < b ? -1 : 1)) : null,
    c.perform ? Object.entries(c.perform).sort(([a], [b]) => (a < b ? -1 : 1)) : null,
    c.notes ?? [],
  ]);
  const shape = JSON.stringify([
    track.bpm ?? null,
    track.tempo ?? null,
    track.timeSig ?? null,
    track.loop ?? null,
    channels,
  ]);
  return createHash('sha256').update(shape).digest('hex').slice(0, 16);
}

/**
 * Where a music entry's MP3 came from when it is not a render of the score in the repo.
 *
 * Every entry `musicEntry()` writes is a render of `src/audio/tracks/<cue>.ts`, and `qa.mjs` and
 * `tests/unit/audio-shipped-files.test.ts` hold it to that score: loop points that match the score's, and a
 * fingerprint of the notes. A file made somewhere else and installed under a cue's name (the ElevenLabs takes of
 * 2026-10-07, `docs/audio/music-elevenlabs-2026-10-07.json`) has no score behind it, so both checks would call
 * it a stale render. It says what it is with `source`, and that one field is what exempts it from them.
 *
 * The game ignores the field (`parseManifest` reads only the keys it knows). The score stays in the repo as the
 * synth fallback for when the MP3 cannot load, and re-rendering the cue writes a fresh entry without `source`,
 * which ends the exemption by itself. `tests/unit/audio-music-elevenlabs.test.ts` pins which entries carry it, so
 * a `source` cannot be added to an entry without a record that says where the file came from.
 */
export function externalSource(entry) {
  return typeof entry?.source === 'string' && entry.source.length > 0 ? entry.source : null;
}

/** The keys of a music entry, in the order the manifest writes them; anything else follows in the order given. */
const ENTRY_KEY_ORDER = ['file', 'loopStart', 'loopEnd', 'duration', 'bytes', 'lufs', 'truePeakDb', 'score', 'source'];

/**
 * A number the way the stored manifest prints it. The two level fields are floats whatever their value, so they
 * always carry a decimal point (`"lufs": -16.0`); every other number prints plainly (`"loopEnd": 80` for a loop
 * that ends on a whole second, as three entries on disk do).
 */
function entryNumberText(key, value) {
  if ((key === 'lufs' || key === 'truePeakDb') && Number.isInteger(value)) return value.toFixed(1);
  return String(value);
}

/**
 * Replace one music entry's block in the manifest's text and leave every other byte exactly as it was.
 *
 * `JSON.stringify` cannot do this. The manifest on disk keeps the line endings the checkout gave it (CRLF on this
 * machine) and writes its floats Python-style (`"lufs": -16.0`), so a parse and a stringify rewrites every entry
 * and turns a three-cue change into a whole-file diff that conflicts with every other branch that touches one
 * cue. This finds the block by its own opening line, writes the new one in the same shape, and keeps the closing
 * line (with or without its comma) as it was. Used by `music-elevenlabs.mjs install`; callers take the manifest
 * lock around it (`withManifestLock`) the way every other writer here does.
 */
export function setMusicEntryText(text, name, entry) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(eol);
  const start = lines.indexOf(`    "${name}": {`);
  if (start < 0) throw new Error(`the manifest has no music entry "${name}"`);
  let end = start + 1;
  while (end < lines.length && !/^ {4}},?$/.test(lines[end])) end++;
  if (end >= lines.length) throw new Error(`the manifest entry "${name}" never closes`);

  const keys = [
    ...ENTRY_KEY_ORDER.filter((k) => entry[k] !== undefined),
    ...Object.keys(entry).filter((k) => !ENTRY_KEY_ORDER.includes(k) && entry[k] !== undefined),
  ];
  const body = keys.map((key, i) => {
    const value = entry[key];
    if (typeof value !== 'string' && typeof value !== 'number') throw new Error(`entry "${name}": "${key}" must be a string or a number`);
    const printed = typeof value === 'string' ? JSON.stringify(value) : entryNumberText(key, value);
    return `      "${key}": ${printed}${i < keys.length - 1 ? ',' : ''}`;
  });
  lines.splice(start, end - start + 1, `    "${name}": {`, ...body, lines[end]);
  return lines.join(eol);
}

/** Build one music entry, with every field rounded where it should be. */
export function musicEntry({ name, loopStartSample, loopEndSample, totalSamples, sampleRate, bytes, lufs, truePeakDb, score }) {
  return {
    file: `music/${name}.mp3`,
    loopStart: secondsAtSample(loopStartSample, sampleRate),
    loopEnd: secondsAtSample(loopEndSample, sampleRate),
    duration: Number((totalSamples / sampleRate).toFixed(4)),
    bytes,
    lufs: Number(lufs.toFixed(2)),
    truePeakDb: Number(truePeakDb.toFixed(2)),
    // Absent on an entry written before this field existed, which QA reports
    // as unverifiable rather than as a failure: the cue simply has not been
    // rendered since, and it fills itself in the next time anyone renders it.
    ...(score ? { score } : {}),
  };
}
