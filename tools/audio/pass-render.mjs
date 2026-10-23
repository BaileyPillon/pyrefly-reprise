/**
 * Renders the audio pass's blows offline and measures them (conference demo sound pass, 2026-10-22; decision 184). Agents cannot hear (AGENTS.md rule 13): the pass's picks are read off these numbers,
 * and the WAVs this writes are what Bailey listens to on `docs/audio/audition.html` ("Delegated picks, 22 Oct") to overturn them.
 *
 *   node tools/audio/pass-render.mjs hits [--out <dir>] [--json <file>]   every blow, today and with the pass (onset, peak, momentary loudness, attack, the first 40 and 250 ms by band)
 *   node tools/audio/pass-render.mjs tune                                    the dB each layer needs to sit at its target under its base (the rules in `src/audio/pass/passRecipes.ts`)
 *   node tools/audio/pass-render.mjs ui <family.json> [--json <file>]       the menu family: each cue's level and length today, and the gain/trim that puts it at its target (`{ cue: { peakDb, trimMs, fadeMs } }`)
 *
 * For every blow the pass plans (each party member's plain blow, a critical, a boss's blow, the headline blows) it plays the base cue the game plays, once as today and once with the pass's plan
 * (`src/audio/pass/passPlanner.ts`, imported as the game imports it), at the mixer's level (call volume 0.8, or 1 for a critical, the cue's P1 trim, the effects path of -5.0 dB: the master 0.8 times the
 * effects bus 0.7), and prints: audible onset after the ask, sample peak at the master, K-weighted momentary maximum, the first 250 ms by band, the centroid, the attack.
 * Pitch is linear resampling and the layers are summed exactly as `AudioManager.playSfx` schedules them, so the numbers are the mixer's to within the decoder's tolerance.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { attackMs, bands, cutCue, db, fromDb, loudness, onsetMs, readManifest, samplePeakDb, shape, sum, writeWav } from './pass-dsp.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pub = path.join(root, 'public/audio');
const manifest = readManifest(pub);
const load = (rel) => import(pathToFileURL(path.join(root, rel)).href);
const { planHit } = await load('src/audio/pass/passPlanner.ts');
const { WEAPON_CUES } = await load('src/audio/sfxV2/weapons.ts');
const { PARITY_TRIMS_DB } = await load('src/audio/sfxV2/parityTrims.ts');

/** The effects path to the master: master 0.8 times the effects bus 0.7 (SaveData defaults), dB. */
const PATH_DB = 20 * Math.log10(0.8 * 0.7);

const CORE = { ffx: 'ffx-core', ffx2: 'ffx2-core' };

/** The slice the mixer plays for a v2 cue of `game`: the core pack's recorded original when it has one, else the v2 sprite (with its P1 trim). */
export function baseSlice(game, name) {
  const pack = CORE[game];
  const inPack = manifest.sfxParity.packs[pack]?.cues[name];
  if (inPack) {
    const sig = cutCue(pub, manifest, `parity-${pack}:${name}`);
    return { sig, via: `parity:${pack}`, trimDb: 0, onset: onsetMs(sig) };
  }
  const sig = cutCue(pub, manifest, `v2:${name}`);
  const trimDb = PARITY_TRIMS_DB[game]?.[name] ?? 0;
  return { sig, via: 'v2', trimDb, onset: onsetMs(sig) };
}

function layerSlice(key) {
  const ref = key.startsWith('v2:') ? key : `first:${key}`;
  const sig = cutCue(pub, manifest, ref);
  return { sig, onset: onsetMs(sig) };
}

/** Render one blow: `plan` null = as today. Returns the master-path signal (the effects path applied, no makeup). */
export function renderBlow({ game, baseName, volume, plan }) {
  const b = baseSlice(game, baseName);
  const level = fromDb(PATH_DB + b.trimDb) * volume;
  const skip = plan?.baseSkip ? Math.min(200, Math.max(0, b.onset - 1)) : 0;
  const parts = [{ atMs: 0, sig: shape(b.sig, { skipMs: skip, gain: level }) }];
  const baseAudible = Math.max(0, b.onset - skip);
  for (const l of plan?.layers ?? []) {
    const ls = layerSlice(l.key);
    parts.push({ atMs: baseAudible + l.lagMs, sig: shape(ls.sig, { skipMs: l.skipMs, pitch: l.pitch, trimMs: l.trimMs, fadeMs: l.fadeMs, gain: level * l.gain }) });
  }
  return { sig: sum(parts, b.sig.rate, 1000), audibleMs: baseAudible, parts, via: b.via };
}

export function measureBlow(r) {
  const s = r.sig;
  const first = r.audibleMs;
  const lo = loudness(s);
  return {
    audibleMs: Math.round(first * 10) / 10,
    peakDb: Math.round(samplePeakDb(s) * 10) / 10,
    momentaryMaxLufs: Math.round(lo.momentaryMax * 10) / 10,
    bands: (() => { const bd = bands(s, 250, first); return bd && Object.fromEntries(Object.entries(bd).map(([k, v]) => [k, k === 'centroidHz' ? Math.round(v) : Math.round(v * 1000) / 1000])); })(),
    attackMs: Math.round(attackMs(s) * 10) / 10,
    transient: (() => { const bd = bands(s, 40, first); return bd && { centroidHz: Math.round(bd.centroidHz), over2k: Math.round((bd.b2k_6k + bd.gt6k) * 1000) / 1000, under500: Math.round((bd.lt120 + bd.b120_500) * 1000) / 1000 }; })(),
  };
}

const scenarios = [
  { game: 'ffx', who: 'tidus', side: 'party', weapon: 'sword' },
  { game: 'ffx', who: 'auron', side: 'party', weapon: 'katana' },
  { game: 'ffx', who: 'kimahri', side: 'party', weapon: 'spear' },
  { game: 'ffx', who: 'yuna', side: 'party', weapon: 'staff' },
  { game: 'ffx', who: 'lulu', side: 'party', weapon: 'doll' },
  { game: 'ffx', who: 'wakka', side: 'party', weapon: 'blitzball' },
  { game: 'ffx', who: 'rikku', side: 'party', weapon: 'claw' },
  { game: 'ffx', who: 'seymour-flux', side: 'enemy', weapon: null },
  { game: 'ffx2', who: 'bahamut', side: 'enemy', weapon: null }, // FFX-2's boss: its own crack (a both-game cue), never FFX's claw
  { game: 'ffx2', who: 'yuna', side: 'party', weapon: 'gun' },
  { game: 'ffx2', who: 'rikku', side: 'party', weapon: 'dagger' },
  { game: 'ffx2', who: 'paine', side: 'party', weapon: 'greatsword' },
];

function facts(s, crit) {
  return { game: s.game, actorSide: s.side, actorId: s.who, weapon: s.weapon, physical: true, crit, abilityId: null, hitIndex: 0, hitCount: 1, commandKind: 'attack' };
}

if (process.argv[2] === 'hits') {
  const outDir = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : null;
  const jsonOut = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;
  const rows = [];
  for (const s of scenarios) {
    for (const crit of [false, true]) {
      const baseName = crit ? 'critical' : s.weapon ? WEAPON_CUES[s.weapon].hit : 'hit-heavy-enemy';
      const volume = crit ? 1 : 0.8;
      const plan = planHit(facts(s, crit));
      const before = renderBlow({ game: s.game, baseName, volume, plan: null });
      const after = renderBlow({ game: s.game, baseName, volume, plan });
      const row = { game: s.game, who: s.who, weapon: s.weapon, crit, base: baseName, via: before.via, before: measureBlow(before), after: measureBlow(after), plan: plan && { baseSkip: plan.baseSkip ?? false, big: plan.big ?? null, layers: plan.layers.map((l) => `${l.role}:${l.key}@${Math.round(db(l.gain) * 10) / 10}dB`) } };
      // each layer's own peak against the base's peak
      const basePk = samplePeakDb({ L: before.parts[0].sig.L, R: before.parts[0].sig.R });
      row.layerPeaks = after.parts.slice(1).map((p, i) => ({ role: plan.layers[i].role, key: plan.layers[i].key, underBaseDb: Math.round((samplePeakDb(p.sig) - basePk) * 10) / 10 }));
      rows.push(row);
      if (outDir) {
        const tag = `${s.game}-${s.who}-${crit ? 'crit' : 'hit'}`;
        writeWav(path.join(outDir, `${tag}-today.wav`), before.sig);
        writeWav(path.join(outDir, `${tag}-new.wav`), after.sig);
      }
    }
  }
  const f = (n) => String(n ?? '').padStart(7);
  console.log('game who          weapon     crit base                 via             | onset   peak    mom  attack |40ms: cent  >2k  <500 |250ms: <500  >2k | layers (peak under base)');
  for (const r of rows) {
    for (const [tag, m] of [['today', r.before], ['new  ', r.after]]) {
      const b = m.bands ?? {};
      const t = m.transient ?? {};
      const lo = Math.round(((b.lt120 ?? 0) + (b.b120_500 ?? 0)) * 1000) / 1000;
      const hi = Math.round(((b.b2k_6k ?? 0) + (b.gt6k ?? 0)) * 1000) / 1000;
      console.log(`${r.game.padEnd(4)} ${r.who.padEnd(12)} ${String(r.weapon).padEnd(10)} ${r.crit ? 'crit' : 'hit '} ${r.base.padEnd(20)} ${r.via.padEnd(15)} ${tag}| ${f(m.audibleMs)}${f(m.peakDb)}${f(m.momentaryMaxLufs)}${f(m.attackMs)} |${f(t.centroidHz)}${f(t.over2k)}${f(t.under500)} |${f(lo)}${f(hi)} | ${tag === 'new  ' ? r.layerPeaks.map((l) => `${l.role} ${l.underBaseDb}`).join(', ') : ''}`);
    }
  }
  if (jsonOut) { fs.mkdirSync(path.dirname(jsonOut), { recursive: true }); fs.writeFileSync(jsonOut, JSON.stringify(rows, null, 1)); }
}

/** `tune`: for every scenario, the dB each layer needs to sit at its target under the base's peak (rule 3 of passRecipes.ts). */
if (process.argv[2] === 'tune') {
  const TARGET = { texture: -6.5, body: -5, character: -15, thump: -4 };
  for (const s of scenarios) {
    const baseName = s.weapon ? WEAPON_CUES[s.weapon].hit : 'hit-heavy-enemy';
    const plan = planHit(facts(s, false));
    const bigPlan = planHit({ ...facts(s, true) });
    const base = renderBlow({ game: s.game, baseName, volume: 0.8, plan: null });
    const basePk = samplePeakDb(base.parts[0].sig);
    const crit = renderBlow({ game: s.game, baseName: 'critical', volume: 1, plan: null });
    const critPk = samplePeakDb(crit.parts[0].sig);
    const out = [];
    for (const l of [...(plan?.layers ?? []), ...(bigPlan?.layers ?? []).filter((x) => x.role === 'thump')]) {
      const unit = renderBlow({ game: s.game, baseName, volume: 0.8, plan: { baseSkip: plan?.baseSkip, layers: [{ ...l, gain: 1 }] } });
      const pk0 = samplePeakDb(unit.parts[1].sig);
      const ref = l.role === 'thump' ? critPk : basePk;
      const need = TARGET[l.role] - (pk0 - ref);
      out.push(`${l.role}:${l.key} db ${Math.round(need * 2) / 2} (now ${Math.round(db(l.gain) * 10) / 10})`);
    }
    console.log(`${s.game} ${s.who.padEnd(12)} ${String(s.weapon).padEnd(10)} base ${baseName} peak ${Math.round(basePk * 10) / 10} | ${out.join(' | ')}`);
  }
}

/** `ui`: the menu family. Today's level and length of each menu cue as the mixer plays it, and the gain/trim that put it at its family target. */
if (process.argv[2] === 'ui') {
  const FAMILY = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')); // { cue: { peakDb, trimMs, fadeMs } }
  const names = Object.keys(FAMILY);
  const out = { ffx: {}, ffx2: {} };
  console.log('game  cue          bank            | today: ms   peak   mom | target peak  trim fade  -> gain dB | new: ms  peak   mom');
  for (const game of ['ffx', 'ffx2']) {
    for (const base of names) {
      const cue = game === 'ffx2' ? `${base}-x2` : base;
      let b;
      try { b = baseSlice(game, cue); } catch { continue; }
      const level = fromDb(PATH_DB + b.trimDb);
      const today = sum([{ atMs: 0, sig: shape(b.sig, { gain: level }) }], b.sig.rate, 1000);
      const fam = FAMILY[base];
      // peak of the trimmed cue at unity, then the gain that reaches the target
      const unit = shape(b.sig, { trimMs: fam.trimMs, fadeMs: fam.fadeMs, gain: level });
      const pk = samplePeakDb(unit);
      const gainDb = fam.peakDb - pk;
      const nw = sum([{ atMs: 0, sig: shape(b.sig, { trimMs: fam.trimMs, fadeMs: fam.fadeMs, gain: level * fromDb(gainDb) }) }], b.sig.rate, 1000);
      out[game][base] = { gainDb: Math.round(gainDb * 2) / 2, trimMs: fam.trimMs, fadeMs: fam.fadeMs, bank: b.via, todayMs: Math.round(b.sig.L.length / b.sig.rate * 1000), todayPeakDb: Math.round(samplePeakDb(today) * 10) / 10, todayMom: Math.round(loudness(today).momentaryMax * 10) / 10, newPeakDb: Math.round(samplePeakDb(nw) * 10) / 10, newMom: Math.round(loudness(nw).momentaryMax * 10) / 10 };
      const r = out[game][base];
      console.log(`${game.padEnd(5)} ${cue.padEnd(14)} ${b.via.padEnd(15)} | ${String(r.todayMs).padStart(6)} ${String(r.todayPeakDb).padStart(6)} ${String(r.todayMom).padStart(6)} | ${String(fam.peakDb).padStart(11)} ${String(fam.trimMs).padStart(5)} ${String(fam.fadeMs).padStart(4)} ${String(r.gainDb).padStart(11)} | ${String(Math.min(r.todayMs, fam.trimMs)).padStart(6)} ${String(r.newPeakDb).padStart(6)} ${String(r.newMom).padStart(6)}`);
    }
  }
  if (process.argv.includes('--json')) fs.writeFileSync(process.argv[process.argv.indexOf('--json') + 1], JSON.stringify(out, null, 1));
}
