
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
  
// https://webaudio.github.io/web-audio-api/#dom-pannernode-setposition
// setPosition(x, y, z) "is equivalent to setting positionX.value,
// positionY.value, and positionZ.value directly with the given x, y, and z
// values, respectively." setPosition() parameters are double, but the
// AudioParam value setter has a float parameter, so out of range values
// throw.
const FLT_MAX = 3.40282e+38;
let panner;
setup(() => {
 const ctx = new OfflineAudioContext({length: 1, sampleRate: 24000});
 panner = ctx.createPanner();
});
test(() => {
 assert_throws_js(TypeError, () => panner.setPosition(2 * FLT_MAX, 0, 0));
}, "setPosition x");
test(() => {
 assert_throws_js(TypeError, () => panner.setPosition(0, -2 * FLT_MAX, 0));
}, "setPosition y");
test(() => {
 assert_throws_js(TypeError, () => panner.setPosition(0, 0, 2 * FLT_MAX));
}, "setPosition z");
test(() => {
 assert_throws_js(TypeError, () => panner.setOrientation(-2 * FLT_MAX, 0, 0));
}, "setOrientation x");
test(() => {
 assert_throws_js(TypeError, () => panner.setOrientation(0, 2 * FLT_MAX, 0));
}, "setOrientation y");
test(() => {
 assert_throws_js(TypeError, () => panner.setOrientation(0, 0, -2 * FLT_MAX));
}, "setOrientation z");
