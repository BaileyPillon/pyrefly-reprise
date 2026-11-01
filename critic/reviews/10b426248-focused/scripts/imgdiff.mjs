import { createRequire } from 'node:module';
const sharp = createRequire('D:/pyrefly-release55/package.json')('sharp');
const [a, b] = process.argv.slice(2);
const A = await sharp(a).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const B = await sharp(b).removeAlpha().raw().toBuffer({ resolveWithObject: true });
if (A.info.width !== B.info.width || A.info.height !== B.info.height) { console.log('size mismatch'); process.exit(0); }
let n = 0; const N = A.info.width * A.info.height;
for (let i = 0; i < N; i++) { const d = Math.abs(A.data[i*3]-B.data[i*3]) + Math.abs(A.data[i*3+1]-B.data[i*3+1]) + Math.abs(A.data[i*3+2]-B.data[i*3+2]); if (d > 30) n++; }
console.log((100 * n / N).toFixed(1));
