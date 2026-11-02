/**
 * THE HOLDS THAT `?skygrade=today` PUTS BACK (r72, branch `r72-sky`; FFX-2 only: Chapter XI, `ffx2-fallen-aeons`; Bailey 2026-10-31 ~23:40 EDT: "im going to sleep please keep going. i'll go with all of your recommendations. you make the executive decisions for the next few
 * days"; the driver's call under it, Bailey's to overturn). Release 71 shipped Chapter XI with `hd2d` and `arena` HELD (`PieceHolds.ts`), so the Road to the Farplane's sky drew as release 69 draws it. From r72 Chapter XI PLAYS both pieces, with grade C by default (`look/pro/SkyGrade.ts`
 * `SKY_DEFAULTS`: the dimmer bold row, Bailey's pick from stills by his blanket yes: "dimmer lights: a dark night where the burst still shines"), so the two rows left `PIECE_HOLDS`. This table is where they went: `DemoGate.treatedHold` answers them ONLY while the address says
 * `?skygrade=today` (the word that restores release 71's Chapter XI exactly: the look rig and the pro arena down, the plate as release 69 draws it), and `DemoGate.treatedHolds` lists them for the debug read. Chapter V is not here: it keeps its two holds in `PIECE_HOLDS` (grade C
 * leaves 21 percent of its sky band over 240, `docs/handoff/r72-sky.md`).
 *
 * Pure data: no DOM, no `three`, no randomness (AGENTS.md hard rule 1); a type-only import, so no runtime cycle with the gate that reads it.
 */

import type { TreatedPiece } from './DemoGate.ts';

export const SKY_TODAY_HOLDS: Readonly<Record<string, Readonly<Partial<Record<TreatedPiece, string>>>>> = Object.freeze({
  'ffx2-fallen-aeons': Object.freeze({
    hd2d:
      'FFX-2, Chapter XI: held only while the address says `?skygrade=today`, which puts release 71\'s draw of the Road back (by default the chapter plays the HD-2D bold look with grade C, the dimmer bold row of `look/pro/SkyGrade.ts`, picked by Bailey from stills). ' +
      'What release 71 held and why: the HD-2D bold look (the room\'s `LookConfig.CHAPTER_LOOKS` row) at the room\'s own grade clipped the Road to the Farplane\'s sky, the same plate as Chapter V\'s, to a flat white halo around the spire\'s burst whenever the burst is in frame. ' +
      'The r70 browser read (`docs/handoff/booth-b3.md` section 12, D-XI1) found the first menu at the idle rig clean (2560 x 1440: mean luma 85.0 against release 69\'s 88.9, 0.8 percent of pixels over 240 against 3.1) and the Anima link\'s first twelve cast frames not: 19.1 percent over 235 against 1.5 in the release 68 control. ' +
      'Held, no look rig is built and the plate is release 69\'s. The stills of grade C read 0.58 percent over 240 on the whole frame at the first menu of link 1 (release 71\'s frame 1.32) and 0.48 percent with the burst in frame at the Anima link (release 71\'s frame with the camera row dropped 1.52; the r70 build 12.86). ' +
      'Lifts when the address drops `?skygrade=today` (grade C plays again, or `?skygrade=a`, `b` or `c` picks an option).',
    arena:
      'FFX-2, Chapter XI: held only while the address says `?skygrade=today`, which puts release 71\'s draw of the Road back (by default the chapter plays the pro arena grade with grade C patched on its table). What release 71 held and why: the pro arena grade ' +
      '(the `road-to-the-farplane` row of `look/pro/ProGrade.ts`: exposure 1.5, the cone from the burst above the frame\'s top edge, the stage light at 1.7 and the beams at 2.0) is the Chapter V grade over the same sky, and the r70 read took the halo with it. ' +
      'It is built on top of a chapter look, so while `hd2d` is held it cannot play; it has its own row so that a lift of the look alone never switches the unpatched grade on. Under grade C the room\'s exposure is capped at 1.2, the beams come down to 0.8, the stage light to 1.2, the bloom to 0.45 at a threshold of 0.8, the figure key to 1.3 and the cone to 0.7 of itself. ' +
      'Lifts when the address drops `?skygrade=today` (grade C plays again, or `?skygrade=a`, `b` or `c` picks an option).',
  }),
});
