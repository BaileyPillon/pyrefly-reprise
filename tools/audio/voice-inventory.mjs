#!/usr/bin/env node
/**
 * The voice-line inventory: every line the story can speak, read straight from the scripts.
 *
 * Why it exists (groundwork for original voice-overs, docs/audio/elevenlabs-plan.md): ElevenLabs bills by
 * characters, and a voiced line needs a stable id that survives edits. Nothing here is typed by hand: the
 * lines come from `src/story/registry.ts` (every chapter's `pre`, `post`, mid-battle scripts and victory
 * quips, including the authored stand-ins for a benched speaker). Node's type stripping loads the .ts files
 * directly, so there is no build step and no dependency.
 *
 *   node tools/audio/voice-inventory.mjs            write docs/audio/voice-line-inventory.{json,md}
 *   node tools/audio/voice-inventory.mjs --check    exit 1 when either file is stale (a script changed)
 *   node tools/audio/voice-inventory.mjs --stdout   print the summary tables only
 *
 * Line ids are stable by construction: the committed JSON is read first, a line whose chapter, script, speaker
 * and text are unchanged keeps its id, a new line takes the next number in its script, and a line that was
 * edited or removed is moved to `retired` and its id is never reused (an edit is a new line: it needs a new
 * recording). Output is deterministic (no clock, no commit hash), so `--check` is exact.
 *
 * Game case: both. Every row names its game (AGENTS.md rule 14); FFX-2 ids carry the `-x2` speaker ids.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const opt = (name, fallback) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const JSON_PATH = path.resolve(opt('json', path.join(ROOT, 'docs/audio/voice-line-inventory.json')));
const MD_PATH = path.resolve(opt('md', path.join(ROOT, 'docs/audio/voice-line-inventory.md')));

const registry = await import('../../src/story/registry.ts');
const encounters = await import('../../src/data/encounters.ts');
const { PARTY_SPEAKERS } = await import('../../src/story/fieldedSpeakers.ts');
const { typingDurationMs } = await import('../../src/ui/common/typewriter.ts');

// The rules this tool applies (all of them are written into the JSON header).

/** Natural speech for a game line: about 150 words a minute, plus a little air either side. */
const SPEECH_CPS = 15;
const SPEECH_PAD_MS = 250;
const SHORT_CHARS = 12;

/** One casting voice can play several speaker ids (the plate reads "Seymour" for all four; Brother is one man). */
const VOICE_OF = { 'seymour-macalania': 'seymour', 'seymour-omnis': 'seymour', 'seymour-natus': 'seymour', 'brother-x2': 'brother' };
/** `none` is a caption (stage direction) except in these scripts, where an unnamed person really speaks. */
const NPC_VOICES = { 'yunalesca/pre': 'npc-dome-voice', 'seymour-anima-macalania/post': 'npc-yevon-officer' };
/** Never given a line (research/writing-bible.md 1.13; Bahamut speaks in roars): a line for them is not voiced. */
const NEVER_SPEAKS = new Set(['yu-yevon', 'bahamut']);
/** The FFX dead who speak from the Farplane inside FFX-2's Chapter V get a treatment, not a second voice. */
const FARPLANE = new Set(['jecht', 'braska', 'auron']);
/** Chapters whose scripts another chapter reads by reference (branch exp-leblanc 8d898f9f, not on main when this was written). */
const SHARED_BY = { 'ffx2-leblanc': ['exp-leblanc'] };

const chars = (s) => [...s].length;
/** cyrb53 (public domain), a synchronous 53-bit hash the browser can compute from the speaker and text the dialogue box holds;
 *  it moves into src/story/voiceKey.ts when the code is written, with a test that pins it to this one. */
function hash53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
const sha = (s) => hash53(s).toString(16).padStart(14, '0');
const speechMs = (text) => Math.round((chars(text) / SPEECH_CPS) * 1000 + SPEECH_PAD_MS);
const lf = (text) => text.split('\r\n').join('\n'); // a checkout with autocrlf turns the files into CRLF
const count = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Say and narrate steps in play order, through `parallel` and both legs of `ifFlag`. */
function* walk(steps, branch = '') {
  for (const s of steps) {
    if (s.type === 'say' || s.type === 'narrate') yield { step: s, branch };
    else if (s.type === 'parallel') yield* walk(s.steps, branch);
    else if (s.type === 'ifFlag') {
      const cond = `${s.key}${s.equals !== undefined ? `==${s.equals}` : ''}`;
      yield* walk(s.then, branch ? `${branch} & ${cond}` : cond);
      yield* walk(s.else ?? [], branch ? `${branch} & !(${cond})` : `!(${cond})`);
    }
  }
}

function describeWhen(w) {
  const bits = [w.type, w.who];
  for (const k of ['ability', 'status']) if (w[k] !== undefined) bits.push(w[k]);
  if (w.form !== undefined) bits.push(`form ${w.form}`);
  if (w.fraction !== undefined) bits.push(`below ${Number(w.fraction.toFixed(2))}`);
  if (w.at !== undefined) bits.push(`at ${w.at}`);
  if (w.onAeon) bits.push('on an aeon');
  return bits.join(' ');
}

/** Who voices it, how, and whether it is voiced at all. */
function classify(speaker, text, game, chapterKey, part, voiceKey) {
  let voice = VOICE_OF[speaker] ?? speaker;
  let treatment = null;
  let voiced = 'yes';
  let reason = null;
  if (speaker === 'none') {
    const npc = NPC_VOICES[`${chapterKey}/${part}`];
    if (npc) voice = npc;
    else [voice, voiced, reason] = ['caption', 'no', 'caption: a stage direction, text only'];
  } else if (NEVER_SPEAKS.has(speaker)) [voiced, reason] = ['no', 'this speaker never has a spoken line'];
  if (/^[\s.…]+$/.test(text)) [voiced, reason] = ['no', 'silent beat: ellipsis only'];
  // `narrate` is Tidus looking back in FFX; in FFX-2's chapters it is Yuna ("I let her.", "I woke in the Songstress dress"; writing bible 2.2).
  if (speaker === 'narrator' && game === 'ffx2') [voice, treatment] = ['yuna-x2', 'narration'];
  if (game === 'ffx2' && FARPLANE.has(speaker)) treatment = 'farplane';
  if (speaker === 'seymour-omnis') treatment = 'inside-sin';
  if (speaker === 'seymour-natus') treatment = 'transformed';
  if (voiceKey === 'yuna-lenne-doubled') treatment = 'doubled-with-lenne';
  return { voice, treatment, voiced, reason };
}

function flagsFor(text) {
  const f = [];
  if (/^[\s.…]+$/.test(text)) f.push('ellipsis-only');
  if (chars(text) < SHORT_CHARS) f.push('short');
  if (/^[\p{L}'’-]+[.!?…]*$/u.test(text.trim())) f.push('one-word');
  if (/[—-]\s*$/.test(text)) f.push('interrupted');
  if (/\b[A-Z]{3,}\b/.test(text)) f.push('shout');
  if (/^(hmph|hn|hm+|ha+|ah+|oh+|ugh|eep|eew+|shh+)\W*$/i.test(text.trim())) f.push('vocalization');
  return f;
}

// Extraction: every say and narrate step, its authored stand-ins, the victory quips and each mid-battle beat.
function extract() {
  const raw = [];
  const beats = [];
  const chapters = [];
  for (const key of registry.CHAPTER_KEYS) {
    const story = registry.STORY_CHAPTERS[key];
    const meta = encounters.getChapter(key);
    const game = meta.game;
    const memberSpeaker = Object.fromEntries(
      Object.entries(PARTY_SPEAKERS[game]).map(([speaker, member]) => [member, speaker]),
    );
    const scripts = [
      ['pre', 'pre', story.pre, null],
      ['post', 'post', story.post, null],
      ...Object.entries(story.midScripts).map(([name, sc]) => [`mid-${name}`, 'mid', sc, name]),
    ];
    for (const [part, script, steps, name] of scripts) {
      const isVoiced = (s) => classify(s.type === 'narrate' ? 'narrator' : s.who, s.text, game, key, part, s.voiceKey).voiced === 'yes';
      let order = 0;
      for (const { step, branch } of walk(steps)) {
        order++;
        const speaker = step.type === 'narrate' ? 'narrator' : step.who;
        const text = step.text;
        const base = { chapter: key, game, part, script, scriptName: name, order, kind: step.type === 'narrate' ? 'narrate' : 'say', speaker, text };
        const c = classify(speaker, text, game, key, part, step.voiceKey);
        raw.push({ ...base, ...c, emotion: step.emotion, auto: step.auto, voiceKey: step.voiceKey, branch, fallbackIndex: 0 });
        (step.fallback ?? []).forEach((alt, j) => {
          const t = alt.text ?? text;
          const ca = classify(alt.who, t, game, key, part, undefined);
          raw.push({ ...base, kind: 'fallback', speaker: alt.who, text: t, ...ca, emotion: alt.emotion, branch, fallbackIndex: j + 1, textFromPrimary: alt.text === undefined });
        });
      }
      if (script === 'mid') {
        const trig = story.mid.find((t) => t.id === name || t.script === name);
        const ai = (registry.AI_EMITTED_TRIGGERS[key] ?? []).includes(name);
        beats.push({
          id: `${key}.mid-${name}`, chapter: key, game, script: name,
          source: trig ? 'trigger' : ai ? 'ai' : 'unreferenced',
          when: trig ? describeWhen(trig.when) : null, once: trig ? trig.once : null,
          seam: registry.CHAIN_SEAMS[key].includes(name),
          budgetMs: registry.budgetFor(key, name),
          authoredMs: Math.round(registry.scriptDurationMs(steps, registry.MID_LINE_HOLD_MS)),
          voicedMs: Math.round(voicedDurationMs(steps, registry.MID_LINE_HOLD_MS, isVoiced)),
          voicedLines: raw.filter((r) => r.chapter === key && r.part === part && r.kind !== 'fallback' && r.voiced === 'yes').length,
        });
      }
    }
    for (const [member, bank] of Object.entries(story.victoryQuips)) {
      const speaker = memberSpeaker[member] ?? member;
      bank.forEach((text, i) => {
        const c = classify(speaker, text, game, key, `quip-${member}`, undefined);
        raw.push({ chapter: key, game, part: `quip-${member}`, script: 'quip', scriptName: member, order: i + 1, kind: 'quip', speaker, text, ...c, branch: '', fallbackIndex: 0 });
      });
    }
    chapters.push({ key, number: meta.number, game, title: meta.title, location: meta.location, music: meta.music, alsoPlaysIn: SHARED_BY[key] ?? [] });
  }
  return { raw, beats, chapters };
}

/** The registry's worst-case duration model, with the spoken line allowed to outlast the typed text and its hold. */
function voicedDurationMs(steps, hold, isVoiced) {
  const one = (s) => {
    switch (s.type) {
      case 'say':
      case 'narrate': {
        const base = typingDurationMs(s.text) + (s.auto ?? hold);
        return isVoiced(s) ? Math.max(base, speechMs(s.text)) : base;
      }
      case 'choice': return registry.BLOCKING_LINE_MS;
      case 'wait': case 'move': case 'camera': case 'flash': case 'shake': case 'fade': return s.ms;
      case 'showActor': case 'hideActor': return s.ms ?? 300;
      case 'parallel': return Math.max(0, ...s.steps.map(one));
      case 'ifFlag': return Math.max(s.then.reduce((a, x) => a + one(x), 0), (s.else ?? []).reduce((a, x) => a + one(x), 0));
      default: return 0;
    }
  };
  return steps.reduce((a, s) => a + one(s), 0);
}

// Stable ids: reuse the id of an unchanged line, number a new one, retire an edited or removed one.
function assignIds(raw, previous) {
  const keyOf = (r) => [r.chapter, r.part, r.kind, r.speaker, r.kind === 'fallback' ? r.fallbackIndex : '', sha(r.text)].join('|');
  const pool = new Map();
  const used = new Set();
  const maxN = new Map();
  const bump = (id) => {
    const m = /^(.*)\.(\d{3})$/.exec(id);
    if (m) maxN.set(m[1], Math.max(maxN.get(m[1]) ?? 0, Number(m[2])));
  };
  for (const p of previous.lines ?? []) {
    const fb = /\.fb(\d+)$/.exec(p.id);
    const k = keyOf({ ...p, fallbackIndex: fb ? Number(fb[1]) : 0 });
    if (!pool.has(k)) pool.set(k, []);
    pool.get(k).push(p.id);
    bump(p.id.replace(/\.fb\d+$/, ''));
  }
  for (const r of previous.retired ?? []) bump(r.id.replace(/\.fb\d+$/, ''));
  const primaryId = new Map();
  for (const r of raw) {
    if (r.kind === 'fallback') continue;
    const reused = pool.get(keyOf(r))?.shift();
    const prefix = `${r.chapter}.${r.part}`;
    let id = reused;
    if (!id) {
      const n = (maxN.get(prefix) ?? 0) + 1;
      maxN.set(prefix, n);
      id = `${prefix}.${String(n).padStart(3, '0')}`;
    }
    r.id = id;
    used.add(id);
    primaryId.set(`${r.chapter}|${r.part}|${r.order}`, id);
  }
  for (const r of raw) {
    if (r.kind !== 'fallback') continue;
    const parent = primaryId.get(`${r.chapter}|${r.part}|${r.order}`);
    r.id = `${parent}.fb${r.fallbackIndex}`;
    r.fallbackOf = parent;
    used.add(r.id);
  }
  const retired = [...(previous.retired ?? [])];
  for (const p of previous.lines ?? []) {
    if (!used.has(p.id)) retired.push({ id: p.id, chapter: p.chapter, speaker: p.speaker, text: p.text, textHash: p.textHash });
  }
  return retired;
}

// The document and its summary.
function build(previous) {
  const { raw, beats, chapters } = extract();
  const retired = assignIds(raw, previous);
  const seen = new Map();
  const lines = raw.map((r) => {
    const flags = flagsFor(r.text);
    if (r.voiceKey) flags.push('doubled');
    if (r.kind === 'fallback') flags.push('stand-in');
    const dupKey = `${r.voice}|${r.treatment ?? ''}|${r.text}`;
    const dupOf = r.voiced === 'yes' ? seen.get(dupKey) : undefined;
    if (r.voiced === 'yes' && !dupOf) seen.set(dupKey, r.id);
    const line = {
      id: r.id, chapter: r.chapter, game: r.game, script: r.script, ...(r.scriptName ? { scriptName: r.scriptName } : {}),
      part: r.part, order: r.order, kind: r.kind, speaker: r.speaker, voice: r.voice, ...(r.treatment ? { treatment: r.treatment } : {}),
      text: r.text, chars: chars(r.text), voiced: r.voiced, ...(r.reason ? { reason: r.reason } : {}),
      ...(r.emotion ? { emotion: r.emotion } : {}), ...(r.auto !== undefined ? { auto: r.auto } : {}),
      ...(r.branch ? { branch: r.branch } : {}), ...(r.voiceKey ? { voiceKey: r.voiceKey } : {}),
      ...(r.fallbackOf ? { fallbackOf: r.fallbackOf } : {}), ...(r.textFromPrimary ? { textFromPrimary: true } : {}),
      ...(dupOf ? { dupOf } : {}), textHash: sha(`${r.speaker}\u0000${r.text}`), estSpeechMs: speechMs(r.text), flags,
    };
    return line;
  });
  const voiced = lines.filter((l) => l.voiced === 'yes');
  const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
  const tally = (arr) => ({
    lines: arr.length, chars: sum(arr, (l) => l.chars),
    voicedLines: arr.filter((l) => l.voiced === 'yes').length, voicedChars: sum(arr.filter((l) => l.voiced === 'yes'), (l) => l.chars),
    uniqueVoicedChars: sum(arr.filter((l) => l.voiced === 'yes' && !l.dupOf), (l) => l.chars),
  });
  for (const c of chapters) Object.assign(c, tally(lines.filter((l) => l.chapter === c.key)));
  const voices = [...new Set(lines.map((l) => l.voice))].map((voice) => {
    const own = lines.filter((l) => l.voice === voice);
    const sorted = (f) => [...new Set(own.map(f))].filter(Boolean).sort();
    return { voice, speakers: sorted((l) => l.speaker), games: sorted((l) => l.game), treatments: sorted((l) => l.treatment), chapters: sorted((l) => l.chapter), ...tally(own) };
  }).sort((a, b) => b.voicedChars - a.voicedChars || a.voice.localeCompare(b.voice));
  const standIns = lines.filter((l) => l.kind === 'fallback');
  const totals = {
    ...tally(lines),
    standInLines: standIns.length, standInChars: sum(standIns, (l) => l.chars),
    quipLines: lines.filter((l) => l.kind === 'quip').length,
    midBeats: beats.length, speakingVoices: voices.filter((v) => v.voicedLines > 0 && !v.voice.startsWith('npc-')).length,
    unnamedVoices: voices.filter((v) => v.voice.startsWith('npc-')).length,
    speakerIds: new Set(voiced.map((l) => l.speaker)).size,
    byGame: Object.fromEntries(['ffx', 'ffx2'].map((g) => [g, tally(lines.filter((l) => l.game === g))])),
  };
  const doc = {
    schema: 1,
    about: 'Every line the story scripts can speak, read from src/story by tools/audio/voice-inventory.mjs. Generated: do not edit by hand.',
    generator: 'node tools/audio/voice-inventory.mjs',
    countingRules: {
      chars: 'Unicode code points of the line text as the dialogue box prints it; ElevenLabs bills the text it is sent, so audio tags and retakes add to this.',
      voiced: '"no" for captions (speaker none outside the two NPC scripts), silent beats (ellipsis only) and speakers who never speak.',
      uniqueVoicedChars: 'Voiced characters counting an identical (voice, treatment, text) once: what is billed if a repeated line shares one take.',
      kinds: 'say, narrate (the retrospective narrator), quip (victory tally), fallback (an authored stand-in when the written speaker is not on the field).',
      speech: `estSpeechMs = chars / ${SPEECH_CPS} per second + ${SPEECH_PAD_MS} ms; a planning figure, replaced by the recorded duration once a line exists.`,
      ids: '<chapter>.<script part>.<NNN>; kept while chapter, part, speaker and text are unchanged, new lines take the next number, edits retire the old id (never reused).',
    },
    sourceDigest: sha(lines.map((l) => `${l.id}\u0000${l.textHash}`).join('\n')),
    totals, chapters, voices, beats, retired, lines,
  };
  return doc;
}

function serialize(doc) {
  const { lines, ...rest } = doc;
  const head = JSON.stringify(rest, null, 2);
  return `${head.slice(0, -2)},\n  "lines": [\n${lines.map((l) => `    ${JSON.stringify(l)}`).join(',\n')}\n  ]\n}\n`;
}

function table(headers, rows) {
  return [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
}

function summary(doc) {
  const t = doc.totals;
  const out = [];
  out.push('# Voice line inventory: summary', '',
    'Generated by `node tools/audio/voice-inventory.mjs` from `src/story` (do not edit; the lines themselves are in `voice-line-inventory.json`).', '',
    `**${count(t.voicedLines)} voiced lines, ${count(t.voicedChars)} characters** (${count(t.uniqueVoicedChars)} if an identical line shares one take), `
    + `across ${doc.chapters.length} chapters, ${t.speakingVoices} speaking voices plus ${t.unnamedVoices} unnamed ones (${t.speakerIds} speaker ids). `
    + `Not voiced: ${count(t.lines - t.voicedLines)} lines (captions, silent beats). Stand-in lines for a benched speaker are included: ${t.standInLines} lines, ${count(t.standInChars)} characters.`, '');
  out.push('## By game', '', table(['Game', 'Lines', 'Voiced lines', 'Voiced chars', 'Unique voiced chars'],
    Object.entries(t.byGame).map(([g, x]) => [g === 'ffx' ? 'FFX' : 'FFX-2', count(x.lines), count(x.voicedLines), count(x.voicedChars), count(x.uniqueVoicedChars)])), '');
  out.push('## By chapter', '', table(['Ch', 'Chapter', 'Game', 'Lines', 'Voiced', 'Voiced chars', 'Unique chars', 'Mid-battle beats'],
    doc.chapters.map((c) => [c.number, `\`${c.key}\`${c.alsoPlaysIn.length ? ` (also read by ${c.alsoPlaysIn.map((a) => `\`${a}\``).join(', ')})` : ''}`, c.game === 'ffx' ? 'FFX' : 'FFX-2',
      count(c.lines), count(c.voicedLines), count(c.voicedChars), count(c.uniqueVoicedChars), doc.beats.filter((b) => b.chapter === c.key).length])), '');
  out.push('## By voice', '', table(['Voice', 'Speaker ids', 'Games', 'Lines', 'Voiced', 'Voiced chars', 'Unique chars', 'Chapters'],
    doc.voices.filter((v) => v.voicedLines > 0).map((v) => [`\`${v.voice}\``, v.speakers.map((s) => `\`${s}\``).join(', '), v.games.join(' + ').toUpperCase().replace('FFX2', 'FFX-2'), count(v.lines), count(v.voicedLines), count(v.voicedChars), count(v.uniqueVoicedChars), v.chapters.length])), '');
  const unvoiced = doc.lines.filter((l) => l.voiced !== 'yes');
  const byReason = {};
  for (const l of unvoiced) byReason[l.reason] = (byReason[l.reason] ?? 0) + 1;
  out.push('## Not voiced', '', table(['Reason', 'Lines'], Object.entries(byReason).map(([r, n]) => [r, n])), '');
  const flagCount = {};
  for (const l of doc.lines.filter((x) => x.voiced === 'yes')) for (const f of l.flags) flagCount[f] = (flagCount[f] ?? 0) + 1;
  out.push('## Lines that need a director\'s note', '', table(['Flag', 'Voiced lines', 'Why it matters'], [
    ['short', flagCount.short ?? 0, `under ${SHORT_CHARS} characters: a model can drift or add silence; give it the previous line as context`],
    ['one-word', flagCount['one-word'] ?? 0, 'a name or a single word: delivery is all context'],
    ['interrupted', flagCount.interrupted ?? 0, 'ends on a dash: the voice must cut off, not fall'],
    ['shout', flagCount.shout ?? 0, 'capitals: a raised voice (Brother, mostly)'],
    ['vocalization', flagCount.vocalization ?? 0, 'Hmph., Hn., Ha!: a sound, not a sentence'],
    ['doubled', flagCount.doubled ?? 0, 'two voices at once (Yuna and Lenne)'],
    ['stand-in', flagCount['stand-in'] ?? 0, 'a benched speaker\'s line said by someone else'],
  ]), '');
  const over = doc.beats.filter((b) => b.voicedMs > b.budgetMs);
  const tight = doc.beats.filter((b) => b.voicedMs <= b.budgetMs && b.voicedMs > b.authoredMs && b.voicedMs - b.authoredMs > 500);
  out.push('## Mid-battle beats and the time budget', '',
    `A beat that interrupts a fight has ${registry.MID_SCRIPT_BUDGET_MS / 1000} s (a chain seam ${registry.SEAM_BUDGET_MS / 1000} s). ` +
    `With a spoken line allowed to outlast its typed text, **${over.length} of ${doc.beats.length} beats overflow** and ${tight.length} more grow by more than half a second but still fit. ` +
    'Voiced length is a planning estimate (see `countingRules.speech`); the real figure comes from the recorded durations.', '');
  if (over.length) out.push(table(['Beat', 'Game', 'Trigger', 'Budget s', 'Authored s', 'Voiced s'], over.map((b) => [`\`${b.id}\``, b.game === 'ffx' ? 'FFX' : 'FFX-2', b.when ?? b.source, count(b.budgetMs / 1000, 1), count(b.authoredMs / 1000, 1), count(b.voicedMs / 1000, 1)])), '');
  out.push('## How lines are triggered', '', table(['Source', 'Beats', 'Meaning'], [
    ['trigger', doc.beats.filter((b) => b.source === 'trigger').length, 'a `MidBattleTrigger` (hp-below, ko, ability-used, status-applied, form-change, charge-started, overdrive) fires `script-trigger`'],
    ['ai', doc.beats.filter((b) => b.source === 'ai').length, 'an enemy AI emits `script-trigger` by name (Vegnagun, Shuyin, Omnis, Trema, the Fallen Aeons, the Den of Woe)'],
    ['unreferenced', doc.beats.filter((b) => b.source === 'unreferenced').length, 'registered but nothing fires it yet'],
  ]), '');
  return `${out.join('\n')}\n`;
}

// ---------------------------------------------------------------------------

const previous = existsSync(JSON_PATH) ? JSON.parse(readFileSync(JSON_PATH, 'utf8')) : {};
const doc = build(previous);
const jsonText = serialize(doc);
const mdText = summary(doc);

if (argv.includes('--stdout')) {
  process.stdout.write(mdText);
} else if (argv.includes('--check')) {
  const stale = [];
  if (!existsSync(JSON_PATH) || lf(readFileSync(JSON_PATH, 'utf8')) !== jsonText) stale.push(path.relative(ROOT, JSON_PATH));
  if (!existsSync(MD_PATH) || lf(readFileSync(MD_PATH, 'utf8')) !== mdText) stale.push(path.relative(ROOT, MD_PATH));
  if (stale.length) {
    console.error(`voice inventory is stale: ${stale.join(', ')}. Run: node tools/audio/voice-inventory.mjs`);
    process.exit(1);
  }
  console.log(`voice inventory is current (${doc.totals.voicedLines} voiced lines, ${doc.totals.voicedChars} characters)`);
} else {
  writeFileSync(JSON_PATH, jsonText);
  writeFileSync(MD_PATH, mdText);
  console.log(`wrote ${path.relative(ROOT, JSON_PATH)} and ${path.relative(ROOT, MD_PATH)}: ${doc.totals.voicedLines} voiced lines, ${doc.totals.voicedChars} characters, ${doc.totals.speakingVoices} voices`);
}
