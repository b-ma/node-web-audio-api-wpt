
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
  
class Extended extends AudioWorkletNode {}

const modulePath = 'processors/gain-processor.js';

promise_test(async () => {
 const context = new AudioContext();
 await context.audioWorklet.addModule(modulePath);
 const node = new Extended(context, 'gain');
 assert_equals(Object.getPrototypeOf(node), Extended.prototype);
});
