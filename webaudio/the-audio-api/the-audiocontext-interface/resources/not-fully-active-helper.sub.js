
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
  
const frame = document.getElementsByTagName('iframe')[0];
const reply = op => globalThis.parent.postMessage('DONE ' + op, '*');

globalThis.onmessage = e => {
 switch (e.data) {
 case 'REMOVE FRAME':
 frame.remove();
 reply(e.data);
 break;
 case 'NAVIGATE FRAME':
 frame.srcdoc = '';
 frame.onload = () => reply(e.data);
 break;
 }
};
