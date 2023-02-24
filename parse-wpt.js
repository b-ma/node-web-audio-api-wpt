import fs from 'node:fs';
import path from 'node:path';
import * as url from 'node:url';

import DomParser from 'dom-parser';
import readdirp from 'readdirp';
import mkdirp from 'mkdirp';

const parser = new DomParser();

const pathToSrc = path.join('..', 'wpt', 'webaudio', 'the-audio-api');
const pathToDst = path.join('webaudio', 'the-audio-api');

// const __filename = url.fileURLToPath(import.meta.url);
// const rootPath = path.dirname(__filename);

const files = await readdirp.promise(pathToSrc, {
  fileFilter: '*.html',
});

for (let entry of files) {
  const src = path.join(pathToSrc, entry.path);
  const dst = path.join(pathToDst, entry.path).replace(/\.html$/, '.js');

  await mkdirp(path.dirname(dst));

  const html = fs.readFileSync(src).toString();
  const dom = parser.parseFromString(html);

  const scripts = dom.getElementsByTagName('script');

  let result = ``;

  // local stuff
  result += `
  import * as WebAudio from 'node-web-audio-api';

  for (let name in WebAudio) {
    if (name !== 'default' && name !== 'load' && name !== 'mediaDevices') {
      globalThis[name] = WebAudio[name];
    }
  }

  // console.log(WebAudio);
  // process.exit()

  import * as url from 'node:url';
  import path from 'node:path';
  const __filename = url.fileURLToPath(import.meta.url);
  process.testName = path.basename(__filename, '.js');

  const cwd = process.cwd();

  // import scripts from test
  `;

  scripts.forEach(script => {
    if (script.getAttribute('src')) {
      let importScript = script.getAttribute('src');

      if (importScript === '/resources/testharnessreport.js') {
        result += `await import(path.join(cwd, 'testharnessreport.js'));\n`;
      } else if (importScript.startsWith('/')) {
        result += `await import(path.join(cwd, '${importScript}'));\n`;
      } else {
        result += `await import('${importScript}');\n`;
      }
    } else {
      const scriptSanitized = script.textContent.replace(/window/g, 'globalThis');
      result += scriptSanitized;
    }
  });

  fs.writeFileSync(dst, result, { mode: 0o777 });

  console.log(`> ${dst} successfully written`);
}

process.exit(0);

