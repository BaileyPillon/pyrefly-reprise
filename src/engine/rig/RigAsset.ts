/** What the loader hands a {@link import('./RigActor.ts').RigActor} (split out of `RigActor.ts` to keep that file under 400 lines; `RigActor.ts` re-exports it). */
import type { Texture } from 'three';
import type { PaintedTexture } from '../PaintedArt.ts';
import type { RigData } from './RigData.ts';
import type { RigTextures } from './RigTier.ts';
import type { AnimStyle } from './anim/AnimStyles.ts';

/** What the loader hands the actor. */
export interface RigAsset {
  data: RigData;
  /** The URL folder the part PNGs are under (no trailing slash). */
  base: string;
  /** FFX-2 dressphere: cast, item and KO fall straight to the idle (D-179). */
  dressphere?: boolean;
  /** An idle painting already loaded, adopted instead of fetched (a share between actors; the unit tests). */
  idlePainting?: PaintedTexture;
  /** How a part PNG becomes a texture (default: three's `TextureLoader`); the unit tests hand textures that need no image. */
  loadTexture?: (url: string) => Promise<Texture>;
  /** The scales the textures load at (`RigTier.planRigTextures`); default the full-size files for both. */
  textures?: RigTextures;
  /** The scales the art manifest lists for this rig (`rigTiers`): a figure on its 1x maps raises them to the 2x when the camera magnifies a texel past a pixel (and the budget has room). */
  tiers?: readonly number[];
  /** Gives back the texture memory this figure reserved in `rigLedger`; called once, when the figure goes (or fails to build). */
  release?: () => void;
  /** The animation prototype's style (`?anim=proto&style=`, dev builds): undefined reads the page's query, null is off (tests pass it). */
  anim?: AnimStyle | null;
}
