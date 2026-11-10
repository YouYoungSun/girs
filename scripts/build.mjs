import { mkdir, copyFile, cp, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
const root=resolve('.'),out=resolve(root,'dist');
if(out!==root+sep+'dist')throw new Error('Unexpected build output path');
// Only the generated output inside this project is cleaned.
await rm(out,{recursive:true,force:true});
await mkdir(out, { recursive: true });
for (const file of ['index.html', 'favicon.svg']) await copyFile(file, `dist/${file}`);
for (const dir of ['src', 'assets']) await cp(dir, `dist/${dir}`, { recursive: true });
console.log('여름의 마지막 페이지 → dist');
