#!/usr/bin/env node
/**
 * ElevenLabs client for the game's ORIGINAL voice-overs and ORIGINAL music (docs/audio/elevenlabs-plan.md).
 *
 * Written ahead of access and NOT run against ElevenLabs: there is no key yet. Nothing is sent unless the command
 * carries `--yes` AND `--max-credits N`; without them every mode prints what it would do and the credits it would
 * spend (a dry run, no network, no key read). The key comes from ELEVENLABS_API_KEY or D:/Tools/elevenlabs/key.txt,
 * both outside the repo, and is only ever sent to api.elevenlabs.io.
 *
 *   estimate                         offline: the cost of the pilot and of the whole game (from the inventory and the briefs)
 *   design  --scene pilot-a          Voice Design: three previews per speaker, written to <out>/design/<voice>/{A,B,C}.mp3
 *   save-voice --voice tidus --option A   keep a chosen preview as a saved voice (uses a voice slot; free of credits)
 *   tts     --scene pilot-a|--lines id,id [--option pick|A|B|C|all] [--model eleven_v4] [--tags] [--stitch] [--seed N]
 *   music   --brief boss-seymour-a [--takes 3]    Eleven Music from a brief in docs/audio/music-briefs.md
 *   balance                          credits left, voice slots (read-only call)
 *   usage                            offline: what the usage log says was spent
 *   audition --dir <candidates>      offline: a static audition page over a candidates folder
 *
 * Common: --out <dir> (default D:/Tools/elevenlabs/candidates/<date>; never under public/), --format mp3_44100_128.
 * Hard limits (docs/audio/elevenlabs-plan.md): original voices only (designed or library, never a clone or an imitation
 * of a real actor); original music only (mood, tempo, instrumentation: no melody, composer, franchise or track name).
 *
 * Game case: both. The inventory names each line's game; FFX and FFX-2 voices are separate rows (rule 14).
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as L from './elevenlabs-lib.mjs';

const [mode, ...rest] = process.argv.slice(2);
const flags = {};
for (let i = 0; i < rest.length; i++) {
  if (!rest[i].startsWith('--')) continue;
  const [k, v] = rest[i].slice(2).split(/=(.*)/s);
  flags[k] = v !== undefined ? v : rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
}
const die = (msg) => { console.error(`elevenlabs: ${msg}`); process.exit(1); };
const live = flags.yes === true && flags['dry-run'] !== true;
const date = new Date().toISOString().slice(0, 10);
const OUT = path.resolve(typeof flags.out === 'string' ? flags.out : path.join(L.HOME, 'candidates', date));
if (L.insideRepo(OUT) || L.underPublic(OUT)) die(`candidates stay outside the repo and never under public/ (got ${OUT})`);
const FORMAT = typeof flags.format === 'string' ? flags.format : 'mp3_44100_128';
const readJson = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback);
const VOICES_FILE = path.join(L.HOME, 'voices.json'); // { voice: { A: voice_id, ... } }, written by save-voice
const PICKS_FILE = path.join(L.HOME, 'picks.json'); // { voice: 'A' }, Bailey's picks
const write = (file, data) => { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, data); };

// ---------------------------------------------------------------------------
// One HTTP call: the key goes in a header and nowhere else; a 429 is retried, anything else stops the batch.
// ---------------------------------------------------------------------------

async function call(ctx, method, route, { body, query, binary = false } = {}) {
  const url = new URL(`${ctx.base}${route}`);
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { method, headers: { 'xi-api-key': ctx.key, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 429 && attempt < 3) { await new Promise((r) => setTimeout(r, (Number(res.headers.get('retry-after')) || 2 ** (attempt + 1)) * 1000)); continue; }
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}: ${(await res.text().catch(() => '')).slice(0, 400)}`), { status: res.status });
    return { requestId: res.headers.get('request-id'), data: binary ? Buffer.from(await res.arrayBuffer()) : await res.json() };
  }
}

/** Print the plan; in a live run enforce the cap, load the key and run each job in turn, logging every call. */
async function runJobs(jobs) {
  const credits = jobs.reduce((a, j) => a + j.credits, 0);
  const usd = jobs.reduce((a, j) => a + j.usd, 0);
  for (const j of jobs) console.log(`  ${j.label.padEnd(58)} ${String(j.credits).padStart(7)} credits  ${L.money(j.usd).padStart(7)}  -> ${path.relative(OUT, j.out)}`);
  console.log(`${mode}: ${jobs.length} request(s), ${credits.toLocaleString('en-US')} credits (about ${L.money(usd)} at the API list price)`);
  if (!live) return console.log('DRY RUN: nothing was sent and no key was read. To send: add --yes --max-credits N (N at least the total above).');
  const cap = Number(flags['max-credits']);
  if (!(cap > 0)) die('a live run needs --max-credits N (a hard cap; the batch is refused when its estimate is over it)');
  if (credits > cap) die(`the batch is estimated at ${credits} credits, over the cap of ${cap}; nothing was sent`);
  const found = L.loadKey();
  if (!found) die(`no key: set ELEVENLABS_API_KEY or save it in ${path.join(L.HOME, 'key.txt')} (outside the repo, never committed)`);
  console.log(`key loaded from ${found.source === 'ELEVENLABS_API_KEY' ? 'the environment' : 'its file'}; sending to ${L.apiBase()}`);
  let spent = 0;
  for (const j of jobs) {
    if (spent + j.credits > cap) die(`stopping before "${j.label}": ${spent} spent, ${j.credits} more would pass the cap of ${cap}`);
    try {
      const out = await j.run({ key: found.key, base: L.apiBase() });
      spent += j.credits;
      L.appendUsage({ mode, label: j.label, credits: j.credits, usd: Number(j.usd.toFixed(4)), requestId: out.requestId ?? null, out: path.relative(OUT, j.out), status: 'ok' });
      console.log(`  ok  ${j.label}`);
    } catch (err) {
      L.appendUsage({ mode, label: j.label, credits: 0, status: `failed ${err.status ?? ''}` });
      die(`${j.label} failed (${err.message}); stopped after ${spent} credits`);
    }
  }
  console.log(`done: ${spent} credits estimated spent; run "balance --yes" for the real figure.`);
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

function designJobs(inv) {
  const casting = L.loadFenced(path.join(L.ROOT, 'docs/audio/voice-casting.md'), 'design');
  const scene = flags.scene ? L.SCENES[flags.scene] : null;
  if (flags.scene && !scene) die(`unknown scene ${flags.scene}`);
  const sceneIds = scene ? L.sceneLines(inv, flags.scene).map((l) => l.id) : [];
  const voices = flags.voice ? [flags.voice] : scene ? scene.optioned : die('design needs --voice <id> or --scene <pilot-a|pilot-b>');
  return voices.map((voice) => {
    const description = casting.get(voice) ?? die(`no design prompt for "${voice}" in docs/audio/voice-casting.md`);
    const text = typeof flags.text === 'string' ? flags.text : L.previewTextFor(inv, voice, sceneIds);
    const problems = L.validateDesign(description, text);
    if (problems.length) die(`${voice}: ${problems.join('; ')}`);
    const dir = path.join(OUT, 'design', voice);
    const body = { voice_description: description, text, model_id: flags.model ?? 'eleven_ttv_v3', ...(flags.seed ? { seed: Number(flags.seed) } : {}) };
    return {
      label: `design ${voice} (preview text ${text.length} chars)`, credits: L.creditsForDesign(text.length), usd: L.usdForTts(text.length, 'eleven_v4'), out: dir,
      async run(ctx) {
        const { data, requestId } = await call(ctx, 'POST', '/v1/text-to-voice/design', { body, query: { output_format: FORMAT } });
        data.previews.forEach((p, i) => write(path.join(dir, `${'ABC'[i]}.mp3`), Buffer.from(p.audio_base_64, 'base64')));
        write(path.join(dir, 'design.json'), JSON.stringify({ voice, body, previews: data.previews.map((p, i) => ({ option: 'ABC'[i], generated_voice_id: p.generated_voice_id, duration_secs: p.duration_secs })) }, null, 1));
        return { requestId };
      },
    };
  });
}

function saveVoiceJob() {
  const voice = flags.voice ?? die('save-voice needs --voice <id> --option A|B|C');
  const option = flags.option ?? die('save-voice needs --option A|B|C');
  const sidecar = readJson(path.join(OUT, 'design', voice, 'design.json'), null) ?? die(`no design.json for ${voice} under ${OUT}; run design first`);
  const chosen = sidecar.previews.find((p) => p.option === option) ?? die(`no option ${option} for ${voice}`);
  const name = typeof flags.name === 'string' ? flags.name : `pyrefly-${voice}-${option}`;
  return [{
    label: `save ${voice} option ${option} as "${name}" (uses a voice slot)`, credits: 0, usd: 0, out: path.join(OUT, 'design', voice, 'design.json'),
    async run(ctx) {
      const { data, requestId } = await call(ctx, 'POST', '/v1/text-to-voice', { body: { voice_name: name, voice_description: sidecar.body.voice_description, generated_voice_id: chosen.generated_voice_id, labels: { project: 'pyrefly', voice, option } } });
      const all = readJson(VOICES_FILE, {});
      write(VOICES_FILE, JSON.stringify({ ...all, [voice]: { ...(all[voice] ?? {}), [option]: data.voice_id } }, null, 1));
      return { requestId };
    },
  }];
}

function ttsJobs(inv) {
  const model = flags.model ?? 'eleven_v4';
  let lines = flags.lines ? String(flags.lines).split(',').map((id) => inv.byId.get(id) ?? die(`unknown line id ${id}`)) : flags.scene ? L.sceneLines(inv, flags.scene) : die('tts needs --lines <id,id> or --scene <pilot-a|pilot-b>');
  if (flags.speaker) lines = lines.filter((l) => l.voice === flags.speaker);
  const saved = readJson(VOICES_FILE, {});
  const picks = readJson(PICKS_FILE, {});
  const jobs = [];
  lines.forEach((line, i) => {
    const want = flags.option ?? 'pick';
    const options = flags['voice-id'] ? ['X'] : want === 'all' ? Object.keys(saved[line.voice] ?? { A: 0, B: 0, C: 0 }) : [want === 'pick' ? picks[line.voice] ?? '?' : want];
    for (const option of options) {
      const voiceId = flags['voice-id'] ?? saved[line.voice]?.[option] ?? null;
      const { text, chars, body } = L.buildTtsBody(line, { model, tags: flags.tags === true, seed: flags.seed ? Number(flags.seed) : undefined, previous: flags.stitch ? lines[i - 1]?.text : undefined, next: flags.stitch ? lines[i + 1]?.text : undefined });
      const file = path.join(OUT, 'tts', model, `${line.voice}-${option}`, `${line.id}.mp3`);
      jobs.push({
        label: `tts ${line.id} as ${line.voice}-${option}${voiceId ? '' : ' (voice not saved yet)'}`, credits: L.creditsForTts(chars, model), usd: L.usdForTts(chars, model), out: file,
        async run(ctx) {
          if (!voiceId) die(`${line.voice} option ${option} has no saved voice: run design and save-voice, or pass --voice-id`);
          const { data, requestId } = await call(ctx, 'POST', `/v1/text-to-speech/${voiceId}`, { body, query: { output_format: FORMAT }, binary: true });
          write(file, data);
          write(file.replace(/\.mp3$/, '.json'), JSON.stringify({ lineId: line.id, textHash: line.textHash, voice: line.voice, option, voiceId, model, sent: text, chars, requestId, sha256: L.sha256(data) }, null, 1));
          return { requestId };
        },
      });
    }
  });
  return jobs;
}

function musicJobs() {
  const briefs = L.loadFenced(path.join(L.ROOT, 'docs/audio/music-briefs.md'), 'music');
  const id = flags.brief ?? die(`music needs --brief <id> (${[...briefs.keys()].slice(0, 6).join(', ')}, ...)`);
  const brief = JSON.parse(briefs.get(id) ?? die(`no brief "${id}" in docs/audio/music-briefs.md`));
  const takes = Number(flags.takes ?? 1);
  const base = { model_id: flags.model ?? brief.model ?? 'music_v2_5' };
  const body = brief.plan ? { ...base, composition_plan: brief.plan } : { ...base, prompt: brief.prompt, music_length_ms: brief.lengthMs, force_instrumental: brief.instrumental !== false };
  const ms = brief.plan ? brief.plan.sections.reduce((a, x) => a + x.duration_ms, 0) : brief.lengthMs;
  if (!(ms >= 3000 && ms <= 300000)) die(`${id}: the length must be 3 to 300 seconds (got ${ms} ms)`);
  const hit = L.bannedIn(JSON.stringify(brief.plan ?? brief.prompt));
  if (hit) die(`${id}: a music prompt names no franchise, composer, character or place ("${hit}")`);
  return Array.from({ length: takes }, (_, n) => {
    const file = path.join(OUT, 'music', id, `take-${n + 1}.mp3`);
    return {
      label: `music ${id} take ${n + 1} (${(ms / 1000).toFixed(0)} s, ${body.model_id}${brief.plan ? ', composition plan' : ''})`, credits: L.creditsForMusic(ms), usd: L.usdForMusic(ms), out: file,
      async run(ctx) {
        const { data, requestId } = await call(ctx, 'POST', '/v1/music', { body, query: { output_format: FORMAT }, binary: true });
        write(file, data);
        write(file.replace(/\.mp3$/, '.json'), JSON.stringify({ brief: id, cue: brief.cue, game: brief.game, body, requestId, sha256: L.sha256(data) }, null, 1));
        return { requestId };
      },
    };
  });
}

function estimate(inv) {
  const t = inv.doc.totals;
  const retakes = Number(flags.retakes ?? 2);
  const tag = Number(flags['tag-overhead'] ?? 0.08);
  const model = flags.model ?? 'eleven_v4';
  const briefs = [...L.loadFenced(path.join(L.ROOT, 'docs/audio/music-briefs.md'), 'music').values()].map((b) => JSON.parse(b));
  const lenOf = (b) => b.lengthMs ?? b.plan.sections.reduce((a, x) => a + x.duration_ms, 0);
  const takes = Number(flags.takes ?? 3);
  const row = (name, credits, usd, note = '') => console.log(`${name.padEnd(46)} ${String(credits).padStart(9)} credits  ${L.money(usd).padStart(8)}  ${note}`);
  console.log(`prices checked ${L.PRICES.checked}; model ${model}; ${retakes} takes per line; ${(tag * 100).toFixed(0)}% audio-tag overhead; ${takes} takes per music cue`);
  const vo = Math.ceil(t.uniqueVoicedChars * (1 + tag) * retakes);
  row('whole game voice-over', L.creditsForTts(vo, model), L.usdForTts(vo, model), `${t.voicedLines} lines, ${t.uniqueVoicedChars} unique chars`);
  const design = Math.ceil(inv.doc.voices.filter((v) => v.voicedLines > 0).length * 300 * 2);
  row('whole cast, Voice Design (2 rounds, 300-char previews)', L.creditsForDesign(design), L.usdForTts(design, model));
  const production = briefs.filter((b) => !b.pilot);
  const ms = production.reduce((a, b) => a + lenOf(b), 0) * takes;
  row(`whole game music (${production.length} briefs)`, L.creditsForMusic(ms), L.usdForMusic(ms), `${(ms / 60000).toFixed(0)} min generated`);
  for (const name of Object.keys(L.SCENES)) {
    const sc = L.SCENES[name];
    const lines = L.sceneLines(inv, name);
    const chars = lines.reduce((a, l) => a + l.chars, 0);
    const prev = sc.optioned.reduce((a, v) => a + L.previewTextFor(inv, v, lines.map((l) => l.id)).length, 0);
    row(`${name} round 1: ${sc.optioned.length} voices x 3 previews`, L.creditsForDesign(prev), L.usdForTts(prev, model), `${prev} preview chars`);
    const renders = [['eleven_v4', chars], ['eleven_v4', Math.ceil(chars * (1 + tag))], ['eleven_multilingual_v2', chars]];
    row(`${name} round 2: scene x3 renders (${lines.length} lines)`, renders.reduce((x, [m, c]) => x + L.creditsForTts(c, m), 0), renders.reduce((x, [m, c]) => x + L.usdForTts(c, m), 0), `v4 plain, v4 with emotion tags, Multilingual v2; ${chars} chars each`);
  }
  for (const which of ['a', 'b']) {
    const sk = briefs.filter((b) => b.pilot === which).reduce((a, b) => a + lenOf(b), 0);
    row(`pilot-${which} music: 3 sketches, one take each`, L.creditsForMusic(sk), L.usdForMusic(sk), `${(sk / 60000).toFixed(1)} min`);
  }
  console.log(`plans: ${L.PRICES.plans.map((p) => `${p.name} $${p.usd} ${p.credits.toLocaleString('en-US')} credits ${p.voiceSlots} slots${p.commercial ? '' : ' (non-commercial)'}`).join('; ')}`);
}

function usage() {
  const rows = L.readUsage();
  const by = {};
  for (const r of rows) { by[r.mode] = by[r.mode] ?? { calls: 0, credits: 0, usd: 0 }; by[r.mode].calls++; by[r.mode].credits += r.credits ?? 0; by[r.mode].usd += r.usd ?? 0; }
  console.log(rows.length ? Object.entries(by).map(([m, v]) => `${m.padEnd(10)} ${v.calls} calls  ${v.credits} credits  ${L.money(v.usd)}`).join('\n') : `no calls logged in ${path.join(L.HOME, 'usage.jsonl')}`);
}

function audition() {
  const dir = path.resolve(typeof flags.dir === 'string' ? flags.dir : OUT);
  const ls = (p) => (existsSync(p) ? readdirSync(p) : []);
  const groups = [];
  for (const voice of ls(path.join(dir, 'design'))) {
    const side = readJson(path.join(dir, 'design', voice, 'design.json'), null);
    groups.push({ id: `voice:${voice}`, title: `Voice: ${voice}`, note: side ? `Preview text: ${side.body.text.slice(0, 160)}...` : '', options: ls(path.join(dir, 'design', voice)).filter((f) => /^[ABC]\.mp3$/.test(f)).map((f) => ({ label: f[0], file: `design/${voice}/${f}` })) });
  }
  // Music: one row per cue, every brief of that cue (a, b, c...) and every take in it, with today's shipped cue as the control.
  const cues = new Map();
  for (const brief of ls(path.join(dir, 'music')).filter((b) => b !== '_control')) {
    for (const f of ls(path.join(dir, 'music', brief)).filter((x) => x.endsWith('.mp3'))) {
      const cue = readJson(path.join(dir, 'music', brief, f.replace('.mp3', '.json')), {}).cue ?? brief;
      if (!cues.has(cue)) cues.set(cue, []);
      cues.get(cue).push({ label: `${brief.replace(`${cue}-`, '')} ${f.replace('.mp3', '').replace('take-', '#')}`, file: `music/${brief}/${f}` });
    }
  }
  for (const [cue, options] of cues) {
    const control = `music/_control/${cue}.mp3`;
    const today = existsSync(path.join(dir, control)) ? [{ label: 'today', file: control, caption: 'the shipped cue, the control' }] : [];
    groups.push({ id: `music:${cue}`, title: `Music: ${cue}`, note: 'Different ideas for one cue (a, b, c); each take is one roll of the brief. "today" is the shipped cue, copied into music/_control/ by hand.', options: [...today, ...options] });
  }
  if (flags.scene) {
    // The read-through: the scene in play order with each voice's pick, from <dir>/tts/<model>/<voice>-<option>/<line id>.mp3.
    const model = flags.model ?? 'eleven_v4';
    const picks = readJson(PICKS_FILE, {});
    const inv = L.loadInventory();
    const scene = L.sceneLines(inv, flags.scene).map((l) => ({ speaker: l.speaker, text: l.text, file: `tts/${model}/${l.voice}-${picks[l.voice] ?? 'A'}/${l.id}.mp3` })).filter((l) => existsSync(path.join(dir, l.file)));
    if (scene.length) groups.unshift({ id: `scene:${flags.scene}:${model}`, title: `Scene ${flags.scene} on ${model}`, note: 'The picked voices, line by line, in play order.', scene });
  }
  if (!groups.length) die(`nothing to audition under ${dir} (expected design/<voice>/A.mp3, music/<brief>/take-1.mp3 or tts/<model>/...)`);
  write(path.join(dir, 'audition.html'), L.auditionHtml('Echoes of Spira: voice and music candidates', groups));
  console.log(`wrote ${path.join(dir, 'audition.html')} (${groups.length} rows); open it from disk`);
}

async function main() {
  const inv = ['estimate', 'design', 'tts'].includes(mode) ? L.loadInventory() : null;
  const plans = { design: () => designJobs(inv), 'save-voice': saveVoiceJob, tts: () => ttsJobs(inv), music: musicJobs };
  if (mode === 'estimate') estimate(inv);
  else if (mode === 'usage') usage();
  else if (mode === 'audition') audition();
  else if (mode === 'balance') {
    if (!live) return console.log('DRY RUN: balance reads GET /v1/user/subscription (free). Add --yes to send.');
    const found = L.loadKey() ?? die('no key (ELEVENLABS_API_KEY or key.txt outside the repo)');
    const { data } = await call({ key: found.key, base: L.apiBase() }, 'GET', '/v1/user/subscription');
    console.log(`tier ${data.tier}; credits ${data.character_count} of ${data.character_limit} used; voice slots ${data.voice_slots_used} of ${data.voice_limit}; resets ${new Date(data.next_character_count_reset_unix * 1000).toISOString().slice(0, 10)}`);
  } else if (plans[mode]) await runJobs(plans[mode]());
  else die('usage: node tools/audio/elevenlabs.mjs <estimate|design|save-voice|tts|music|balance|usage|audition> [flags] (read the header of this file)');
}

main().catch((err) => die(err.message));
