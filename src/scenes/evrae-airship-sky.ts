/**
 * **The Fahrenheit's foredeck: the deck, the rail, and the air that moves past them.**
 *
 * Game case: FFX only [AGENTS.md rule 14]. Research `ffx-evrae-airship.md` §12.3
 * (the location sheet, `[estimate]` except where noted) is the brief:
 *
 * - "The playfield is the foredeck, a hard-edged metal platform running
 *   left-to-right across the lower third, with a railing and then nothing."
 * - "Deck: metal plate, rivet lines running to the vanishing point, the lettered
 *   'Salvage Dream' panel as a foreground read" (the lettering is §12.1,
 *   `[single source: wiki Fahrenheit]`: "Salvage Dream CID").
 * - "Cloud (mid): the parallax layer: its speed is the ship's speed, and it
 *   must visibly change when the ship manoeuvres." "Cloud (near, below the
 *   rail): fast, streaking." "Wind: constant."
 *
 * The picked painting (backdrop B, looking up at the hull from the rail) is a
 * sky plate: it has no deck to stand on. So the deck is geometry, the rail is
 * geometry, and the painting's own rail is kept below the deck's edge (see the
 * framing note in `evrae-airship-deck.ts`). Everything here is procedural and
 * original (hard rule 8): canvases painted at load, no image file.
 */

import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NoColorSpace,
  PlaneGeometry,
  RepeatWrapping,
  type Texture,
} from 'three';
import { paintedCanvasTexture } from '../engine/PaintedArt.ts';
import { cloudCanvas, rng } from '../engine/ProceduralArt.ts';
import { DECK } from './evrae-airship-range.ts';

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/**
 * Deck plating: long plates running toward the vanishing point (the texture's
 * v axis runs along z), rivet rows on the seams, a worn stripe, and the
 * lettering is its own decal (`letteringCanvas`).
 */
function deckCanvas(): HTMLCanvasElement {
  const W = 1024;
  const H = 2048;
  const c = canvas(W, H);
  const ctx = c.getContext('2d')!;
  const rand = rng(41);
  ctx.fillStyle = '#7a808a';
  ctx.fillRect(0, 0, W, H);
  // Plate tone variation.
  const plateW = W / 8;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 6; j++) {
      const v = 118 + Math.floor(rand() * 30);
      ctx.fillStyle = `rgb(${v},${v + 4},${v + 12})`;
      ctx.fillRect(i * plateW + 2, j * (H / 6) + 2, plateW - 4, H / 6 - 4);
    }
  }
  // Seams and rivets.
  ctx.strokeStyle = 'rgba(20,22,28,0.85)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(i * plateW, 0);
    ctx.lineTo(i * plateW, H);
    ctx.stroke();
    for (let y = 16; y < H; y += 44) {
      ctx.fillStyle = 'rgba(210,214,222,0.55)';
      ctx.beginPath();
      ctx.arc(i * plateW + 7, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (let j = 0; j <= 6; j++) {
    ctx.fillStyle = 'rgba(18,20,26,0.9)';
    ctx.fillRect(0, j * (H / 6) - 2, W, 4);
  }
  // Scuffs.
  for (let k = 0; k < 900; k++) {
    const a = rand() * 0.08;
    ctx.fillStyle = rand() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.6})`;
    ctx.fillRect(rand() * W, rand() * H, 2 + rand() * 30, 1 + rand() * 3);
  }
  // A worn hazard stripe down the middle.
  ctx.fillStyle = 'rgba(196,150,62,0.35)';
  ctx.fillRect(W * 0.49, 0, 10, H);
  return c;
}

/**
 * §12.1 `[single source: wiki Fahrenheit]`: the deck plating is lettered
 * "Salvage Dream CID". One stencil, not a tiled texture (a repeat would print
 * it five times across the deck), laid flat in front of the party: §12.3's
 * "lettered 'Salvage Dream' panel as a foreground read".
 */
function letteringCanvas(): HTMLCanvasElement {
  const c = canvas(1024, 320);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = 'rgba(226,214,186,0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 96px "Arial Black", Impact, sans-serif';
  ctx.fillText('SALVAGE DREAM', 512, 100);
  ctx.font = 'bold 150px "Arial Black", Impact, sans-serif';
  ctx.fillText('CID', 512, 240);
  return c;
}

/**
 * A soft-edged mask for a scrolling sheet, so no layer ever shows a rectangle:
 * opaque in the middle, fading to nothing at every edge. Data, not colour.
 */
function edgeMaskCanvas(): HTMLCanvasElement {
  const W = 256;
  const H = 64;
  const c = canvas(W, H);
  const ctx = c.getContext('2d')!;
  const gx = ctx.createLinearGradient(0, 0, W, 0);
  gx.addColorStop(0, 'rgba(255,255,255,0)');
  gx.addColorStop(0.3, 'rgba(255,255,255,1)');
  gx.addColorStop(0.7, 'rgba(255,255,255,1)');
  gx.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gx;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'destination-in';
  const gy = ctx.createLinearGradient(0, 0, 0, H);
  gy.addColorStop(0, 'rgba(255,255,255,0)');
  gy.addColorStop(0.35, 'rgba(255,255,255,1)');
  gy.addColorStop(0.65, 'rgba(255,255,255,1)');
  gy.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gy;
  ctx.fillRect(0, 0, W, H);
  // alphaMap reads the green channel: paint the mask as grey on black.
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  return c;
}

/** Long, thin wisps: the mid cloud layer that is the ship's speed. */
function wispCanvas(seed: number): HTMLCanvasElement {
  const W = 1024;
  const H = 256;
  const c = canvas(W, H);
  const ctx = c.getContext('2d')!;
  const rand = rng(seed);
  for (let i = 0; i < 70; i++) {
    const x = rand() * W;
    const y = H * (0.15 + rand() * 0.7);
    const len = 120 + rand() * 380;
    const g = ctx.createLinearGradient(x, 0, x + len, 0);
    const a = 0.08 + rand() * 0.22;
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.4, `rgba(255,255,255,${a})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, len, 2 + rand() * 9);
    if (x + len > W) ctx.fillRect(x - W, y, len, 2 + rand() * 9);
  }
  return c;
}

export interface ScrollLayer {
  mesh: Mesh;
  /** Texture offset per second at wind 1. */
  base: number;
  opacity: number;
}

/** The deck, the rail and the moving air, as one handle the director drives. */
export interface AirshipDeck {
  readonly group: Group;
  /** Cloud sheets and wisps whose scroll speed is the ship's speed. */
  readonly layers: ScrollLayer[];
  /** The cold haze sheet over the sky (FAR). */
  readonly haze: Mesh;
  /** Current wind multiplier (1 = NEAR cruising). */
  wind: number;
  setHaze(v: number): void;
  update(dt: number): void;
  dispose(): void;
}

/** Build the deck, the rail, the cloud layers and the haze. */
export function buildAirshipDeck(opts: { low?: boolean } = {}): AirshipDeck {
  const group = new Group();
  group.name = 'airship-deck';
  const disposables: Array<{ dispose(): void }> = [];
  const textures: Texture[] = [];

  // ------------------------------------------------------------------ deck
  const deckTex = paintedCanvasTexture(deckCanvas());
  deckTex.wrapS = deckTex.wrapT = RepeatWrapping;
  const deckLen = DECK.nearZ - DECK.edgeZ;
  deckTex.repeat.set((DECK.halfWidth * 2) / 12, deckLen / 18);
  textures.push(deckTex);
  const deckMat = new MeshLambertMaterial({ map: deckTex, color: 0xd9dde6 });
  const deck = new Mesh(new PlaneGeometry(DECK.halfWidth * 2, deckLen), deckMat);
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, 0, (DECK.nearZ + DECK.edgeZ) / 2);
  deck.receiveShadow = true;
  deck.name = 'deck';
  group.add(deck);
  disposables.push(deck.geometry, deckMat);

  const letterTex = paintedCanvasTexture(letteringCanvas());
  textures.push(letterTex);
  const letterMat = new MeshLambertMaterial({ map: letterTex, transparent: true, opacity: 0.42, depthWrite: false });
  const lettering = new Mesh(new PlaneGeometry(7.2, 2.25), letterMat);
  lettering.rotation.x = -Math.PI / 2;
  lettering.position.set(1.4, 0.012, 3.1);
  lettering.receiveShadow = true;
  lettering.name = 'deck-lettering';
  group.add(lettering);
  disposables.push(lettering.geometry, letterMat);

  // The deck's hard edge: a thick lip so the drop reads as a drop.
  const lipMat = new MeshLambertMaterial({ color: 0x2a2e36 });
  const lip = new Mesh(new BoxGeometry(DECK.halfWidth * 2, 0.5, 0.35), lipMat);
  lip.position.set(0, -0.25, DECK.edgeZ + 0.1);
  group.add(lip);
  disposables.push(lip.geometry, lipMat);

  // ------------------------------------------------------------------ rail
  const railMat = new MeshLambertMaterial({ color: 0x747a86, emissive: new Color(0x141820) });
  const postGeo = new BoxGeometry(0.09, DECK.railHeight, 0.09);
  const barGeo = new BoxGeometry(DECK.halfWidth * 2, 0.07, 0.07);
  disposables.push(railMat, postGeo, barGeo);
  const rail = new Group();
  rail.name = 'rail';
  for (let x = -DECK.halfWidth; x <= DECK.halfWidth; x += 1.7) {
    const post = new Mesh(postGeo, railMat);
    post.position.set(x, DECK.railHeight / 2, DECK.edgeZ + 0.15);
    post.castShadow = true;
    rail.add(post);
  }
  for (const y of [DECK.railHeight, DECK.railHeight * 0.55]) {
    const bar = new Mesh(barGeo, railMat);
    bar.position.set(0, y, DECK.edgeZ + 0.15);
    bar.castShadow = true;
    rail.add(bar);
  }
  group.add(rail);

  // --------------------------------------------------------- moving air
  // Far cloud (slow, near-static), mid wisps (the ship's speed), near streaks
  // below the rail (fast). Additive white, so they read over the painted sky
  // without a matte.
  const layers: ScrollLayer[] = [];
  const edge = new CanvasTexture(edgeMaskCanvas());
  edge.colorSpace = NoColorSpace;
  textures.push(edge);
  const addLayer = (
    tex: CanvasTexture,
    at: [number, number, number],
    size: [number, number],
    base: number,
    opacity: number,
    repeatX = 1,
  ): void => {
    tex.wrapS = RepeatWrapping;
    tex.repeat.set(repeatX, 1);
    textures.push(tex);
    const mat = new MeshBasicMaterial({
      map: tex,
      alphaMap: edge,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      fog: false,
    });
    const mesh = new Mesh(new PlaneGeometry(size[0], size[1]), mat);
    mesh.position.set(at[0], at[1], at[2]);
    mesh.renderOrder = -20;
    group.add(mesh);
    disposables.push(mesh.geometry, mat);
    layers.push({ mesh, base, opacity });
  };
  // Soft cumulus, not lines: over the dark hull a streak reads as a scan line.
  addLayer(paintedCanvasTexture(cloudCanvas(512, 71)), [0, 2.5, -30], [110, 12], 0.006, 0.34);
  addLayer(paintedCanvasTexture(cloudCanvas(512, 23)), [0, 0.8, -16], [76, 7], 0.022, 0.3, 2);
  if (!opts.low) addLayer(paintedCanvasTexture(wispCanvas(29)), [0, -0.6, -7], [64, 3], 0.16, 0.22, 3);

  // ------------------------------------------------------------------ haze
  const hazeMat = new MeshBasicMaterial({
    color: 0xc9dcf2,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const haze = new Mesh(new PlaneGeometry(140, 70), hazeMat);
  haze.position.set(0, 10, -26);
  haze.renderOrder = -19;
  group.add(haze);
  disposables.push(haze.geometry, hazeMat);

  const deckHandle: AirshipDeck = {
    group,
    layers,
    haze,
    wind: 1,
    setHaze(v: number): void {
      hazeMat.opacity = Math.max(0, Math.min(1, v)) * 0.55;
    },
    update(dt: number): void {
      for (const l of layers) {
        const map = (l.mesh.material as MeshBasicMaterial).map;
        // The ship flies toward the right of frame, so the air goes left.
        if (map) map.offset.x = (map.offset.x + l.base * deckHandle.wind * dt) % 1;
      }
    },
    dispose(): void {
      for (const d of disposables) d.dispose();
      for (const t of textures) t.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
  return deckHandle;
}
