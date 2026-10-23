/**
 * Installs the audio pass's in-battle voice lines (conference demo sound pass, 2026-10-22; decision 184) from a scratch folder of mastered mp3s into
 * `public/audio/voice-pass/<chapter>/<id>.mp3` and writes `public/audio/voice-pass/<chapter>.json`, a chapter manifest in the shape of `voice/<chapter>.json`.
 *
 *   node tools/audio/voice-pass-install.mjs <shipped.json> <ship dir> <chapter>
 *
 * `shipped.json` is `{ <line id>: { speaker, text, ms, bytes, lufs, truePeakDb, ... } }` written by the mastering step (`voice-ship-lib.mjs` `processLine`: trimmed, -19 LUFS dual mono, true peak
 * at most -1 dBTP, mono 24 kHz 64 kbps). The lines live in their own folder, NOT in `public/audio/voice/`, so the shipped voice folder, its audit and its picked-voices test are untouched;
 * the game reads them only when the sound pass is asked for (`audio/voice/VoiceBank.ts`). Keys are `lineKey(speaker, text)`, as the game finds a line.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [shippedFile, shipDir, chapter] = process.argv.slice(2);
if (!shippedFile || !shipDir || !chapter) throw new Error('usage: voice-pass-install.mjs <shipped.json> <ship dir> <chapter>');
const { lineKey } = await import(pathToFileURL(path.join(root, 'src/story/voice/voiceKey.ts')).href);
const shipped = JSON.parse(fs.readFileSync(shippedFile, 'utf8'));
const outDir = path.join(root, 'public/audio/voice-pass', chapter);
fs.mkdirSync(outDir, { recursive: true });
const lines = {};
for (const [id, s] of Object.entries(shipped)) {
  if (s.fail && s.fail.length) throw new Error(`${id} failed the ship gate: ${s.fail.join('; ')}`);
  fs.copyFileSync(path.join(shipDir, `${id}.mp3`), path.join(outDir, `${id}.mp3`));
  lines[lineKey(s.speaker, s.text)] = { id, file: `${chapter}/${id}.mp3`, ms: s.ms, who: s.speaker };
}
const manifest = { version: 1, chapter, game: 'ffx', about: 'The sound pass (?audio=new): in-battle lines Chapter I does not voice today. Own folder; read only when the pass is asked for.', lines };
fs.writeFileSync(path.join(root, 'public/audio/voice-pass', `${chapter}.json`), JSON.stringify(manifest, null, 1) + '\n');
console.log(`${Object.keys(lines).length} lines -> ${outDir}`);
