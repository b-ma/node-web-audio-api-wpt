
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
  
let ctx;
setup(() => {
 ctx = new OfflineAudioContext({length: 1, sampleRate: 24000});
});
test(() => {
 const real = new Float32Array([0, Infinity]);
 const imag = new Float32Array([0, 1]);
 assert_throws_js(TypeError, () => ctx.createPeriodicWave(real, imag));
}, "createPeriodicWave with Infinity real values should throw");

test(() => {
 const real = new Float32Array([0, 1]);
 const imag = new Float32Array([1, Infinity]);
 assert_throws_js(TypeError, () => ctx.createPeriodicWave(real, imag));
}, "createPeriodicWave with Infinity imag values should throw");
