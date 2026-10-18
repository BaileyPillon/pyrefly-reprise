#!/usr/bin/env node
/**
 * Install the FFX voice recordings in one of their two variants, in one command.
 *
 *   node tools/audio/voice-variant.mjs                  install the DEFAULT variant (tight: pauses shortened)
 *   node tools/audio/voice-variant.mjs tight            install "pauses shortened"
 *   node tools/audio/voice-variant.mjs recorded         install "as recorded" (81 lines fail the pause gate and are accepted, listed in the report)
 *   node tools/audio/voice-variant.mjs <variant> --check    measure and print, write nothing into public/
 *   node tools/audio/voice-variant.mjs --list           the variants and what each one is
 *
 * Switching is the same command with the other name: every file the other variant installed is replaced (voice-ship `--clean`), the
 * manifests and the report are rewritten, and the report records which variant is in `public/audio/voice/` ("variant").
 * The variants, their folders and the lines left as text only (`mute`) are in `tools/audio/voice-variants.json`.
 *
 * Why tight is the default: ONLY it passes the ship gate. In the recorded variant 81 recordings hold a pause of 404 to 673 ms inside
 * the line (the gate's limit is 400 ms), which voice-ship FAILS; installing it means accepting those 81 findings. Bailey has not
 * picked between the two; this is the choice that needs no exception. Game case: FFX only (voice-lib.mjs).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as L from './elevenlabs-lib.mjs';
import * as W from './voice-variant-lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const config = W.loadVariants(path.join(here, 'voice-variants.json'));
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const names = argv.filter((a) => !a.startsWith('--'));
const die = (msg) => { console.error(`voice-variant: ${msg}`); process.exit(1); };

if (flags.has('--list')) {
  for (const [name, v] of Object.entries(config.variants)) console.log(`${name}${name === config.default ? ' (default)' : ''}: ${v.label}. ${v.about}`);
  console.log(`muted (text only): ${config.mute.length ? config.mute.join(', ') : 'none'}`);
  process.exit(0);
}
const name = names[0] ?? config.default;
const variant = config.variants[name] ?? die(`no variant "${name}" (have: ${Object.keys(config.variants).join(', ')})`);
if (names.length > 1) die('one variant name at most');

const staging = path.resolve(variant.staging);
if (L.insideRepo(staging)) die('the staging folder lives outside the repo');
const plan = W.planVariant(variant);
const counts = W.stage(plan, staging);
console.log(`variant "${name}" (${variant.label}): ${plan.ids.length} recordings staged in ${staging} (${counts.linked} linked, ${counts.copied} copied, ${counts.kept} kept, ${counts.removed} removed); ${variant.overlay ? `${plan.overlaid.length} taken from ${variant.overlay}` : 'all as recorded'}`);

let accept = [];
if (variant.acceptPausesOf) {
  const other = W.planVariant(config.variants[variant.acceptPausesOf] ?? die(`variant "${variant.acceptPausesOf}" is not defined`));
  accept = other.overlaid;
  console.log(`NOTE: "${name}" does not pass the ship gate on its own. ${accept.length} recordings hold a pause over 400 ms; they are installed with that finding accepted (listed under "accepted" in the report). "${config.default}" passes without an exception.`);
}
if (config.mute.length) console.log(`muted, kept as text only: ${config.mute.join(', ')}`);

const args = W.shipArgs({ name, stagingDir: staging, mute: config.mute, accept, install: !flags.has('--check') });
const r = spawnSync(process.execPath, [path.join(here, 'voice-ship.mjs'), ...args], { stdio: 'inherit', cwd: L.ROOT });
process.exit(r.status ?? 1);
