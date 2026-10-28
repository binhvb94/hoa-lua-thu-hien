import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
const root = process.cwd();
const output = join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html','app.js','site-frontend.js','styles.css','config.js','_headers','assets','data','admin']) {
  await cp(join(root, name), join(output, name), { recursive: true });
}
console.log('Built Cloudflare Pages assets to dist/ (server functions remain in functions/).');
