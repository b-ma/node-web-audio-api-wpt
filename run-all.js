import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

import readdirp from 'readdirp';


let pathToSrc = path.join('webaudio', 'the-audio-api');

const dir = process.argv[2];
if (dir) {
  pathToSrc = path.join(pathToSrc, dir);
}

if (!fs.existsSync(pathToSrc)) {
  throw new Error(`Invalid path: ${pathToSrc}`);
}

const files = await readdirp.promise(pathToSrc);

// console.log(files);

for (let file of files) {
  const src = `./${path.join(pathToSrc, file.path)}`;

  console.log(src);

  // await import(src);
  // process.fork()
  // execFileSync(`./${src}`, { cwd: process.cwd() });
  const result = spawnSync('node', [src], { cwd: process.cwd() });
  console.log(result.stdout.toString());
  console.error(result.stderr.toString());
}
