import { createRequire } from 'node:module';
const sharp = createRequire('D:/pyrefly-release55/package.json')('sharp');
const [a, b, out] = process.argv.slice(2);
const A = await sharp(a).resize(960).toBuffer(); const B = await sharp(b).resize(960).toBuffer();
const mA = await sharp(A).metadata();
await sharp({ create: { width: 1930, height: mA.height, channels: 3, background: '#000' } }).composite([{ input: A, left: 0, top: 0 }, { input: B, left: 970, top: 0 }]).jpeg({ quality: 82 }).toFile(out);
