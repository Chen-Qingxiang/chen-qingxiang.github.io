import {readFile, readdir, access} from 'node:fs/promises';
import {resolve, dirname, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function walk(dir) {
  const entries = await readdir(dir, {withFileTypes:true});
  return (await Promise.all(entries.filter(e=>!['node_modules','.git'].includes(e.name)).map(e => e.isDirectory() ? walk(resolve(dir,e.name)) : resolve(dir,e.name)))).flat();
}
const files = await walk(root);
let scripts = 0, links = 0;
const html = await readFile(resolve(root,'index.html'),'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
assert.equal(ids.size,[...html.matchAll(/\bid="([^"]+)"/g)].length,'Duplicate HTML id');
for (const path of files) {
  const ext = extname(path);
  if (['.js','.mjs'].includes(ext)) {
    const run = spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);scripts++;
    const source = await readFile(path,'utf8');
    for (const match of source.matchAll(/(?:from\s+|import\s*)['"](\.[^'"]+)['"]/g)) {
      await access(resolve(dirname(path),match[1]));links++;
    }
    if(path.endsWith('/src/app.js'))for(const match of source.matchAll(/\$\('([^']+)'\)/g))assert(ids.has(match[1]),`Missing DOM id ${match[1]}`);
  }
  if (ext==='.html') {
    const source=await readFile(path,'utf8');
    for (const m of source.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
      const url=m[1];if(/^(https?:|data:|mailto:)/.test(url))continue;
      const target=resolve(dirname(path),url.split('#')[0]);await access(target);links++;
    }
  }
  if(ext==='.json'||ext==='.geojson')JSON.parse(await readFile(path,'utf8'));
}
assert(!html.startsWith('---'),'The standalone entry must not use Jekyll front matter');
console.log(`Checked ${scripts} JavaScript files, ${links} local references, JSON syntax and application DOM IDs.`);
