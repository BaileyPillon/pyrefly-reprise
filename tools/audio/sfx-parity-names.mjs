#!/usr/bin/env node
/**
 * SFX parity, the names a pack may hold: every recorded original is looked up by a NAME, and a pack cue whose name nothing asks
 * for is a sound that is never played. This prints the names a game's packs can use, as JSON, so the packer
 * (`sfx-parity-sprite.py`) can refuse a mistake before it is installed and the units can check what ships.
 *
 *   node tools/audio/sfx-parity-names.mjs --game ffx2
 *
 *   { "game": "ffx2", "names": { "swing-ormi": { "kind": "event", "rows": ["ffx2.lb.ormi.attack"] },
 *                                  "results-loop": { "kind": "flow", "rows": ["ffx2.flow.results"] },
 *                                  "fire-x2": { "kind": "event", "rows": ["ffx2.fire"] },
 *                                  "cursor-move-x2": { "kind": "stand-in", "rows": [] }, ... } }
 *
 * `event`: a hook gives the name (`src/audio/sfxV2/eventCues*.ts`), and the cue's `specRow` must be one of its rows. `flow`: a
 * screen plays it (`flowSlots.ts`). `stand-in`: a v2 cue of that game, which a menu key looks up by its own name (it has no
 * single row). Game case: both; a name is listed only for the game that asks for it (rule 14).
 */
import { EVENT_HOOKS } from '../../src/audio/sfxV2/eventRules.ts';
import { FLOW_SLOTS } from '../../src/audio/sfxV2/flowSlots.ts';
import { V2_CUES } from '../../src/audio/sfxV2/cues.ts';

const args = process.argv.slice(2);
const game = args[args.indexOf('--game') + 1];
if (game !== 'ffx' && game !== 'ffx2') {
  console.error('usage: node tools/audio/sfx-parity-names.mjs --game ffx|ffx2');
  process.exit(2);
}

const names = {};
for (const [name, cue] of Object.entries(V2_CUES)) if (cue.game === 'both' || cue.game === game) names[name] = { kind: 'stand-in', rows: [] };
for (const hook of EVENT_HOOKS[game]) {
  if (hook.cue === null) continue;
  const entry = names[hook.cue] && names[hook.cue].kind === 'event' ? names[hook.cue] : (names[hook.cue] = { kind: 'event', rows: [] });
  if (!entry.rows.includes(hook.row)) entry.rows.push(hook.row);
}
for (const slot of FLOW_SLOTS) if (slot.game === game) names[slot.cue] = { kind: 'flow', rows: [slot.row] };

console.log(JSON.stringify({ game, names }, null, 1));
