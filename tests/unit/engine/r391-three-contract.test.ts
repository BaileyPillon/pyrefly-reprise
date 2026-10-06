/**
 * Release 39.1 ("r391-stalls"; both games, shared plumbing): the shape of three.js that `TextureStager.ts` is written against. three is pinned at exactly 0.186.0 (`package.json`), and the stager
 * leans on four of its behaviours: a `Source` shared between textures shares one GL texture (counted by `usedTimes`, keyed by the sampler fields); `initTexture` allocates storage and uploads
 * nothing while `source.dataReady` is false; the GL texture sits in `renderer.properties.get(texture).__webglTexture`; and `state.bindTexture` / `state.pixelStorei` keep three's own cache
 * coherent. A real WebGL context is not available here, so this reads the pinned source: a three upgrade that changes any of it fails here and sends the next agent to the stager, which
 * then falls back (it never breaks: a missing handle means the one-call upload) but would lose the bands.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SAMPLER_FIELDS } from '../../../src/engine/TextureStager.ts';

const require = createRequire(import.meta.url);
/** `.../node_modules/three/build/three.cjs` -> `.../node_modules/three`. */
const ROOT = dirname(dirname(require.resolve('three')));
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

describe('three.js, as the stager needs it', () => {
  it('is pinned at 0.186.0', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string };
    expect(pkg.version).toBe('0.186.0');
    const own = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { dependencies: Record<string, string> };
    expect(own.dependencies['three']).toBe('0.186.0'); // exact, no caret
  });

  it('shares one GL texture between the textures that share a source, keyed by the sampler fields', () => {
    const src = read('src/renderers/webgl/WebGLTextures.js');
    const key = /function getTextureCacheKey\( texture \) \{([\s\S]*?)return array\.join\(\);/.exec(src)?.[1] ?? '';
    const fields = [...key.matchAll(/array\.push\( texture\.(\w+)(?: \|\| 0)? \);/g)].map((m) => m[1]!).sort();
    expect(fields).toEqual([...SAMPLER_FIELDS, 'wrapR'].sort()); // the stager copies exactly what the key reads (wrapR is a 3D texture's)
    expect(src).toContain('let webglTextures = _sources.get( source );');
    expect(src).toContain('webglTextures[ textureCacheKey ].usedTimes ++;');
    expect(src).toContain('textureProperties.__webglTexture = webglTextures[ textureCacheKey ].texture;');
    expect(src).toContain('webglTexture.usedTimes --;');
    expect(src).toMatch(/if \( webglTexture\.usedTimes === 0 \) \{\s*deleteTexture\( texture \);/);
    expect(src).toContain('_gl.deleteTexture( textureProperties.__webglTexture );');
  });

  it('allocates storage and uploads nothing while the source says its data is not ready', () => {
    const src = read('src/renderers/webgl/WebGLTextures.js');
    expect(src).toContain('const dataReady = source.dataReady;');
    // the regular (image) branch: storage is allocated, the image is uploaded only when the data is ready, and the version is recorded either way
    const regular = src.slice(src.indexOf('// regular Texture (image, video, canvas)'));
    expect(regular).toMatch(/state\.texStorage2D\( _gl\.TEXTURE_2D, levels, glInternalFormat, dimensions\.width, dimensions\.height \);[\s\S]*?if \( dataReady \) \{\s*state\.texSubImage2D\( _gl\.TEXTURE_2D, 0, 0, 0, glFormat, glType, image \);/);
    expect(regular).toContain('sourceProperties.__version = source.version;');
    expect(src).toMatch(/if \( source\.version !== sourceProperties\.__version \|\| forceUpload === true \)/);
    const source = read('src/textures/TextureSource.js');
    expect(source).toContain('this.dataReady = true;');
    expect(source).toMatch(/set needsUpdate\( value \) \{\s*if \( value === true \) this\.version \+\+;/);
  });

  it('does not touch the flip and premultiply state for an ImageBitmap, which is why the stager sets it itself', () => {
    const src = read('src/renderers/webgl/WebGLTextures.js');
    expect(src).toContain("const isImageBitmap = ( typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap );");
    expect(src).toMatch(/if \( isImageBitmap === false \) \{[\s\S]*?UNPACK_FLIP_Y_WEBGL[\s\S]*?UNPACK_PREMULTIPLY_ALPHA_WEBGL[\s\S]*?\}/);
  });

  it('exposes the renderer members the stager reads, and leaves its state cache coherent', () => {
    const renderer = read('src/renderers/WebGLRenderer.js');
    expect(renderer).toContain('this.properties = properties;');
    expect(renderer).toContain('this.state = state;');
    expect(renderer).toMatch(/this\.initTexture = function \( texture \) \{[\s\S]*?textures\.setTexture2D\( texture, 0 \);[\s\S]*?state\.unbindTexture\(\);/);
    const state = read('src/renderers/webgl/WebGLState.js');
    expect(state).toMatch(/function pixelStorei\( name, value \) \{\s*if \( parameters\[ name \] !== value \) \{\s*gl\.pixelStorei\( name, value \);\s*parameters\[ name \] = value;/);
    expect(state).toContain('function unbindTexture()');
    expect(state).toContain('function bindTexture( webglType, webglTexture, webglSlot )');
  });

  it('lets a texture be pointed at another source, and a clone shares one by design', () => {
    const tex = read('src/textures/Texture.js');
    expect(tex).toContain('this.source = new TextureSource( image );');
    expect(tex).toMatch(/get image\(\) \{\s*return this\.source\.data;/);
    expect(tex).toMatch(/set image\( value \) \{\s*this\.source\.data = value;/);
    expect(tex).toMatch(/copy\( source \) \{[\s\S]*?this\.source = source\.source;/);
  });
});
