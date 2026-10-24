/**
 * THE PRO MARKERS' DRAWINGS (conference demo, lane "pro-look"; Bailey 2026-10-22, markers "Classic, calm, clear": T1-A "Classic hand, premium" for FFX and T4-A "Quarter-height lock-on ring" for FFX-2;
 * options book `target-lowhp-ko/target/T1-A.jpg`, `T4-A.jpg`). Two inline SVGs, so they inherit nothing and need no load; each is used only while the pro look's `markers` piece is on
 * (`TargetCursor.reposition`), and today's `HAND_SVG` / `FLOWER_SVG` (`ffx/targetCursorParts.ts`) are untouched.
 *
 * Game case (rule 14): the glove is FFX only (the pointing hand is FFX's own cursor), the ring FFX-2 only (its six-petal flower); the two chromes are never mixed.
 * Review fix (pro-look review M2, 2026-10-23): the first build scaled today's 44 x 30 vector to 230 px and it read as a thumbs-up, and the ring was a 1 px stroke with no backing. The glove is redrawn here
 * after the picked frame (a long pointing finger, a curled thumb, three curled fingers under a rounded palm, fold lines, a gold cuff with a highlight, all under one ink outline); the ring has the dark halo
 * the pick calls for (a backing disc and an ink under-stroke) so it reads on a white robe as well as on a dark dragon. Shapes, colours and sizes [ours].
 */

const INK = '#0b0a12';

/** FFX's pro glove: 120 x 52, the finger points right (the glove docks on the figure's left). */
export const PRO_HAND_SVG = `<svg viewBox="0 0 120 52" aria-hidden="true" class="pro-glove">
  <defs>
    <linearGradient id="proGloveFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d6def3"/></linearGradient>
    <linearGradient id="proGloveGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f8dc72"/><stop offset="0.55" stop-color="#e9b62b"/><stop offset="1" stop-color="#bf8a16"/></linearGradient>
  </defs>
  <g fill="url(#proGloveFill)" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <rect x="24" y="33" width="15" height="16" rx="7.5"/>
    <rect x="37" y="35" width="15" height="15" rx="7.5"/>
    <rect x="50" y="34" width="14" height="14" rx="7"/>
    <path d="M16 12H55Q66 12 66 23V34Q66 42 57 42H16Z"/>
    <rect x="26" y="2.5" width="28" height="19" rx="9.5"/>
    <rect x="56" y="18.5" width="60" height="12" rx="6"/>
    <rect x="57.5" y="20.2" width="11" height="8.6" stroke="none"/>
  </g>
  <g fill="none" stroke="#a9b6de" stroke-width="1.3" stroke-linecap="round">
    <path d="M30 38Q42 34 61 36"/>
    <path d="M72 28.4H108"/>
    <path d="M36 22Q46 25 54 22"/>
  </g>
  <rect x="2" y="9" width="17" height="36" rx="5" fill="url(#proGloveGold)" stroke="${INK}" stroke-width="2.4"/>
  <rect x="6" y="13.5" width="3" height="27" rx="1.5" fill="#fff6c9" opacity="0.75"/>
</svg>`;

/** FFX-2's pro ring: a dark backing disc, an ink under-stroke, a light ring, a dashed inner ring and six leaf petals; it turns slowly (CSS). */
export const PRO_FLOWER_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true" class="pro-ring">
  <circle cx="50" cy="50" r="47" fill="rgba(8,4,22,0.46)"/>
  <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(8,4,22,0.9)" stroke-width="4.6"/>
  <circle cx="50" cy="50" r="38" fill="none" stroke="#fbeef7" stroke-width="2"/>
  <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(251,238,247,0.8)" stroke-width="1.1" stroke-dasharray="2 3.4"/>
  ${[0, 60, 120, 180, 240, 300]
    .map(
      (a) =>
        `<path d="M50 6C60 14 60 28 50 38C40 28 40 14 50 6Z" transform="rotate(${a} 50 50)" fill="rgba(244,154,200,0.4)" stroke="rgba(8,4,22,0.85)" stroke-width="3.4" stroke-linejoin="round"/>` +
        `<path d="M50 6C60 14 60 28 50 38C40 28 40 14 50 6Z" transform="rotate(${a} 50 50)" fill="none" stroke="#fbeef7" stroke-width="1.5" stroke-linejoin="round"/>`,
    )
    .join('')}
  <circle cx="50" cy="50" r="2" fill="#fbeef7" stroke="rgba(8,4,22,0.85)" stroke-width="1"/>
</svg>`;
