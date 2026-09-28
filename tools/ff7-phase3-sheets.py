"""Target-vs-build sheets for the FF7 phase-3 build (FF7 only).

Each sheet puts an approved concept frame (the target Bailey picked from, docs/concepts/...) beside the
build's own frame of the same moment (docs/screenshots/ff7-phase3/, taken by the e2e on a production
build and by the held-frame captures). Output: docs/screenshots/ff7-phase3/sheet-*.jpg, 1600 px wide,
each under 1 MB and at most 2000 px tall. Usage: python tools/ff7-phase3-sheets.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'docs', 'screenshots', 'ff7-phase3')
C = os.path.join(ROOT, 'docs', 'concepts')
W = 1600
BG = (17, 18, 22)
INK = (238, 236, 228)
DIM = (170, 170, 176)
GOLD = (232, 196, 110)


def font(size, bold=False):
    for f in (['seguisb.ttf', 'segoeuib.ttf'] if bold else ['segoeui.ttf']) + ['arial.ttf']:
        p = os.path.join('C:/Windows/Fonts', f)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def img(path, crop=None):
    im = Image.open(path).convert('RGB')
    if crop:
        w, h = im.size
        im = im.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
    return im


def fit(im, w, hmax=None):
    h = round(im.height * w / im.width)
    if hmax and h > hmax:
        w2 = round(im.width * hmax / im.height)
        return im.resize((w2, hmax), Image.LANCZOS)
    return im.resize((w, h), Image.LANCZOS)


def sheet(name, title, sub, rows, labels=('TARGET (the picked concept)', 'BUILD (branch ff7-phase3)')):
    """rows: list of (target image or None, [build images], caption); `labels` names the two columns."""
    pad = 20
    col = (W - 3 * pad) // 2
    blocks = []
    for tgt, builds, cap in rows:
        left = fit(tgt, col, 900) if tgt is not None else None
        rights = [fit(b, col if len(builds) == 1 else (col - pad * (len(builds) - 1)) // len(builds), 900) for b in builds]
        h = max([left.height if left else 0] + [r.height for r in rights]) + 44
        blocks.append((left, rights, cap, h))
    head = 110
    total = head + sum(b[3] + pad for b in blocks) + pad
    out = Image.new('RGB', (W, total), BG)
    d = ImageDraw.Draw(out)
    d.text((pad, 18), title, fill=INK, font=font(34, True))
    d.text((pad, 64), sub, fill=DIM, font=font(18))
    y = head
    for left, rights, cap, h in blocks:
        d.text((pad, y), labels[0], fill=GOLD, font=font(16, True))
        d.text((2 * pad + col, y), labels[1], fill=GOLD, font=font(16, True))
        if left is not None:
            out.paste(left, (pad, y + 24))
        else:
            d.text((pad, y + 40), '(no concept frame for this moment)', fill=DIM, font=font(18))
        x = 2 * pad + col
        for r in rights:
            out.paste(r, (x, y + 24))
            x += r.width + pad
        d.text((pad, y + h - 18), cap, fill=DIM, font=font(15))
        y += h + pad
    if out.height > 2000:
        out = out.resize((round(W * 2000 / out.height), 2000), Image.LANCZOS)
    path = os.path.join(SHOTS, name)
    q = 88
    while True:
        out.save(path, quality=q, optimize=True)
        if os.path.getsize(path) < 1_000_000 or q < 50:
            break
        q -= 6
    print(name, out.size, os.path.getsize(path))


def s(name):
    return img(os.path.join(SHOTS, name))


def main():
    hifi = os.path.join(C, 'ff7-art-2026-09-27', 'hifi')
    eye = os.path.join(C, 'ff7-eyecandy-quick-2026-09-27')
    fx = os.path.join(C, 'ff7-effects-hifi-2026-09-27')
    opt = os.path.join(C, 'ff7-options-2026-09-27')
    sheet('sheet-1-film-art-and-sides.jpg', 'Art direction 3 "Film", sides switched (D-259, D-262)',
          'FF7 only. The party on the LEFT facing right, Guard Scorpion on the RIGHT facing left; nothing mirrored. 1600x900, 1024x768, 2000x1012.',
          [(img(os.path.join(hifi, '03-frame-film-1600.jpg')), [s('game-1600x900-first-turn.jpg')], 'The first command window: the Film paintings on the Film reactor core, the camera solved to the target frame.'),
           (None, [s('game-1024x768-first-turn.jpg'), s('game-2000x1012-first-turn.jpg')], '4:3 keeps the width (the fov opens), the ultrawide keeps the height; the painting covers the frame at every aspect.')])
    sheet('sheet-2-hud-look.jpg', 'The punchier menu look on the D-237 layout (D-261)',
          'FF7 only. Heavier letters, a glass sheen, outer glows, the lit active row, a glowing finger and marker; no box moved. Crops at DPR 1.5 and 2.',
          [(img(os.path.join(eye, '1-mako-storm-idle-1600.jpg')), [s('game-1600x900-first-turn.jpg')], 'Target: the eye-candy mock (placeholder figures). Build: the real HUD over the real fight.'),
           (img(os.path.join(eye, '1-mako-storm-idle-1600.jpg'), (0.18, 0.7, 0.7, 0.98)), [img(os.path.join(SHOTS, 'hud-crop-dpr2.png'))], 'The command and HP windows at device pixel ratio 2 (1.5 is hud-crop-dpr1.5.png): text and bevels stay vector-sharp.')])
    sheet('sheet-3-fx-tail-laser.jpg', 'Effects: Spectacle on A3 plus, Tail Laser (D-260)',
          'FF7 only. One beam swept across both party members off the floor, key frame on the nearer; the scorch, sparks, flare, stage dim. Held frame and live frame.',
          [(img(os.path.join(eye, '2-tail-laser-1600.jpg')), [s('held-1600x900-full-laser.jpg')], 'Held at the landing (the capture holds the effect clock; the live fight adds the cast light, the shake and one flash frame).'),
           (img(os.path.join(fx, 'sheet-4-option-2-spectacle-laser-bolt.jpg'), (0.02, 0.1, 0.98, 0.45)), [s('game-1600x900-fx-ff7-laser.jpg')], 'Live, in the e2e fight (production build): Tail Laser answering the deliberate hit into the raised tail.')])
    sheet('sheet-4-fx-bolt-braver-scope.jpg', 'Effects: Bolt, Braver, Search Scope (D-260)',
          'FF7 only. Bolt\'s jagged strikes and crawling arcs; Braver\'s leap and descending crescent; the lock-on sight (calm by design: no flash, no shake).',
          [(img(os.path.join(fx, 'sheet-4-option-2-spectacle-laser-bolt.jpg'), (0.02, 0.45, 0.98, 0.8)), [s('held-1600x900-full-bolt.jpg')], 'Bolt, held at its strike.'),
           (img(os.path.join(fx, 'sheet-5-option-2-spectacle-braver-scope.jpg'), (0.02, 0.12, 0.98, 0.47)), [s('held-1600x900-full-braver.jpg')], 'Braver, held at the hit.'),
           (img(os.path.join(fx, 'sheet-5-option-2-spectacle-braver-scope.jpg'), (0.02, 0.47, 0.98, 0.81)), [s('game-1600x900-fx-ff7-scope.jpg')], 'Search Scope, live: "Locked On Target".')])
    sheet('sheet-5-fx-more-and-calm.jpg', 'Effects: Big Shot, Ice, Cure, Rifle; the calm version (reduced motion)',
          'FF7 only. The calm version keeps A3 plus and thins the particles to 40 %, with no haze, streaks, washes, shake or flash frame.',
          [(None, [s('held-1600x900-full-bigshot.jpg'), s('held-1600x900-full-ice.jpg')], 'Big Shot (the fireball charged at the gun, then released) and Ice (crystals growing, then the shatter).'),
           (None, [s('held-1600x900-full-cure.jpg'), s('held-1600x900-full-rifle.jpg')], 'Cure on Cloud, and Rifle: the twin rifles\' muzzle flashes and tracers.'),
           (img(os.path.join(fx, 'sheet-6-option-2-flash-frames-and-reduced-motion.jpg'), (0.0, 0.43, 1.0, 0.98)), [s('held-1600x900-calm-laser.jpg'), s('held-1600x900-calm-braver.jpg')], 'Target: the calm frames of the options round. Build: Tail Laser and Braver under reduced motion.')])
    sheet('sheet-6-attack-b1.jpg', 'B1: painted attack keys, the hit flash and the knock-back (D-244)',
          'FF7 only. Cloud runs in with the wind-up, strikes, holds the follow-through, runs back; Barret aims and fires from his spot (the muzzle flash drawn by code).',
          [(img(os.path.join(opt, 'sheet-5-B-attack-motion.jpg'), (0.0, 0.23, 1.0, 0.47)), [s('game-1600x900-melee-strike.jpg'), s('game-1600x900-fx-ff7-slash.jpg')], 'Cloud at the strike point (the strike painting), and the slash landing with the boss\'s recoil painting.'),
           (None, [s('game-1600x900-fx-ff7-shot.jpg'), s('game-1600x900-fx-ff7-bolt.jpg')], 'Barret\'s shot, and Cloud casting Bolt with the sword raised.')])
    sheet('sheet-7-victory-d1.jpg', 'D1: the win poses, then a hold in silence (D-244)',
          'FF7 only. Cloud pumps his fist twice, spins his sword, puts it on his back; Barret squats, stands and punches the air, looping. Music stays null.',
          [(img(os.path.join(opt, 'sheet-8-D-victory.jpg'), (0.0, 0.08, 1.0, 0.57)), [s('game-1600x900-win-poses.jpg'), s('game-1600x900-win-hold.jpg')], 'The fist pump (Barret squatting), then the sword on his back in the hold.'),
           (None, [s('game-1600x900-win-spin.jpg'), s('game-390x844-win-hold.jpg')], 'The one-hand spin as the camera eases in on the party (repair item 7, our estimate), and the phone’s hold, framed close.')])
    sheet('sheet-8-results-c1.jpg', 'C1: two results windows (D-244)',
          'FF7 only. Step 1: EXP and AP, a window per member (portrait, LV, the award counting in; no AP line, as FF7; 0 EXP to a member KO’d at the end). Step 2: Gil, the Items with the Assault Gun, the message.',
          [(img(os.path.join(opt, 'sheet-6-C-results-two-windows.jpg'), (0.0, 0.08, 1.0, 0.45)), [s('game-1600x900-results-1.jpg')], 'Step 1 (100 EXP, 10 AP from the engine).'),
           (img(os.path.join(opt, 'sheet-6-C-results-two-windows.jpg'), (0.0, 0.47, 1.0, 0.84)), [s('game-1600x900-results-2.jpg')], 'Step 2 (100 gil, the Assault Gun).'),
           (None, [s('game-390x844-results-1.jpg'), s('game-390x844-results-2.jpg')], 'The same on a phone, advanced by taps.')])
    sheet('sheet-9-gameover-g1.jpg', 'G1: pan up, then GAME OVER (D-244)',
          'FF7 only. The camera pans up over the fallen party; black, GAME OVER, RETRY / CHAPTER SELECT. Silent; no retail reel.',
          [(img(os.path.join(opt, 'sheet-7-C-results-compact-and-game-over.jpg'), (0.0, 0.47, 1.0, 0.64)), [s('game-1600x900-gameover-pan.jpg'), s('game-1600x900-gameover.jpg')], 'The pan, then the Game Over window with the finger on RETRY.')])
    sheet('sheet-10-way-in-f1.jpg', 'F1: FF7\'s swirl of the frozen board, then the opening camera (D-244)',
          'FF7 only. The board twists and zooms, lightens, cuts to black; the field fades up close on the boss and settles on the fixed view; the band rises. Confirm skips; reduced motion cuts.',
          [(img(os.path.join(opt, 'sheet-10-F-entry-swirl-and-camera.jpg'), (0.0, 0.08, 1.0, 0.55)), [s('game-1600x900-swirl.jpg'), s('game-1600x900-opening-close.jpg')], 'The twist (0.4 s in), and the field faded up close on the boss.'),
           (None, [s('game-1600x900-door.jpg'), s('game-1600x900-opening-settled.jpg')], 'The door as LIMIT is typed, and the camera settled on the fixed view.')])
    sheet('sheet-11-phone-e1.jpg', 'E1: the phone, formation drawn in and the camera moved in (D-244)',
          'FF7 only. 390x844: Cloud about 140 px tall (the letterboxed field drew him about 50); every window and numeral inside the frame.',
          [(img(os.path.join(hifi, '03-frame-film-390.jpg')), [s('game-390x844-first-turn.jpg'), s('game-390x844-fx-ff7-laser.jpg')], 'Target: the Film phone frame. Build: the first turn and Tail Laser.'),
           (img(os.path.join(eye, '4-tail-laser-phone-390.jpg')), [s('game-390x844-fx-ff7-bolt.jpg'), s('game-390x844-win-hold.jpg')], 'Target: the eye-candy phone mock. Build: Bolt and the victory hold.')])
    repair_sheets()


def repair_sheets():
    """The judge’s repair pass: each fault as the judge captured it, beside the repaired build."""
    R = os.path.join(SHOTS, 'repair')
    r = lambda n, crop=None: img(os.path.join(R, n), crop)
    lab = ('BEFORE (the judge’s capture)', 'AFTER (the repair build)')
    sheet('sheet-12-repair-motion.jpg', 'Repair pass 1: the pose swaps, one action at a time, the KO, D1 (items 1, 2, 3, 4, 7)',
          'FF7 only. Hard cuts between painted keys on the idle’s stance; the boss’s turn finishes before the player’s command plays; a KO’d fighter drops at once.',
          [(r('before-1-ghost-barret.jpg'), [s('game-1600x900-fx-ff7-shot.jpg')], '1: Barret’s aim and fire now stand on his idle stance (no see-through double, no step onto Cloud); the sparks start at the painted barrel.'),
           (r('before-2-ghost-boss.png'), [r('after-2-boss-recoil.jpg')], '2: the boss’s recoil is an opaque cut: no floor showing through its body.'),
           (r('before-3-two-at-once.jpg'), [r('after-3-boss-turn-first.jpg'), r('after-3-then-bolt.jpg')], '3: Bolt confirmed during Search Scope waits: the boss’s turn plays out, then Bolt with its own name.'),
           (r('before-4-ko-standing.jpg'), [r('after-4-ko-down.jpg'), r('after-4-g1-lying.jpg')], '4: Barret drops the moment he is KO’d; at G1 both lie on the floor, tipped back part way (our estimate), not squashed flat.'),
           (r('before-7-d1-wide.jpg', (0, 0, 1, 0.5)), [s('game-1600x900-win-hold.jpg')], '7: D1 eases the camera in on the party (a longer lens; our estimate) and holds.')], lab)
    sheet('sheet-13-repair-look.jpg', 'Repair pass 2: the effects, the numbers, the death, the light, the windows (items 5, 6, 8, 9, 10, 11, 12)',
          'FF7 only. Wider, brighter beams with an impact wash; numerals with the drawn strike; a one-second boss death; the core’s green light; effects under the message window.',
          [(r('before-5-laser-held.jpg'), [s('held-1600x900-full-laser.jpg'), s('game-1600x900-fx-ff7-laser.jpg')], '5: Tail Laser held at the landing, and live in the e2e fight (the cast light and wash on the fighters).'),
           (r('before-6-8-number-and-death.jpg', (0, 0, 1, 0.5)), [r('after-6-8-kill-strip.jpg')], '6, 8: the 90 appears with the bolt (frame 7), then the flash, explosions and debris walk the machine and it burns away over about a second.'),
           (r('before-9-halo.png'), [r('after-9-party.jpg')], '9: no pale halo (the house rim replaced by a green one from the core, the matte fringe eroded), mako motes drifting.'),
           (r('before-10-bolt-over-window.jpg', (0.45, 0, 1, 0.5)), [s('held-1600x900-full-bolt.jpg')], '10: the effects draw only below the message window while it is up.'),
           (r('before-11-phone-slid.jpg'), [s('game-390x844-target.jpg'), s('game-1600x900-results-1.jpg')], '11: the aimed boxes are clamped to the frame (the HUD cannot scroll); 12: no AP line on the member rows.')], lab)


if __name__ == '__main__':
    main()
