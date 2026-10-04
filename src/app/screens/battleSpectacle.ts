/**
 * Option C, "Spectacle Combat" (eye-candy options round, 2026-09-29): the battle screen's glue.
 *
 * Installed only when the page was opened with `?fx=c` (or `all`), so every other build is main
 * exactly: no port, no pass, no class. When installed, `__pyrefly.fx.set('c', false)` makes it
 * inert at once (the same frozen frame, ON then OFF). It reads Low effects, Reduce motion and
 * REDUCE FLASHES every frame through `eyeCandy.env` (`debug/fxApi.ts`), so the OPTIONS rows
 * apply at once.
 *
 * Game case: FFX and FFX-2 each get their own skin; FF7 is out of scope and never installs it.
 */

import type { PerspectiveCamera, Scene } from 'three';
import type { GameId } from '../../battle/common/types.ts';
import type { PaintedStage } from '../../engine/BattlePresenterStage.ts';
import type { Renderer } from '../../engine/Renderer.ts';
import { eyeCandy } from '../../engine/fx/EyeCandy.ts';
import { fxDebugHooks } from '../../engine/fx/fxDebugHooks.ts';
import { cEnergyBump, fxShared, stepCEnergy } from '../../engine/fx/fxShared.ts';
import { SpectacleFx } from '../../engine/fx/c/SpectacleFx.ts';
import { SpectaclePass } from '../../engine/fx/c/SpectaclePass.ts';
import type { SpectacleFlags } from '../../engine/fx/c/SpectacleRules.ts';
import { OverdriveSplashLayer } from '../../ui/common/transitions/OverdriveSplashLayer.ts';
import { manifestKnowsAssetNow } from '../../engine/ArtManifest.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { mixSplashArt, prepareMixSplash } from '../../engine/fx/mix/splash.ts'; // SPLASH ART (the MAX mix, D-316)
import '../../ui/common/fx-c-foil.css';

/**
 * The approved painting each splash shows (spec section 2, "Approved art"): a party member's own
 * attack painting; Ixion's Overdrive painting; Bahamut's Mega Flare splash painting (FFX-2). Shown as is.
 */
export function splashArtFor(art: string, kind: 'overdrive' | 'special', game: 'ffx' | 'ffx2'): string | null {
  if (game === 'ffx2') {
    // Bahamut's Mega Flare (his one entry in SPECIALS, Chapter IV): the approved splash painting B10-flare-55-core
    // (Bailey 2026-09-30, D-298), shown as painted. Until it is installed the manifest does not list it, and the
    // splash keeps the slab, lines and name only (no request for a file that is not there).
    if (art.includes('bahamut')) {
      if (kind !== 'special') return null;
      const url = artUrl('art/characters/ffx2-bahamut/splash.png');
      return manifestKnowsAssetNow(url) === false ? null : url;
    }
    if (art.includes('ixion')) return artUrl('art/characters/x2-ixion/overdrive.png');
    return null; // FFX-2 party Specials: the slab, the lines and the name only (no approved splash painting yet)
  }
  if (kind === 'overdrive' && FFX_PARTY.has(art)) return artUrl(`art/characters/${art}/attack.png`);
  return null;
}

/** FFX party members with an approved attack painting (approved-hashes: characters/<id>/attack.png). */
const FFX_PARTY = new Set(['tidus', 'yuna', 'auron', 'wakka', 'lulu', 'kimahri', 'rikku']);

export interface SpectacleHandle {
  stageDt(dt: number): number;
  update(dt: number): void;
  dispose(): void;
}

export function attachSpectacle(o: {
  game: GameId;
  renderer: Renderer;
  scene: Scene;
  camera: PerspectiveCamera;
  stage: PaintedStage;
  root: HTMLElement;
}): SpectacleHandle | null {
  // Attached whenever C can be on this page load: on now, or switchable live by the BATTLE SPECTACLE row
  // (no URL `?fx=`). Every port call and frame checks `eyeCandy.enabled('c')`, so an attached C that is
  // switched off draws and holds nothing. A URL that named options without C (`?fx=off`) keeps today's path.
  if ((!eyeCandy.on.c && eyeCandy.urlNamed) || (o.game !== 'ffx' && o.game !== 'ffx2')) return null;
  if (!o.renderer.composer) return null; // a stub renderer (unit tests) has no post chain
  const game = o.game;
  const pass = new SpectaclePass();
  o.renderer.composer.addPass(pass);
  const splash = new OverdriveSplashLayer(o.root, game);
  const flags = (): SpectacleFlags => {
    const t = eyeCandy.tier;
    return {
      tier: t,
      reduceMotion: eyeCandy.reduceMotion,
      reduceFlashes: eyeCandy.reduceFlashes,
      dial: (n) => eyeCandy.dial(n),
    };
  };
  const fx = new SpectacleFx({
    game,
    scene: o.scene,
    camera: o.camera,
    stage: o.stage,
    pass,
    enabled: () => eyeCandy.enabled('c'),
    flags,
    dial: (n) => eyeCandy.dial(n),
    sub: (id) => eyeCandy.sub('c', id) && (id !== 'splash' || eyeCandy.dial('splash') > 0),
    splash,
    splashArt: (_id, art, kind) => mixSplashArt(art, game) ?? splashArtFor(art, kind, game),
    view: () => {
      const c = o.renderer.domElement;
      return { w: c.clientWidth || window.innerWidth, h: c.clientHeight || window.innerHeight, dpr: o.renderer.renderer.getPixelRatio() };
    },
  });
  o.stage.fx = fx;
  // The splash paintings for this battle's likely movers, so the first splash does not wait.
  for (const s of o.stage.snapshot()) {
    prepareMixSplash(s.art, game);
    const url = splashArtFor(s.art, s.side === 'enemy' ? 'special' : 'overdrive', game);
    if (url) splash.preload(url);
  }
  const html = document.documentElement;
  const foil = (on: boolean): void => {
    html.classList.toggle(`fxc-foil--${game}`, on);
    html.classList.toggle('fxc-foil--calm', on && eyeCandy.reduceMotion);
  };
  let foilOn = false;
  let seenHits = fx.stats.hits;
  fxDebugHooks['c'] = {
    snapshot: () => fx.snapshot(),
    api: {
      /** Captures only: hold the splash at its hold frame. */
      pinSplash: (on: boolean) => splash.pinForCapture(on),
      splashVisible: () => splash.visible,
      /**
       * Captures only, labelled INJECTED: a spell layer landing on a combatant now, where the
       * chapter's own fight never casts that element at seed 1 (Chapter IV has no -ra caster).
       */
      inject: (element: string, targetId: string, magic = true) =>
        fx.hit({ targetId, element, crit: false, heavy: false, hitIndex: 0, hitCount: 1, big: false, magic, action: -1, speed: 'normal' }),
      /** Captures only: freeze the page (field and presenter) on the next impact frame's first frame. */
      armImpact: () => {
        fx.armImpact = (): void => {
          eyeCandy.frozen = true;
        };
      },
    },
  };
  return {
    stageDt: (dt) => fx.stageDt(dt),
    update: (dt) => {
      const on = eyeCandy.enabled('c') && eyeCandy.sub('c', 'foil');
      if (on !== foilOn) foil((foilOn = on));
      fx.update(dt);
      // Option D: tell A's bloom how much combat light C is throwing (fxShared.ts).
      const fresh = fx.stats.hits !== seenHits;
      seenHits = fx.stats.hits;
      // Always stepped (A reads it only while C is on), so a capture switching C off and on for the
      // OFF shot of a frozen frame cannot lose the blow it froze on.
      fxShared.cEnergy = stepCEnergy(fxShared.cEnergy, dt, fresh ? cEnergyBump(fx.stats.lastKind) : 0);
    },
    dispose: () => {
      fx.dispose();
      splash.dispose();
      o.renderer.composer.removePass(pass);
      pass.dispose();
      foil(false);
      fxShared.cEnergy = 0;
      if (o.stage.fx === fx) delete o.stage.fx;
      delete fxDebugHooks['c'];
    },
  };
}
