// upload local files to ComfyUI's input folder under a unique name: node upload.mjs <file> <name>
import { readFileSync } from 'node:fs';
const [file, name] = process.argv.slice(2);
const fd = new FormData(); fd.append('image', new Blob([readFileSync(file)], { type: 'image/png' }), name); fd.append('overwrite', 'true');
const r = await fetch('http://127.0.0.1:8188/upload/image', { method: 'POST', body: fd }); console.log(r.status, await r.text());
