import { mkdir, copyFile, cp } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'favicon.svg']) await copyFile(file, `dist/${file}`);
for (const dir of ['src', 'assets']) await cp(dir, `dist/${dir}`, { recursive: true });
console.log('여름의 마지막 페이지 → dist');
