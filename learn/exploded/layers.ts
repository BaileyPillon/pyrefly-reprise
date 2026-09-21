/**
 * Site C ("Pyrefly Reprise, exploded") — the nine components of one finished
 * battle frame, as static architecture facts (`docs/plans/learning-sites.md`
 * "C · exploded/"). The specimen is fixed: Chapter 2, Lady Yunalesca, the
 * Zanarkand Dome great hall — FFX only (AGENTS.md hard rule 14), matching the
 * verified mockup frames in `docs/concepts/atlas/c-scene-exploded/`.
 *
 * The first six components are on-screen planes, back to front (a depth
 * order `arrange.ts` turns into z positions); the last three are non-visual
 * rails — the rules that produced the frame, not paint on a plane.
 *
 * Card text is copied or tightly paraphrased from `docs/ARCHITECTURE.md`,
 * `docs/ART-PIPELINE.md`, `docs/AUDIO-GUIDE.md` or
 * `docs/handoff/presentation-ink-and-gold.md`. Three facts are not covered by
 * those four (reported alongside this file, not silently patched over):
 *
 * - The exact `BattleEvent` count. `docs/ARCHITECTURE.md`'s own list enumerates
 *   about 22 members; the real union in `src/battle/common/types.ts` has 36.
 *   That file is cited instead, and the count is read from it by hand.
 * - What renders the music. `docs/ARCHITECTURE.md` still says "Web Audio
 *   synthesis"; `AGENTS.md`'s map row for `src/audio` says prerendered sampled
 *   music with a synth fallback, which is what actually ships. `AGENTS.md` is
 *   cited instead, per the brief for this file.
 * - The hit-effect composition (slash arc / spark burst / impact flash) is not
 *   in any of the four named docs — only in `docs/ENGINE-API.md` § `VFX`, which
 *   `AGENTS.md`'s own directory map names as the second authority for
 *   `src/engine` (alongside `docs/ARCHITECTURE.md`). Cited on that basis.
 *
 * Facts that depend on the art manifest (a subject's painted pose count, for
 * example) are **not** here — they are computed in `specimen.ts` from the
 * manifest passed to `buildFrameSpecimen`, never typed, per AGENTS.md hard
 * rule 6.
 */

import type { PieceCardTab, PieceFact, PieceKind, SystemInput } from '../shared/model.ts';

/** One of the nine components, before the manifest-derived facts and stage position are added. */
export interface LayerDef {
  /** Also the system id in `LAYER_SYSTEMS`. */
  readonly id: string;
  /** 1-9, the frame's own numbering (matches the verified mockup panel). */
  readonly order: number;
  readonly name: string;
  /** True for the six visible planes; false for the three non-visual rails. */
  readonly onScreen: boolean;
  readonly kind: PieceKind;
  /** Path under `public/art/`, when this layer is (or stands for) a specific painted asset. */
  readonly art?: string;
  /**
   * Relative linear size for `pack.ts`'s largest-first ordering. For the
   * paintings this is a real documented canvas dimension; for the four
   * non-painted layers (light, effects, and the three rails) there is no
   * canvas, so a smaller placeholder is used and said so below.
   */
  readonly size: number;
  readonly eyebrow: string;
  readonly body: string;
  readonly claimKind: string;
  readonly cite: string;
  readonly tabs: readonly PieceCardTab[];
  readonly honesty?: string;
  readonly staticFacts: readonly PieceFact[];
}

/**
 * Display swatches for the systems panel — a grouping colour, not a sourced
 * fact, so it needs no citation. Three reuse the actual Ink & Gold tokens
 * where one applies (`docs/handoff/presentation-ink-and-gold.md` "Tokens").
 */
export const LAYER_SYSTEMS: readonly SystemInput[] = [
  { id: 'backdrop-painting', name: 'Backdrop painting', colour: '#2E4A6B' },
  { id: 'light-atmosphere', name: 'Light and atmosphere', colour: '#F4D793' },
  { id: 'boss-billboard', name: 'Boss billboard', colour: '#B02A2A' }, // --blood
  { id: 'party-billboards', name: 'Party billboards', colour: '#E3B94A' }, // --yevon-gold
  { id: 'effects', name: 'Effects', colour: '#BEE1FF' },
  { id: 'hud-ink-gold', name: 'HUD, Ink & Gold', colour: '#F4F1E8' }, // --paper
  { id: 'battle-engine', name: 'Battle engine', colour: '#6B7280' },
  { id: 'presenter', name: 'Presenter', colour: '#8A7CA8' },
  { id: 'music-sound', name: 'Music and sound', colour: '#3E7C6B' },
];

const overviewTab = (body: string): PieceCardTab => ({ id: 'overview', label: 'Overview', body });
const howTab = (body: string): PieceCardTab => ({ id: 'how', label: 'How it is made', body });

const GENERATED_LOCALLY = 'Generated locally · ComfyUI pipeline';

export const LAYERS: readonly LayerDef[] = [
  {
    id: 'backdrop-painting',
    order: 1,
    name: 'Backdrop painting',
    onScreen: true,
    kind: 'painting',
    art: 'backdrops/zanarkand-dome',
    size: 2688,
    eyebrow: '01 · On screen',
    claimKind: 'How the renderer builds it',
    cite: 'docs/ARCHITECTURE.md § Painted 2.5D rendering',
    body:
      "The back wall of the diorama: one wide matte painting on a far plane, plus two masked " +
      'bands cut from the same image for parallax, a lit ground plane tinted from the painting’s ' +
      'own lowest rows, and drifting mist.',
    tabs: [
      overviewTab(
        "The back wall of the diorama: one wide matte painting on a far plane, plus two masked " +
          'bands cut from the same image for parallax, a lit ground plane tinted from the ' +
          'painting’s own lowest rows, and drifting mist.',
      ),
      howTab(
        'Painted offline by a local ComfyUI pipeline and dropped into public/art/backdrops/<scene>.png ' +
          'at 2688×1536 — a 1344×768 render, upscaled ×2 ' +
          '(docs/ART-PIPELINE.md § 3. Generating › Backdrops). The engine only ever loads the ' +
          'finished PNG; nothing about the game touches the network at runtime.',
      ),
    ],
    honesty: GENERATED_LOCALLY,
    staticFacts: [
      { label: 'Canvas', value: '2688 × 1536 (from a 1344 × 768 render, upscaled ×2)' },
      { label: 'Depth bands', value: '2, cut from the same painting' },
    ],
  },
  {
    id: 'light-atmosphere',
    order: 2,
    name: 'Light and atmosphere',
    onScreen: true,
    kind: 'card',
    // Not a painted asset — a post-processing and particle layer over the backdrop.
    size: 900,
    eyebrow: '02 · On screen',
    claimKind: 'How the renderer builds it',
    cite: 'docs/ARCHITECTURE.md § Painted 2.5D rendering',
    body:
      'Bloom, a tilt-shift depth of field focused on the actors, a vignette and a per-scene colour ' +
      'grade sit over the backdrop; a light rig samples its colours from the backdrop’s own palette.',
    tabs: [
      overviewTab(
        'Bloom, a tilt-shift depth of field focused on the actors, a vignette and a per-scene colour ' +
          'grade sit over the backdrop; a light rig samples its colours from the backdrop’s own palette.',
      ),
      howTab(
        'The post chain is RenderPass → UnrealBloomPass (threshold ≈ 0.90, raised because an ' +
          'AI-painted backdrop has bright paint everywhere) → tilt-shift depth of field, blurred by ' +
          'depth band → vignette + grade, driven by a per-scene ScenePalette. Drifting particles ' +
          '(pyreflies, snow, embers, petals) render as GPU shader points.',
      ),
    ],
    staticFacts: [
      { label: 'Bloom threshold', value: '≈ 0.90 (raised from the visual bible’s selective-bloom range)' },
    ],
  },
  {
    id: 'boss-billboard',
    order: 3,
    name: 'Boss billboard',
    onScreen: true,
    kind: 'painting',
    art: 'characters/yunalesca-1/hurt',
    size: 1216,
    eyebrow: '03 · On screen',
    claimKind: 'How the renderer builds it',
    cite: 'docs/ARCHITECTURE.md § Painted 2.5D rendering',
    body:
      'A flat cut-out that always faces the camera: two crossfading textured planes sized by world ' +
      'height, unlit but rim- and bounce-lit by the scene’s light rig, with a soft contact shadow so ' +
      'it never looks pasted onto the backdrop.',
    tabs: [
      overviewTab(
        'A flat cut-out that always faces the camera: two crossfading textured planes sized by ' +
          'world height, unlit but rim- and bounce-lit by the scene’s light rig, with a soft contact ' +
          'shadow so it never looks pasted onto the backdrop.',
      ),
      howTab(
        'Painted three-quarter, facing left toward the party — the boss/enemy/aeon convention in ' +
          'docs/ART-PIPELINE.md § 2a, the mirror of a party member’s facing — with the same style ' +
          'and quality tags as the rest of the cast, cut out with rembg, and planted on the ground by ' +
          'baselineY, the lowest opaque row of the cropped PNG.',
      ),
    ],
    honesty: GENERATED_LOCALLY,
    staticFacts: [
      { label: 'Chapter', value: 'II · Lady Yunalesca · Zanarkand Dome (src/data/encounters.ts)' },
      { label: 'Facing', value: 'Left — the boss/enemy/aeon convention (docs/ART-PIPELINE.md § 2a)' },
    ],
  },
  {
    id: 'party-billboards',
    order: 4,
    name: 'Party billboards',
    onScreen: true,
    kind: 'painting',
    art: 'characters/tidus/attack',
    size: 1216,
    eyebrow: '04 · On screen',
    claimKind: 'How the renderer builds it',
    cite: 'docs/ARCHITECTURE.md § Painted 2.5D rendering',
    body:
      'Every party member renders the same way as the boss — two crossfading planes, a contact ' +
      'shadow, rim and bounce light from the scene — just facing the other way.',
    tabs: [
      overviewTab(
        'Every party member renders the same way as the boss — two crossfading planes, a contact ' +
          'shadow, rim and bounce light from the scene — just facing the other way.',
      ),
      howTab(
        'Painted three-quarter, facing right toward the boss — the party/ally convention in ' +
          'docs/ART-PIPELINE.md § 2a — through the same style, quality and cutout pipeline as every ' +
          'other subject. Three of the seven-member FFX roster act in this frame: Tidus attacks, Yuna and ' +
          'Auron stand idle (a seed-1 engine run, src/data/ffx/builds/zanarkand.ts).',
      ),
    ],
    honesty: GENERATED_LOCALLY,
    staticFacts: [
      { label: 'On screen', value: 'Tidus (attack), Yuna (idle), Auron (idle)' },
      { label: 'Facing', value: 'Right — the party/ally convention (docs/ART-PIPELINE.md § 2a)' },
    ],
  },
  {
    id: 'effects',
    order: 5,
    name: 'Effects',
    onScreen: true,
    kind: 'card',
    size: 800,
    eyebrow: '05 · On screen',
    claimKind: 'How the renderer builds it',
    // Not in ARCHITECTURE/ART-PIPELINE/AUDIO-GUIDE/presentation-ink-and-gold — see the file header.
    // docs/ENGINE-API.md is AGENTS.md's own second authority for src/engine, alongside ARCHITECTURE.md.
    cite: 'docs/ENGINE-API.md § VFX',
    body:
      'A hit plays three billboarded effects together: a sweeping slash arc, a burst of GPU-point ' +
      'sparks, and a soft additive impact flash.',
    tabs: [
      overviewTab(
        'A hit plays three billboarded effects together: a sweeping slash arc, a burst of GPU-point ' +
          'sparks, and a soft additive impact flash.',
      ),
      howTab(
        '`HitEffects` (src/engine/VFX.ts) bundles the three: `SlashArc` is an annulus-sector shader ' +
          'whose bright head sweeps the arc and drags a wake; `SparkBurst` is a GPU points burst with ' +
          'per-particle velocity and life; `ImpactFlash` is a soft additive bloom at the point of impact. ' +
          'All three billboard to the camera every frame.',
      ),
    ],
    staticFacts: [{ label: 'Kinds', value: '3 — slash arc, spark burst, impact flash' }],
  },
  {
    id: 'hud-ink-gold',
    order: 6,
    name: 'HUD, Ink & Gold',
    onScreen: true,
    kind: 'card',
    size: 900,
    eyebrow: '06 · On screen',
    claimKind: "The interface's own components",
    cite: 'docs/handoff/presentation-ink-and-gold.md § Components',
    body:
      'The DOM chrome over the painted scene: skewed ivory-and-ink slabs for every window, one gold ' +
      'accent for acting/selected/ready state (pyre-pink in FFX-2), and constant film grain tying paint ' +
      'and chrome into one surface.',
    tabs: [
      overviewTab(
        'The DOM chrome over the painted scene: skewed ivory-and-ink slabs for every window, one ' +
          'gold accent for acting/selected/ready state (pyre-pink in FFX-2), and constant film grain ' +
          'tying paint and chrome into one surface.',
      ),
      howTab(
        'Built once in src/ui/inkgold/ (tokens.css, slabs.css, wipe.ts, cutin.ts) and adopted by each ' +
          'HUD owner, never re-implemented per screen. This frame’s eight components: Slab, Action ' +
          'banner, Command stack, CTB queue, Party status, Target bracket, Damage numeral, Surface ' +
          '(grain + vignette).',
      ),
    ],
    staticFacts: [{ label: 'Components', value: '8 (Slab, Action banner, Command stack, CTB queue, Party status, Target bracket, Damage numeral, Surface)' }],
  },
  {
    id: 'battle-engine',
    order: 7,
    name: 'Battle engine',
    onScreen: false,
    kind: 'card',
    size: 400,
    eyebrow: '07 · Not on screen',
    claimKind: 'What it reports',
    // Doc lag (file header): ARCHITECTURE.md's own event list runs to about 22; the real
    // union has 36. Cited straight to the code, and the count is read from it by hand.
    cite: 'src/battle/common/types.ts § BattleEvent union',
    body:
      'Pure TypeScript, zero DOM or Three.js imports, deterministic under a seeded RNG. It never ' +
      'animates — it emits an ordered list of BattleEvents per resolved action, and presentation ' +
      'plays those events afterwards (docs/ARCHITECTURE.md § Layering rule).',
    tabs: [
      overviewTab(
        'Pure TypeScript, zero DOM or Three.js imports, deterministic under a seeded RNG. It never ' +
          'animates — it emits an ordered list of BattleEvents per resolved action, and presentation ' +
          'plays those events afterwards.',
      ),
      howTab(
        'The BattleEvent union (src/battle/common/types.ts) has 36 members — turn-start, ' +
          'action-start, action-end, damage, heal, miss, mp-damage, mp-heal, status-add, status-remove, ' +
          'status-tick, ko, revive, overdrive-gauge, message, sensor, summon, dismiss, switch, ' +
          'form-change, counter, charge, part-destroyed, part-restored, script-trigger, escape-attempt, ' +
          'victory, defeat, chain, atb, spherechange, minigame-request, camera, vfx, sfx, wait. ' +
          'docs/ARCHITECTURE.md’s own list only names about 22 of them — counted from the code, not ' +
          'the doc.',
      ),
    ],
    staticFacts: [{ label: 'Event types', value: '36 (src/battle/common/types.ts, not docs/ARCHITECTURE.md’s ~22)' }],
  },
  {
    id: 'presenter',
    order: 8,
    name: 'Presenter',
    onScreen: false,
    kind: 'card',
    size: 380,
    eyebrow: '08 · Not on screen',
    claimKind: 'What it does',
    cite: 'docs/ARCHITECTURE.md § Layering rule',
    body:
      'The presentation layer (engine/ + ui/) plays each BattleEvent with timing — wind-ups, camera ' +
      'moves, VFX, HUD updates, audio — then calls back for the next decision.',
    tabs: [
      overviewTab(
        'The presentation layer (engine/ + ui/) plays each BattleEvent with timing — wind-ups, ' +
          'camera moves, VFX, HUD updates, audio — then calls back for the next decision.',
      ),
      howTab(
        // ARCHITECTURE.md does not enumerate the presenter's own file count; read from the
        // directory listing (src/engine/BattlePresenter*.ts), not a doc.
        'Split across 12 files under src/engine/BattlePresenter*.ts — Actors, Art, Beats, Events, ' +
          'Fallbacks, Ports, Stage, Strategies, Tactics, Util, Vitals, and the top-level ' +
          'BattlePresenter.ts that owns the sequence.',
      ),
    ],
    staticFacts: [{ label: 'Files', value: '12 (src/engine/BattlePresenter*.ts)' }],
  },
  {
    id: 'music-sound',
    order: 9,
    name: 'Music and sound',
    onScreen: false,
    kind: 'card',
    size: 360,
    eyebrow: '09 · Not on screen',
    claimKind: 'What actually plays',
    // Doc lag (file header): ARCHITECTURE.md still says "Web Audio synthesis"; the map row in
    // AGENTS.md is what actually ships. Cited to AGENTS.md per the brief for this file.
    cite: 'AGENTS.md § Map (src/audio row)',
    body:
      'Every cue is composed as code and ships as a prerendered, sampled MP3 (public/audio/) — not ' +
      'synthesised at runtime. A synthesised voice remains only as the fallback for a cue that has not ' +
      'been rendered yet.',
    tabs: [
      overviewTab(
        'Every cue is composed as code and ships as a prerendered, sampled MP3 (public/audio/) — ' +
          'not synthesised at runtime. A synthesised voice remains only as the fallback for a cue that ' +
          'has not been rendered yet.',
      ),
      howTab(
        'This chapter declares 3 music cues — scene, battle, victory (src/data/encounters.ts, ' +
          'YUNALESCA.music) — scene-zanarkand-dome, boss-yunalesca and victory-ffx.',
      ),
    ],
    staticFacts: [{ label: 'Cues, this chapter', value: '3 — scene, battle, victory (src/data/encounters.ts)' }],
  },
];
