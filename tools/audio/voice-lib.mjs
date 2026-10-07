/**
 * The FFX voice set (Tidus, Yuna, Auron): which lines are recorded, how they are named, and the paths the generator and
 * the ship step share. Pure helpers: nothing here touches the network or the key.
 *
 * Game case: FFX only. Bailey picked these three voices against the real FFX (2026-10-07: "Tidus: B / Yuna: B / Auron: B"),
 * so FFX-2 Yuna (`yuna-x2`) and FFX-2 chapters are never selected here; every other speaker stays text-only until he picks.
 *
 * The inventory (`docs/audio/voice-line-inventory.json`, `tools/audio/voice-inventory.mjs`) is the contract: a line's id and
 * `textHash` come from it, and the game finds a recording by the same hash (`src/story/voice/voiceKey.ts`).
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** The voices recorded in this pass, in the order the plan lists them. */
export const FFX_VOICES = ['tidus', 'yuna', 'auron'];
export const FFX_GAME = 'ffx';
export const DEFAULT_MODEL = 'eleven_v4';
/** Where a build's mp3s are read from and written to: `public/audio/voice/<chapter>/<id>.mp3`, one manifest per chapter beside it. */
export const VOICE_PUBLIC_DIR = 'public/audio/voice';

/**
 * Lines the game can speak for these voices.
 *
 * `victoryLine` (`src/ui/common/victoryLine.ts`) serves only the FIRST line of a member's bank (Bailey's pick, PR-0021: "exactly
 * the first lines"), so a quip with `order > 1` can never be heard; recording it would spend credits and ship bytes for nothing.
 * They are left out unless `includeUnservedQuips` is set (the day the rotation is opened).
 */
export function selectLines(doc, { voices = FFX_VOICES, game = FFX_GAME, includeUnservedQuips = false } = {}) {
  const want = new Set(voices);
  const out = [];
  for (const line of doc.lines) {
    if (line.game !== game || line.voiced !== 'yes' || !want.has(line.voice)) continue;
    if (line.treatment) continue; // a treatment (Farplane, narration...) needs the ship chain's post-processing: not this pass
    const unserved = line.kind === 'quip' && line.order > 1;
    if (unserved && !includeUnservedQuips) continue;
    out.push(line);
  }
  return out;
}

/**
 * One recording per distinct (voice, text): a repeated line ("...Okay. Next one." closes four chapters) shares the first
 * occurrence's take. Grouped among the SELECTED lines only, so a recording is never owed to a line that was filtered out.
 * Returns the recordings (first occurrence, in script order) and a map from every selected line id to its recording's id.
 */
export function planRecordings(selected) {
  const first = new Map();
  const recordings = [];
  const recordingOf = new Map();
  for (const line of selected) {
    const key = `${line.voice}\u0000${line.text}`;
    if (!first.has(key)) {
      first.set(key, line.id);
      recordings.push(line);
    }
    recordingOf.set(line.id, first.get(key));
  }
  return { recordings, recordingOf };
}

/**
 * The text either side of a line in its own script, whoever speaks it: the previous and next voiced primary line of the same
 * chapter and part. ElevenLabs takes these as `previous_text` / `next_text` to keep a short line's delivery in context.
 * A quip stands alone; a stand-in takes its primary line's neighbours.
 */
export function neighbours(doc, line) {
  if (line.kind === 'quip') return {};
  const order = line.order;
  const same = doc.lines.filter((l) => l.chapter === line.chapter && l.part === line.part && l.kind !== 'fallback' && l.voiced === 'yes');
  const before = same.filter((l) => l.order < order).sort((a, b) => b.order - a.order)[0];
  const after = same.filter((l) => l.order > order).sort((a, b) => a.order - b.order)[0];
  return { previous: before?.text, next: after?.text };
}

/** A fixed seed per line (and per retake), so a take can be asked for again. 0 to 2^32-1, from the line's own hash. */
export function seedFor(line, take = 1) {
  return (Number.parseInt(line.textHash.slice(0, 8), 16) + (take - 1)) % 4294967296;
}

/** `<out>/<id>.mp3` for take 1, `<out>/<id>.take<N>.mp3` for a retake. */
export function takeFile(out, id, take = 1) {
  return path.join(out, take === 1 ? `${id}.mp3` : `${id}.take${take}.mp3`);
}

/** The take a recording was picked at (`<candidates>/picks.json`: { "<id>": 2 }); take 1 when none. */
export function pickedTake(picks, id) {
  const n = Number(picks?.[id]);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/**
 * The saved voice for each speaker, from `voices.json` (written by `elevenlabs.mjs save-voice`, outside the repo): the option
 * Bailey picked (`_picked`) of each requested voice. Returns { voice: { option, id } }. Voice ids stay out of the repo and the logs.
 */
export function pickedVoices(home, voices = FFX_VOICES) {
  const file = path.join(home, 'voices.json');
  if (!existsSync(file)) throw new Error(`no voices file at ${file}: save the picked voices first (elevenlabs.mjs save-voice)`);
  const saved = JSON.parse(readFileSync(file, 'utf8'));
  const picked = saved._picked ?? {};
  const out = {};
  for (const voice of voices) {
    const option = picked[voice];
    const id = option ? saved[voice]?.[option] : undefined;
    if (!option || typeof id !== 'string' || !id) throw new Error(`no picked voice for "${voice}" in ${file} (_picked.${voice} = ${option ?? 'unset'})`);
    out[voice] = { option, id };
  }
  return out;
}

const count = (n) => n.toLocaleString('en-US');

/** Per-voice and per-chapter totals of a recording list (lines = every selected line, recordings = distinct takes). */
export function summarise(selected, recordings) {
  const by = (list, key) => {
    const m = new Map();
    for (const l of list) m.set(l[key], (m.get(l[key]) ?? 0) + 1);
    return m;
  };
  const chars = (list) => list.reduce((a, l) => a + l.chars, 0);
  return {
    lines: selected.length, recordings: recordings.length, chars: chars(selected), recordedChars: chars(recordings),
    byVoice: Object.fromEntries(FFX_VOICES.map((v) => [v, { lines: selected.filter((l) => l.voice === v).length, recordings: recordings.filter((l) => l.voice === v).length, recordedChars: chars(recordings.filter((l) => l.voice === v)) }])),
    byChapter: Object.fromEntries([...by(selected, 'chapter')].map(([ch, n]) => [ch, { lines: n, recordings: recordings.filter((l) => l.chapter === ch).length, recordedChars: chars(recordings.filter((l) => l.chapter === ch)) }])),
  };
}

/**
 * The generation plan as a markdown document: totals, the commands, then every recording (id, chapter, speaker, characters,
 * text). `generated` is a one-line note for the header (the tool and date); no clock is read here so the output is deterministic.
 */
export function planMarkdown({ selected, recordings, recordingOf, skippedQuips, model, credits, usd, commands, generated }) {
  const s = summarise(selected, recordings);
  const shared = selected.length - recordings.length;
  const out = [];
  out.push('# FFX voice pass 1: Tidus, Yuna and Auron (generation plan)', '');
  out.push(`${generated}. **Game case: FFX only.** Bailey, 2026-10-07: "add tidus, yuna, and auron voiced lines in the game"; he picked **Tidus B, Yuna B, Auron B** by ear, against the real FFX. FFX-2 Yuna and every other speaker stay text-only.`, '');
  out.push(`**${count(s.recordings)} recordings** cover **${count(s.lines)} lines** (${count(shared)} repeats share a take), **${count(s.recordedChars)} characters billed**, model \`${model}\`, one take each: about **${count(credits)} credits (${usd})** at the API list price.`);
  out.push(`${count(skippedQuips)} victory quips that the game can never show are left out (\`victoryLine\` serves only a bank's first line); \`--include-unserved-quips\` adds them.`, '');
  out.push('| Voice | Lines | Recordings | Characters |', '|---|---|---|---|');
  for (const [v, x] of Object.entries(s.byVoice)) out.push(`| \`${v}\` | ${x.lines} | ${x.recordings} | ${count(x.recordedChars)} |`);
  out.push('', '| Chapter | Lines | Recordings | Characters |', '|---|---|---|---|');
  for (const [ch, x] of Object.entries(s.byChapter)) out.push(`| \`${ch}\` | ${x.lines} | ${x.recordings} | ${count(x.recordedChars)} |`);
  out.push('', '## Commands (run from the repo root; the driver runs the paid ones)', '', '```', ...commands, '```', '');
  out.push('## Every recording', '', 'One row per recording. "also" lists later lines (other chapters, quips) that repeat it word for word and share its file. Stand-ins (`.fbN`) are a benched speaker\'s line said by this voice.', '');
  out.push('| Line id | Chapter | Voice | Chars | Text |', '|---|---|---|---|---|');
  for (const r of recordings) {
    const text = r.text.replace(/\|/g, '\\|');
    const repeats = selected.filter((l) => l.id !== r.id && recordingOf.get(l.id) === r.id).map((l) => l.id);
    out.push(`| \`${r.id}\` | ${r.chapter} | ${r.voice} | ${r.chars} | ${text}${repeats.length ? ` _(also ${repeats.map((i) => `\`${i}\``).join(', ')})_` : ''} |`);
  }
  out.push('');
  return out.join('\n');
}
