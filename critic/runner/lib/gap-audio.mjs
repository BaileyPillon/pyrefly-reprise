// Gap-closing capture: does the MID-ENCOUNTER music crossfade actually fire?
//   ch3 phase 2: boss-jecht -> boss-yu-yevon
//   ch5 phase 2: boss-vegnagun -> boss-shuyin
// Entry is real keys; the turns are taken by the SHIPPED intended strategy so
// the run survives to the phase change. Polls __pyrefly.audioDebug() and the
// network for the track that has to arrive.
//
// Promoted from critic/rounds/round-06/gap-audio.mjs and fixed for PR-0059:
// it read `d.music ?? d.currentTrack ?? d.track`, none of which
// `AudioManager.debug()` returns (src/audio/AudioManager.ts:553 — the field
// is `playing`), so every sample recorded `music:null` even while the raw
// debug object showed a track playing. The raw field kept the truth (no
// false claim reached the report), but the parsed field was worthless.
//
// Usage: node critic/runner/lib/gap-audio.mjs <chapterIndex 2 or 4> --base=<url> --evidence=<dir>
import { open, shoot, assertScreen } from './lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireBase, requireEvidence } from './cli.mjs';

const CH = ['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'ffx2-bahamut', 'ffx2-vegnagun-shuyin'];
const args = parseArgs(process.argv.slice(2));
const idx = Number(args._[0] ?? 2);
const id = CH[idx];
const game = idx < 3 ? 'ffx' : 'ffx2';
const BASE = requireBase(args);
const EV = requireEvidence(args);
const dir = 'gaps/audio';
const rec = { chapter: id, game, size: '1600x900', input: 'real keyboard to enter; turns by the shipped intended strategy', timeline: [], audioRequests: [] };

const { browser, page, consoleErrors, net } = await open({ base: BASE, width: 1600, height: 900, fresh: true });
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const shot = (file, meta) => shoot(page, EV, file, meta);

const audio = () => page.evaluate(() => {
  const p = window.__pyrefly;
  let d = null;
  try { d = p.audioDebug(); } catch (e) { d = { error: String(e) }; }
  const st = p.battleState?.();
  // PR-0059 fix: AudioManager.debug() returns { ready, sampleRate, playing,
  // muted, volumes, prerendered, tracks, sfx } (src/audio/AudioManager.ts:550)
  // — no `music`, `currentTrack`, `track`, `unlocked` or `started` field
  // exists, and `tracks[i]` is `{name, about, cached, source}`, never
  // `{playing, state}`. Read the fields that are actually there.
  return {
    music: d ? d.playing ?? null : null,
    tracks: d && Array.isArray(d.tracks) ? d.tracks.map((t) => `${t.name}:${t.cached ? t.source ?? 'cached' : 'uncached'}`) : null,
    muted: d && d.muted, unlocked: d && d.ready,
    raw: d ? JSON.stringify(d).slice(0, 700) : null,
    enemies: st ? Object.values(st.combatants).filter((c) => c.side === 'enemy').map((c) => c.id).join(',') : '',
  };
});

try {
  await page.waitForTimeout(900);
  await page.keyboard.press('Enter'); await page.waitForTimeout(1100);
  for (let i = 0; i < idx; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(240); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(1600);
  if (await scr() === 'party-prep') { await page.keyboard.press('Enter'); await page.waitForTimeout(1900); }
  for (let i = 0; i < 30 && await scr() === 'cutscene'; i++) {
    await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  }
  await assertScreen(page, 'battle', 60000);

  let armed = '', lastMusic = '__none__', lastEnemies = '';
  const t0 = Date.now();
  while (Date.now() - t0 < 720000) {
    const s = await scr();
    if (s !== 'battle' && s !== 'cutscene') { if (s === 'results' || s === 'chapter-select') { rec.endScreen = s; break; } }
    if (s === 'cutscene') { await page.keyboard.press('Enter'); await page.waitForTimeout(500); continue; }
    const a = await audio();
    const key = JSON.stringify(a.music) + '|' + JSON.stringify(a.tracks);
    if (key !== lastMusic || a.enemies !== lastEnemies) {
      const entry = { ms: Date.now() - t0, enemies: a.enemies, music: a.music, tracks: a.tracks, muted: a.muted, unlocked: a.unlocked };
      rec.timeline.push(entry);
      console.log(`${String(entry.ms).padStart(7)} ms  enemies=${a.enemies}  music=${JSON.stringify(a.music)}  tracks=${JSON.stringify(a.tracks)}`);
      if (a.enemies !== lastEnemies && lastEnemies) {
        await shot(`${dir}/ch${idx + 1}-phase-${rec.timeline.length}.png`, {
          game, chapter: id, size: '1600x900', input: 'real keyboard to enter; turns by the shipped intended strategy', injected: false,
          asserted: `battleState enemy ids = ${a.enemies}; audioDebug playing = ${JSON.stringify(a.music)}`,
          state: `mid-encounter phase change to ${a.enemies}; music now ${JSON.stringify(a.music)}`,
        });
      }
      lastMusic = key; lastEnemies = a.enemies;
      if (!rec.audioRaw) rec.audioRaw = a.raw;
    }
    const auto = await page.evaluate(() => window.__pyrefly.battle?.()?.presenter?.snapshot?.().auto);
    if (!auto || a.enemies !== armed) { armed = a.enemies; await page.evaluate(() => { window.__pyrefly.setBattleSpeed('fast'); window.__pyrefly.autoBattle('intended'); }); }
    await page.waitForTimeout(500);
  }
  rec.endScreen ??= await scr();
} catch (e) { rec.error = String(e); console.error('ERR', e); }
finally {
  rec.consoleErrors = consoleErrors;
  rec.audioFilesRequested = [...new Set(net.filter((u) => /\.(mp3|ogg|wav|m4a)/i.test(u)))];
  fs.mkdirSync(path.join(EV, dir), { recursive: true });
  fs.writeFileSync(path.join(EV, dir, `ch${idx + 1}.json`), JSON.stringify(rec, null, 1));
  console.log('AUDIO FILES REQUESTED:', JSON.stringify(rec.audioFilesRequested, null, 1));
  console.log('END', rec.endScreen, 'timeline', rec.timeline.length, 'err', rec.error);
  await browser.close();
}
