import { AdditiveBlending, CanvasTexture, CircleGeometry, Mesh, MeshBasicMaterial } from 'three';

export interface BlobShadowOptions {
  /** Radius in logical sprite pixels. */
  radiusPx?: number;
  opacity?: number;
  /** Tint; anything other than black switches to additive (a light pool). */
  color?: number;
}

/**
 * The soft ellipse under every actor. It is what actually plants a billboard
 * on the ground in an HD-2D scene, so every SpriteActor gets one by default.
 *
 * @param pxSize world units per logical sprite pixel
 */
export function makeBlobShadow(opts: BlobShadowOptions, pxSize: number): Mesh {
  const radius = (opts.radiusPx ?? 18) * pxSize;
  const opacity = opts.opacity ?? 0.42;

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tinted = opts.color !== undefined && opts.color !== 0x000000;
  const mat = new MeshBasicMaterial({
    map: new CanvasTexture(canvas),
    color: opts.color ?? 0x000000,
    transparent: true,
    opacity,
    depthWrite: false,
    ...(tinted ? { blending: AdditiveBlending } : {}),
  });

  const mesh = new Mesh(new CircleGeometry(radius, 24), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.012;
  mesh.renderOrder = 5;
  mesh.userData['baseOpacity'] = opacity;
  mesh.name = 'blob-shadow';
  return mesh;
}
