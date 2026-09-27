"""The words on the A+ sheet parts (kept apart from sheet.py so each file stays short)."""

CHANGES = [
    'Window colour: A’s light 162° purple-blue gradient became FF7’s four-corner, blue-only gradient per window (#0000B0 / #000080 / #000050 / #000020, bilinear). [3 sources, PS1]',
    'Frame: A’s white border, 10 px radius, glow, drop shadow and grain became a 3 u grey bevel (light middle, dark inner edge), 2 u radius, nothing outside it. [measured]',
    'Band: two windows at 71.0 % to 95.1 % of the height with FF7’s 3 u gap between them (left ends at 135 u, right starts at 138 u) and the black strip below. No enemy window in the band.',
    'Left window is NAME + BARRIER, with a two-bar Barrier / MBarrier box per row (empty in this fight).',
    'HP reads "279/ 316" in two right-aligned fields of one size; MP shows the current value only; each has its 1 u line (blue-to-lavender, teal-to-cream, lost part dark red).',
    'LIMIT and TIME side by side in their own columns, raised grey boxes at FF7’s 4:1, cylinder shading: LIMIT pink, TIME mint while filling and pale yellow when full.',
    'Headers once, in small heavy grey caps with a dark edge on the frame line, drawn in the same family as the body (no second, pixel face).',
    'Command window: FF7’s 59 x 54 u box, four fixed slots at 12 u pitch (Attack, Magic, blank where Summon would be, Item), over the Barrier column and 4 u lower than the band.',
    'Cursor: a white gloved finger (our own drawing, rounded wrist, soft grey shading, thin dark-grey edge), not a triangle; the same hand points at the target.',
    'Top window: translucent, 89 % wide, centred white text, no speaker name, the game’s own line with its opening quote and spelling. Empty while targeting.',
    'Type: PR7 Line, our own monoline glyph set drawn on FF7’s grid (cap 8 u = 3.6 % of the frame, digits 0.875 cap wide on equal cells), off-white with a 1 u shadow; no gold names.',
    'States: the yellow ready triangle (solid, shaded, part-way through its spin), yellow HP at or below 1/4, the full Limit gauge’s blink colours, "Limit" in slot 1 with each letter on its own colour order, the magenta-to-red Limit window.',
    'Damage digits: our own chunky numeral set on equal cells, white with an even 1 u near-black edge.',
    'Stretch rule: column starts stretch with the 16:9 frame; everything inside a column (the HP field, lines, gauges, the command window) keeps FF7’s own proportions.',
]

REPAIRS = [
    'Frames and sheets rendered; the §7 pixel checks run on them (sheet 10).',
    'Type: our own glyph set replaces M PLUS Rounded 1c on every frame; four OFL faces are compared on sheet 8 by measured ratios.',
    'Phone: the stacked layout is kept as a declared adaptation; option B keeps each name on its status row (sheet 7).',
    '"Limit" letters use the 8 x 5 colour table read off the reference animation, not a marching rainbow.',
    'Ready triangle: no outline, two shaded faces, caught mid-spin. Glove: no cuff or seam, rounded wrist, thin grey edge.',
    'Frame 3: the top window is empty; the monster name shows only in variant 3b (SELECT help, our estimate).',
    'Magic: the MP window sits right of the list over the empty third row, clear of Cloud’s gauges; the frame carries an estimate label.',
    'Headers use the body family (heavier), no Silkscreen. HP max anchored 32 u after the current field at FF7’s scale.',
    'Damage digits are our own equal-cell set. The band gap is 3 u. Phone: safe-area inset shown; the command window grows up from FF7’s anchor (a touch adaptation).',
]

# (value, where it shows) -- every value a frame shows that no source gives
ESTIMATES = [
    ('Low-HP yellow #F8F070 (the rule "at or below 1/4" is sourced, the hue is not)', 'frames 4, 5, 5b: Barret’s HP'),
    ('Limit window: the top-right and bottom-left corners (#A84480, a midpoint)', 'frame 5b'),
    ('Top window 50 % blend (the PlayStation half-transparency mode)', 'frames 1, 3b, 4'),
    ('Full Limit gauge: shade and highlight of mint and peach (base colours measured); blink rate 4 Hz', 'frames 4, 5, 5b (rate: motion only)'),
    ('"Limit" letter hex values (rough sampling of the animation) and the 100 ms step', 'frames 5, 5b, detail sheet'),
    ('Magic list: packed order, no blank for Fire, the command window closing, the MP window form and place', 'frame 2'),
    ('Monster name in the top window as the SELECT help', 'frame 3b'),
    ('Top window empty during targeting (not drawn)', 'frame 3'),
    ('Ready triangle spin: its angle in a still, its rate', 'frames 1, 2, 3, 5'),
    ('Header cap 4.5 u and stroke weight of our own header caps', 'every frame'),
    ('Recovery green #80F080; damage motion; message duration', 'not shown'),
    ('Phone: stacked windows (A) or names repeated on status rows (B); command window growing upward; 44 px slots', 'phone frames'),
]

INGAME = [
    'Greyed party names (Yuffie in Bolt and Barrier_Status, Cid in Tail_Laser, Red XIII in Cloud_Attack): when a name turns grey, and whether it goes with the orange full TIME bar. Show it in frame 4 or 5 once confirmed.',
    'What the orange full TIME bar means.',
    'Whether the target’s name shows during targeting without SELECT.',
    'The battle Magic list: grid order (Config “Magic order”), blank cells for spells not owned, the MP readout, whether the command window stays open.',
    'Damage-number motion; the full Limit gauge’s blink rate; the "Limit" letter step rate; the ready triangle’s spin rate.',
    'Message duration; the top window’s blend; the exact low-HP yellow.',
    'Note: the Steam copy is the PC build, whose default window colours differ (spec §1); layout and states still read true.',
]

STILL = [
    'The font. FF7’s own face is retail and fan traces are out (rule 8). PR7 Line is our own drawing on FF7’s grid with its measured proportions; it is still not FF7’s letter shapes, and it has no hinting or pixel steps.',
    'Header caps: FF7’s headers are a heavy pixel face; ours are the body family drawn heavier, so the two read as one family (as in FF7) but not as pixels.',
    'The finger cursor, the ready triangle and the damage numerals are our own drawings in FF7’s spirit, not its sprites (rule 8).',
    'Pixel scale. FF7 draws at 320 x 224; we draw smooth shapes at full resolution.',
    'The stretch. On 16:9 the column starts stretch sideways while their contents keep FF7’s proportions, so the band reads a little looser than FF7’s; the pillarbox (sheet 9) is exact.',
    'The phone has no FF7 original; both phone layouts are adaptations.',
    'Placeholders: the scene, the figures and the current HP values. The art candidates in docs/concepts/ff7-art-2026-09-27 are not picked, so they are not used.',
]
