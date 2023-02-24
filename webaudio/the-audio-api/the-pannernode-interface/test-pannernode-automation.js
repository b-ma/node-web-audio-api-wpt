
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
  

// This value is purposefuly not aligned on a 128-block boundary so that we test
// that the PannerNode position audioparam is a-rate.
const POSITION_CHANGE_FRAME = 1111;

promise_test(function(t) {
 var ac = new OfflineAudioContext(2, 2048, 44100);
 var panner = ac.createPanner();
 panner.positionX.value = -1;
 panner.positionY.value = -1;
 panner.positionZ.value = 1;
 panner.positionX.setValueAtTime(1, POSITION_CHANGE_FRAME/ac.sampleRate);
 var osc = ac.createOscillator();
 osc.connect(panner);
 panner.connect(ac.destination);
 osc.start()
 return ac.startRendering().then(function(buffer) {
 var left = buffer.getChannelData(0);
 var right = buffer.getChannelData(1);
 for (var i = 0; i < 2048; ++i) {
 if (i < POSITION_CHANGE_FRAME) {
 assert_true(Math.abs(left[i]) >= Math.abs(right[i]), "index " + i + " should be on the left");
 } else {
 assert_true(Math.abs(left[i]) < Math.abs(right[i]), "index " + i + " should be on the right");
 }
 }
 });
}, "PannerNode AudioParam automation works properly");

