import type { BattleState, FFXCombatant } from '../../battle/common/types.ts';
import {
  BAND_HEIGHTENED,
  BAND_KOZUKA,
  BAND_WAKIZASHI,
  BAND_ZANMATO,
  yojimboBand,
  yojimboPool,
  YOJIMBO_DAIGORO_ORDER,
  YOJIMBO_KOZUKA,
  YOJIMBO_WAKIZASHI,
  YOJIMBO_ZANMATO,
  type YojimboBand,
} from '../../battle/ffx/ai/yojimbo-rules.ts';
import { YOJIMBO_ABILITIES } from '../../data/ffx/enemies/yojimbo-abilities.ts';

/**
 * What Yojimbo's Zanmato gauge says, as data — **FFX only, Chapter IX only.**
 *
 * Pure and DOM-free, so the widget (`ZanmatoGauge.ts`) only paints and the
 * tests can pin every word it prints. Bailey's pick on O-5 (2026-09-24, "I'll
 * go with your recommendations for all"): option A, the bar under his name,
 * plus option C's one-shot full-gauge banner
 * (`docs/concepts/chapters/yojimbo/gauge/a-{mid,full}{,-phone}.html`,
 * `c-full{,-phone}.html`).
 *
 * **Game case: FFX only** (AGENTS.md rule 14). FFX's Yojimbo carries an enemy
 * Overdrive gauge that decides his move pool and fires Zanmato at 100
 * (`research/ffx-yojimbo.md` §4); FFX-2's Yojimbo is a different fight with no
 * such gauge (§0.3). The gate is the engine's own mark: the one enemy whose
 * `overdrive.enemyGaugeRules` is `'yojimbo'`, which only
 * `src/battle/ffx/ai/yojimbo-rules.ts#applyYojimboSetup` ever sets. No other
 * enemy in either game publishes it, so no other chapter draws this widget.
 */

/** The engine's mark for the one gauge this widget reads. */
export const ZANMATO_GAUGE_RULES = 'yojimbo';

/**
 * Zanmato's damage as the panel and banner print it: 200 x 50 = 10,000,
 * capped at 9,999 [`research/ffx-yojimbo.md` §3.1 row 4:133, verified: 4
 * sources; §4.1 "9,999 to the whole party", verified: 3 sources].
 */
export const ZANMATO_DAMAGE_TEXT = '9,999';

/** One segment of the bar: the band it stands for and how full it is. */
export interface ZanmatoSegment {
  /** Gauge value where the band starts, inclusive. */
  from: number;
  /** Gauge value where the band ends. */
  to: number;
  /** 0..1, how much of this segment the gauge has filled. */
  fill: number;
  /** The label under its start: the move the band adds, or '' for the 80 band. */
  label: string;
}

export interface ZanmatoGaugeView {
  /** The display name printed on the panel (the combatant's own name). */
  name: string;
  /** The gauge, clamped to 0..100 and rounded. */
  gauge: number;
  band: YojimboBand;
  /** True at 100: the chip replaces the percentage and the bar burns. */
  full: boolean;
  /** "58%" */
  pctText: string;
  /** "Zanmato · his next turn" — only meaningful when `full`. */
  chipText: string;
  segments: readonly ZanmatoSegment[];
  /** "Next: Daigoro, Kozuka or Wakizashi" / "Next: Zanmato · 9,999 to each on the field" */
  nextText: string;
}

/** The banner's two lines (option C, full gauge): "Zanmato" over "Yojimbo strikes on his next turn · 9,999 to each on the field". */
export function zanmatoBanner(name: string): { title: string; line: string } {
  return {
    title: moveName(YOJIMBO_ZANMATO),
    line: `${name} strikes on his next turn · ${ZANMATO_DAMAGE_TEXT} to each on the field`,
  };
}

/** The display name of a move in his pool, from the sourced ability data. */
function moveName(abilityId: string): string {
  return YOJIMBO_ABILITIES[abilityId]?.name ?? abilityId;
}

/** "A", "A or B", "A, B or C". */
function orList(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
}

/**
 * The bands as the mockup draws them: Daigoro from 0, "+ Kozuka" from 25,
 * "+ Wakizashi" from 50 and the unlabelled 80 band [§4.1, verified: 3
 * sources for 25/50/100, 2 for 80]. The 80 band changes no odds in the
 * engine (B2, the "slightly likelier" nudge is not modelled), so it carries
 * no words, exactly as in the picked mockup.
 */
const BANDS: ReadonlyArray<{ from: number; to: number; label: string }> = [
  { from: 0, to: BAND_KOZUKA, label: moveName(YOJIMBO_DAIGORO_ORDER) },
  { from: BAND_KOZUKA, to: BAND_WAKIZASHI, label: `+ ${moveName(YOJIMBO_KOZUKA)}` },
  { from: BAND_WAKIZASHI, to: BAND_HEIGHTENED, label: `+ ${moveName(YOJIMBO_WAKIZASHI)}` },
  { from: BAND_HEIGHTENED, to: BAND_ZANMATO, label: '' },
];

/** The view for a gauge value. */
export function zanmatoGaugeView(name: string, rawGauge: number): ZanmatoGaugeView {
  const gauge = Math.max(0, Math.min(BAND_ZANMATO, Math.round(Number.isFinite(rawGauge) ? rawGauge : 0)));
  const full = gauge >= BAND_ZANMATO;
  const segments = BANDS.map((b) => ({
    ...b,
    fill: Math.max(0, Math.min(1, (gauge - b.from) / (b.to - b.from))),
  }));
  const nextText = full
    ? `Next: ${moveName(YOJIMBO_ZANMATO)} · ${ZANMATO_DAMAGE_TEXT} to each on the field`
    : `Next: ${orList(yojimboPool(gauge).map(moveName))}`;
  return {
    name,
    gauge,
    band: yojimboBand(gauge),
    full,
    pctText: `${gauge}%`,
    chipText: `${moveName(YOJIMBO_ZANMATO)} · his next turn`,
    segments,
    nextText,
  };
}

/**
 * The one enemy that carries Yojimbo's gauge, or `null` — which is every
 * battle but Chapter IX's. A defeated Yojimbo draws no gauge.
 */
export function findZanmatoGaugeOwner(state: Readonly<BattleState> | null): FFXCombatant | null {
  if (!state) return null;
  for (const c of Object.values(state.combatants) as FFXCombatant[]) {
    if (c.side !== 'enemy' || !c.alive) continue;
    if (c.overdrive?.enemyGaugeRules === ZANMATO_GAUGE_RULES) return c;
  }
  return null;
}

/** True when a gauge move takes it from below full to full: the banner's one cue. */
export function reachesFull(from: number | null, to: number): boolean {
  return from !== null && from < BAND_ZANMATO && to >= BAND_ZANMATO;
}

