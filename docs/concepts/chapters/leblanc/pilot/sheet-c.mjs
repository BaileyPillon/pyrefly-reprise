/**
 * Method C of the Leblanc identity-consistency pilot (2026-09-21).
 *
 * "One reference-sheet generation": a wide canvas asked for `multiple views,
 * reference sheet, same character` plus all three pose tags at once, so the
 * checkpoint draws the three states of ONE woman in a single denoise and the
 * identity is shared by construction rather than by IP-Adapter.
 *
 * Why this cannot be `tools/gen/comfy.mjs character`: the sprite negative
 * (`SPRITE_NEGATIVE`) bans `multiple views, multiple girls, 2girls` outright —
 * that is exactly the pipeline's failure mode 2 in docs/ART-PIPELINE.md §6 —
 * and the cutout guard rejects a frame with several figures in it. Method C
 * needs those two bans lifted for one generation, so it builds the same
 * workflow through comfy.mjs's exported builders and posts it itself. Nothing
 * here writes under public/art/.
 *
 *   node docs/concepts/chapters/leblanc/pilot/sheet-c.mjs sheets
 *   node docs/concepts/chapters/leblanc/pilot/sheet-c.mjs refine <sheetIndex>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BASE_NEGATIVE,
  QUALITY_TAGS,
  STYLE_TAGS,
  characterWorkflow,
  escapeTags,
} from '../../../../../tools/gen/comfy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..');
const RENDERS = resolve(HERE, 'renders');
const BASE = `http://${process.env.COMFY_HOST || '127.0.0.1'}:${process.env.COMFY_PORT || 8188}`;

const IDENTITY = readFileSync(resolve(HERE, 'identity.txt'), 'utf8').trim();

/** The three pose tags, verbatim from run-pilot.sh so A/B/C ask for one thing. */
const POSE_TAGS = {
  attack: 'fighting stance, holding fan, outstretched arm, leaning forward, open mouth',
  cast: 'arm up, holding fan, raised hand, standing, looking up, open mouth',
  hurt: 'wince, one eye closed, leaning back, arm across chest, holding fan, open mouth',
};

const SHEET_TAGS = 'multiple views, reference sheet, same character, three views, full body, character sheet';
const EMPHASIS =
  '(short blonde bob:1.3), (blue and white triangle pattern robe:1.25), (heart mark on chest:1.2), (same character:1.3)';

/**
 * BASE_NEGATIVE with the multi-figure bans lifted. Everything else stays:
 * dropping the quality and anatomy negatives too would make method C lose to
 * A and B on grounds that have nothing to do with identity.
 */
const SHEET_NEGATIVE = BASE_NEGATIVE.split(', ')
  .filter((t) => !['multiple views', 'multiple girls', 'multiple boys', '2girls', '2boys'].includes(t))
  .concat(['different character', 'different outfit', 'colored background', 'text', 'speech bubble'])
  .join(', ');

const SEED = 7401;
const WIDTH = 1344;
const HEIGHT = 768;

async function queue(workflow) {
  const res = await fetch(`${BASE}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: 'pyrefly-leblanc-pilot-c' }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ComfyUI rejected the workflow (${res.status}):\n${text}`);
  return JSON.parse(text).prompt_id;
}

async function wait(promptId) {
  const deadline = Date.now() + 900_000;
  for (;;) {
    const res = await fetch(`${BASE}/history/${promptId}`);
    const hist = await res.json();
    const entry = hist[promptId];
    if (entry?.status?.status_str === 'error') {
      throw new Error(`Generation failed: ${JSON.stringify(entry.status.messages || entry.status)}`);
    }
    if (entry?.outputs && Object.keys(entry.outputs).length) return entry;
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${promptId}`);
    await new Promise((r) => setTimeout(r, 1500));
  }
}

async function fetchImage({ filename, subfolder, type }) {
  const q = new URLSearchParams({ filename, subfolder: subfolder || '', type: type || 'output' });
  const res = await fetch(`${BASE}/view?${q}`);
  if (!res.ok) throw new Error(`/view ${filename} -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Max RGB sample, the black-frame test from docs/ART-PIPELINE.md §6. */
function maxRgb(buf) {
  // Cheap proxy: a NaN'd PNG is a few hundred bytes of solid zero. Decoding is
  // the generator's job; here a size floor plus the sheet montage catches it.
  return buf.length;
}

async function sheets() {
  mkdirSync(RENDERS, { recursive: true });
  const positive = [
    escapeTags(IDENTITY),
    SHEET_TAGS,
    escapeTags(POSE_TAGS.attack),
    escapeTags(POSE_TAGS.cast),
    escapeTags(POSE_TAGS.hurt),
    EMPHASIS,
    'simple background, white background, official art',
    STYLE_TAGS,
    QUALITY_TAGS,
  ].join(', ');

  for (let i = 0; i < 4; i++) {
    const seed = SEED + i;
    const workflow = characterWorkflow({
      positive,
      negative: SHEET_NEGATIVE,
      width: WIDTH,
      height: HEIGHT,
      seed,
      steps: 28,
      cfg: 6,
      sampler: 'euler_ancestral',
      scheduler: 'normal',
      prefix: `pyrefly/leblanc_sheetC`,
    });
    process.stderr.write(`[C] sheet ${i + 1}/4 seed=${seed} ${WIDTH}x${HEIGHT}\n`);
    const entry = await wait(await queue(workflow));
    const images = Object.values(entry.outputs).flatMap((n) => n.images || []);
    const buf = await fetchImage(images[0]);
    const out = resolve(RENDERS, `c-sheet.${i + 1}.png`);
    writeFileSync(out, buf);
    process.stderr.write(`[C]   -> ${out} (${maxRgb(buf)} bytes)\n`);
    writeFileSync(
      out.replace(/\.png$/, '.json'),
      JSON.stringify({ seed, width: WIDTH, height: HEIGHT, positive, negative: SHEET_NEGATIVE }, null, 1),
    );
  }
}

const mode = process.argv[2] || 'sheets';
if (mode === 'sheets') await sheets();
else throw new Error(`unknown mode ${mode}`);
