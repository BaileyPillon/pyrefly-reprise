"""Build ../sheet.html: one self-contained page (JPEG data URIs, no external file) from ../frames/*.jpg.
Run after render.mjs:  python docs/concepts/chapters/sin-2026-09-27/hud/src/build_sheet.py
Sheet images: desk frames at 960 px wide, phone frames at 390 px wide (1x), so the page stays under 5 MB."""
import base64, io, os, html
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(HERE, '..', 'frames')
OUT = os.path.join(HERE, '..', 'sheet.html')


def uri(fid, phone):
    im = Image.open(os.path.join(FR, f"{fid}-{'390' if phone else '1600'}.jpg")).convert('RGB')
    w = 390 if phone else 960
    im = im.resize((w, round(im.size[1] * w / im.size[0])), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=74 if not phone else 78, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()


def h(s):
    return s  # copy below is trusted markup written here


SURFACES = [
    dict(
        code='M1', title='Link 4: the clock (Overdrive Sin)',
        ask='How does the player see how many of Sin\'s turns are left before Giga-Graviton?',
        rec='A',
        why=[
            '<b>The whole race at a glance.</b> The ring is the whole fight (3 pulls, the melee window, the last turn). In B, turn 8 shows no 13th row yet; the number only appears when the end is already two rows away.',
            '<b>Reads on a phone without small print.</b> The centre numeral is the biggest glyph in the frame. C\'s 13 pips shrink to 20 px each on the phone.',
            '<b>One widget, four flags, nothing shipped is edited.</b> It reads <code>sin.turn</code>, <code>sin.turnsLeft</code>, <code>sin.gigaGravitonTurn</code> and <code>sin.mouthStage</code>. B rewrites tags on the shipped turn list; C would sit on the painted jaw that already shows the stage.',
            '<b>Honest about S-1.</b> The ring is as long as <code>sin.gigaGravitonTurn</code>, so a Steam-check answer of 12 redraws it (3 + 8 + 1) with no art change, and the estimate line goes when S-1 settles.',
        ],
        cost='Costs a strip of city on the phone (the slab sits mid-field). B is the cheapest; C carries the same inputs and is the fallback if Bailey wants a thinner clock.',
        opts=[
            ('A', 'The mouth ring', 'A 13-segment ring, grouped 3 + 9 + 1, on the left of the sky. Segments fill as Sin acts; the centre says turns left; the stage word sits beside it.', ['m1a-t8', 'm1a-t12']),
            ('B', 'Tagged turn order', 'No new widget. Each of Sin\'s tiles in the turn list carries its clock number; the 13th reads GIGA-GRAVITON in the alarm colour.', ['m1b-t8', 'm1b-t12']),
            ('C', 'The painted jaw with a pip strip', 'A boss slab with Sin\'s name, the stage word and a strip of 13 pips (3 + 9 + 1) under it.', ['m1c-t8', 'm1c-t12']),
        ],
        note='Each option is shown at Sin\'s turn 8 (mouth open 2 of 3) and turn 12 (fully open, one turn left). The Gaze counter (six diamonds) is drawn the same in all three and is not part of this vote. The turn each mouth stage covers is our estimate; the sources give the stages, not the turns.',
    ),
    dict(
        code='M2', title='"What Negation took" (Chapter XVII)',
        ask='After the Fin\'s Negation counter fires, how does the player learn what they lost, what the Fin lost, and what it cured?',
        rec='A',
        why=[
            '<b>It names the statuses in words.</b> The dots on a party row are 5 to 7 px and colour only.',
            '<b>It says all three things in one place:</b> what the party lost, what the Fin lost (Negation strips both sides), and what it cured. Research section 11 item 4 asks the HUD to show that mercy (Poison, Petrify, Slow, Darkness).',
            '<b>It holds on a phone.</b> It uses the banner slot under the rail. B needs three columns of chips above the party cards, and a member who loses three statuses (Yuna here) already crowds the field.',
            '<b>One input:</b> <code>sin.negation.lastTaken</code>.',
        ],
        cost='B (chips that fade in place) is the richer showpiece and stays a follow-up once the banner exists.',
        opts=[
            ('A', 'A banner', 'One banner with a short line per group: PARTY LOST, FIN LOST, CURED. Sits top-left on the desk and under the rail on the phone.', ['m2a']),
            ('B', 'Ghost chips', 'Each row grows struck-through chips for what it lost, fading out in place; the Fin\'s lost Armor Break fades beside its core.', ['m2b']),
        ],
        note='The status lists are illustrative. The removal list itself is research section 3.1 (24 statuses; it spares Death, Doom, Curse, Auto-Life and Eject).',
    ),
    dict(
        code='M3', title='The link strip in Chapter XVII',
        ask='Does the player see which of the three links they are on?',
        rec='A',
        why=[
            '<b>The retry rule needs a place to be said.</b> The game has no save between the links, so a loss at link III starts again at the Left Fin (the plan\'s default). The strip is where "III of III, and everything carries" lives.',
            '<b>It is a long chapter</b> (about 140 to 190 turns before measuring), and the player deserves to know where they stand.',
            '<b>No engine contract.</b> The strip reads the foes on the board: left-fin is I, right-fin is II, Genais or the Core is III. Nothing new is published.',
            '<b>Cheap to drop.</b> B is a free fallback (the reveal plate already names the link), so if the strip crowds the phone, the switch is one flag.',
        ],
        cost='Spends about 46 px under the phone rail and one line of the desk\'s sky.',
        opts=[
            ('A', 'Three pips with the carry bracket', 'I, II and III as skewed tags (done, current, next) with a gold bracket and one line: what carries.', ['m3a']),
            ('B', 'Nothing new', 'The existing reveal plate names each link when it opens (EnemyGroupDef.headline: "Right Fin").', ['m3b']),
        ],
        note='Shown at the opening of link II. The carried statuses on the party rows (small blue chips) are what the strip\'s caption promises.',
    ),
    dict(
        code='M4', title='The Fins\' charge and range readout (links I to III)',
        ask='How does the player know, while choosing a command, whether the Fin is close or far and whether its core is charged?',
        rec='B',
        why=[
            '<b>The decision is time-critical.</b> "Pull back before the Fin acts" is the whole Gravija answer. In A the cue is a 5-px turn-list dot (9 px on the phone, under the 14 px floor) and a banner that leaves after about a second and a half.',
            '<b>It says the range in words</b> (NEAR gold, FAR sky) where the player is already looking, and it goes quiet when there is nothing to warn about.',
            '<b>It adds no hidden information.</b> It reads only <code>airship.range</code> and <code>sin.fin.charged</code>. C shows two counters the game keeps secret, which changes what the player knows about the fight and needs Bailey\'s own yes.',
            '<b>It answers the Sensor text</b> ("it charges Gravija; the Pull Back command avoids it") for a player who has not opened the panel.',
        ],
        cost='One plate per Fin fight. A is free and is what ships if Bailey says no to a new plate.',
        opts=[
            ('A', 'The shipped surfaces only', 'The red charge dot on the Fin\'s turn-list tile and the screen-edge glow. (The banner has already left.)', ['m4a']),
            ('B', 'A Fin plate: range and charge', 'A name plate with the range chip; while the core is charged, a red bar: "Core charged, Gravija on its next turn". Also shown at FAR.', ['m4b', 'm4b-far']),
            ('C', 'A Fin plate that also shows its counters', 'B plus two meters: "targeted" (seven pips) and "regular acts" (three pips, then it charges).', ['m4c']),
        ],
        note='The Fin is a grey stand-in silhouette, not art. The counters in C are research sections 5.1.1 and 5.1.2 (the Fin attacks at FAR after 7 hits; three regular NEAR actions, then the charge).',
    ),
    dict(
        code='M5', title='The Trigger order widget without volley pips',
        ask='Cid fires no missiles in the Fin fights (S-19). What does the order widget\'s cost slab say instead of the Evrae volley pips?',
        rec='B',
        why=[
            '<b>A missing flag reads as three full pips.</b> The widget defaults <code>airship.missilesLeft</code> to the full rack, so an unpatched build tells the player an order costs "1 volley" in a fight with no volleys. The first frame is that fault.',
            '<b>The pips must go either way.</b> A is the minimum: the cost line only. B is A plus one line that answers the only question that matters in these fights: does Cid move before the Fin?',
            '<b>B collapses to A.</b> The race line shows only while the core is charged, so on every other turn the slab is exactly A.',
            '<b>The forecast already exists.</b> The move advisor computes the same Cid-versus-Fin order (<code>tactics/airship-orders.ts</code>), so the widget gets one more argument, not a new system.',
        ],
        cost='Touches a widget Bailey has not approved (it was built to the driver\'s recommendation for the Evrae round), so the Evrae look is unchanged and Evrae\'s pips stay.',
        opts=[
            ('Before', 'What an unpatched widget would show in a Fin fight', 'Three volley pips and "1 volley": wrong here, because Cid has no missiles.', ['m5-before']),
            ('A', 'The pips and the volley go', 'The cost line alone: "Turn now, Cid\'s next turn".', ['m5a']),
            ('B', 'The pips go, and a race line says who moves first', 'A plus a green line when Cid moves before the Fin ("its Gravija whiffs"). When Cid would move after the Fin the line turns red: "Cid moves after the Fin: too late".', ['m5b']),
        ],
        note='On the phone the ORDER marker docks on Cid\'s turn-list tile as a gold ring with a tag, because the rail hides names.',
    ),
]

CSS = """
:root { --ink:#0b0a12; --paper:#f4f1e8; --gold:#e3b94a; --gold-deep:#a67c16; --blood:#b02a2a; --sky:#7fc6e8; --panel:#151422; --line:rgba(244,241,232,.16); }
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--ink); color: var(--paper); font: 16px/1.5 'Segoe UI', system-ui, sans-serif; }
main { max-width: 1120px; margin: 0 auto; padding: 24px 16px 80px; }
h1 { font: italic 700 44px/1.05 Georgia, 'Times New Roman', serif; margin: 8px 0 4px; }
h2 { font: 700 15px/1.2 'Segoe UI', sans-serif; letter-spacing: .22em; text-transform: uppercase; color: var(--gold); margin: 0; }
h3 { font: italic 700 28px/1.15 Georgia, serif; margin: 6px 0 0; }
p { margin: 8px 0; }
code { background: rgba(244,241,232,.1); padding: 1px 6px; border-radius: 3px; font: 14px Consolas, monospace; }
.lede { color: rgba(244,241,232,.82); max-width: 820px; }
.pill { display: inline-block; padding: 3px 10px; font: 700 13px/1.3 'Segoe UI', sans-serif; letter-spacing: .12em; text-transform: uppercase; background: var(--gold); color: var(--ink); }
.pill.warn { background: transparent; color: #ff8a7a; border: 1px solid #ff8a7a; }
section.surf { margin-top: 44px; padding-top: 22px; border-top: 3px solid var(--gold); }
.rec { margin: 14px 0; padding: 14px 18px 12px; background: var(--panel); border-left: 5px solid var(--gold); }
.rec ul { margin: 6px 0 0; padding-left: 20px; }
.rec li { margin: 6px 0; }
.opt { margin-top: 26px; }
.opt.is-rec .ohead h4::after { content: 'RECOMMENDED'; margin-left: 12px; padding: 2px 9px; background: var(--gold); color: var(--ink); font: 700 12px/1.4 'Segoe UI', sans-serif; letter-spacing: .14em; vertical-align: middle; }
.ohead h4 { margin: 0; font: 700 20px/1.2 'Segoe UI', sans-serif; }
.ohead h4 b { color: var(--gold); margin-right: 8px; letter-spacing: .1em; }
.ohead p { color: rgba(244,241,232,.8); margin-top: 4px; max-width: 900px; }
.shots { display: grid; gap: 12px; margin-top: 10px; }
.desk-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 520px), 1fr)); gap: 12px; }
.phone-row { display: flex; gap: 12px; flex-wrap: wrap; }
figure { margin: 0; }
figure img { display: block; width: 100%; height: auto; border: 1px solid var(--line); }
.phone-row figure { width: 195px; }
figcaption { font-size: 13px; color: rgba(244,241,232,.6); margin-top: 3px; letter-spacing: .04em; }
.note { color: rgba(244,241,232,.7); font-size: 14px; margin-top: 12px; max-width: 900px; }
table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 15px; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--gold); font: 700 13px 'Segoe UI'; letter-spacing: .14em; text-transform: uppercase; }
.legend { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin: 10px 0; }
.chip { display: inline-block; padding: 3px 12px; font: 700 15px 'Segoe UI'; letter-spacing: .18em; }
.chip.near { background: var(--gold); color: var(--ink); } .chip.far { background: var(--sky); color: var(--ink); } .chip.alarm { background: #e8412e; color: #fff; }
@media (max-width: 640px) { h1 { font-size: 32px; } .phone-row figure { width: calc(50% - 6px); } }
"""


def option_html(sid, rec, o):
    letter, title, desc, fids = o
    desk = ''.join(f'<figure><img alt="{html.escape(title)} at 1600 x 900" src="{uri(f, False)}"><figcaption>{f} · 1600 × 900</figcaption></figure>' for f in fids)
    ph = ''.join(f'<figure><img alt="{html.escape(title)} at 390 x 844" src="{uri(f, True)}"><figcaption>{f} · 390 × 844</figcaption></figure>' for f in fids)
    cls = 'opt is-rec' if letter == rec else 'opt'
    return (f'<div class="{cls}"><div class="ohead"><h4><b>{letter}</b>{html.escape(title)}</h4><p>{desc}</p></div>'
            f'<div class="shots"><div class="desk-row">{desk}</div><div class="phone-row">{ph}</div></div></div>')


def surface_html(s):
    why = ''.join(f'<li>{w}</li>' for w in s['why'])
    opts = ''.join(option_html(s['code'], s['rec'], o) for o in s['opts'])
    extra = ''
    if s['code'] == 'M4':
        extra = ('<div class="legend"><span class="chip near">NEAR</span> in reach: physical hits land, Gravija can charge'
                 ' <span class="chip far">FAR</span> at range: only Wakka and magic reach, the core never charges'
                 ' <span class="chip alarm">CORE CHARGED</span> Gravija comes on the Fin\'s next turn</div>')
    return (f'<section class="surf" id="{s["code"].lower()}"><h2>{s["code"]}</h2><h3>{s["title"]}</h3><p class="lede"><b>The question:</b> {s["ask"]}</p>'
            f'<div class="rec"><span class="pill">Recommended: {s["rec"]}</span> <span style="color:rgba(244,241,232,.7)">the driver\'s pick (Bailey delegated it, D-279); package H builds this one</span><ul>{why}</ul>'
            f'<p class="note" style="margin-bottom:0"><b>What it costs:</b> {s["cost"]}</p></div>{extra}{opts}<p class="note">{s["note"]}</p></section>')


def main():
    summary_rows = ''.join(
        f'<tr><td><b>{s["code"]}</b></td><td>{s["title"]}</td><td><b>{s["rec"]}</b> · {next(o[1] for o in s["opts"] if o[0] == s["rec"])}</td></tr>' for s in SURFACES)
    body = f'''<main>
<h2>Sin: HUD mockups · FFX only · package M</h2>
<h1>Five surfaces, one pick each</h1>
<p class="lede">Option frames for the Sin chapters' new HUD surfaces, on our own plates (the Evrae deck and the round-3 head), in the game's shipped Ink &amp; Gold HUD:
the turn list, party cards, command cascade and the Trigger order widget are the game's own CSS, not a redraw. <b>Nothing here is built or wired.</b>
Every option is shown at 1600 × 900 and at 390 × 844. New pieces use the 14 px type floor.</p>
<p><span class="pill warn">Mockup · nothing built</span> <span class="pill warn">Fins are grey stand-in silhouettes, not art</span></p>
<h2 style="margin-top:22px">The driver's picks</h2>
<table><tr><th>Surface</th><th>What</th><th>Recommended</th></tr>{summary_rows}</table>
<p class="note"><b>Game case (rule 14): FFX only.</b> CTB, the Trigger Command order, the airship range and Cid are FFX; FFX-2 has none of them (research/ffx-sin.md section 0.3). No frame here carries the FFX-2 accent, mirroring or an ATB bar. <b>Estimates on screen:</b> Giga-Graviton on Sin's 13th turn is our estimate (S-1: the sources say 12 or 13); the turn each mouth stage covers is our estimate; party HP and status lists are illustrative.</p>
{''.join(surface_html(s) for s in SURFACES)}
</main>'''
    doc = f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin HUD mockups</title><style>{CSS}</style></head><body>{body}</body></html>'
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(doc)
    print('sheet.html', round(os.path.getsize(OUT) / 1024), 'KB')


main()
