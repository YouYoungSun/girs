import {releaseInfo,stampRelease} from './release.mjs';
import { mkdir, copyFile, cp, rm, readFile, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
const root=resolve('.'),out=resolve(root,'dist');
if(out!==root+sep+'dist')throw new Error('Unexpected build output path');
// Only the generated output inside this project is cleaned.
await rm(out,{recursive:true,force:true});
await mkdir(out, { recursive: true });
const release=await releaseInfo();
await writeFile('dist/index.html',stampRelease(await readFile('index.html','utf8'),release));
await writeFile('dist/release.json',JSON.stringify(release));
await copyFile('favicon.svg','dist/favicon.svg');
for (const dir of ['src', 'assets']) await cp(dir, `dist/${dir}`, { recursive: true });
console.log('여름의 마지막 페이지 → dist');
