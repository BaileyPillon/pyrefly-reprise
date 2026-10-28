import sharp from 'sharp';
const [,, out, ...ins] = process.argv;
const w = 640, h = 360;
const bufs = await Promise.all(ins.map(async (f) => sharp(f).resize(w, h).toBuffer()));
const cols = 2, rows = Math.ceil(bufs.length / cols);
await sharp({ create: { width: w * cols, height: h * rows, channels: 3, background: '#000' } }).composite(bufs.map((b, i) => ({ input: b, left: (i % cols) * w, top: Math.floor(i / cols) * h }))).jpeg({ quality: 80 }).toFile(out);
