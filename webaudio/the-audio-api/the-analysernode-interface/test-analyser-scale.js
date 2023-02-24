
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
  await import(path.join(cwd, '/resources/testharness.js'));
await import(path.join(cwd, 'testharnessreport.js'));

 setup({ single_test: true });

 var context = new AudioContext();

 var gain = context.createGain();
 var analyser = context.createAnalyser();
 var osc = context.createOscillator();

 osc.connect(gain);
 gain.connect(analyser);

 osc.start();

 var array = new Uint8Array(analyser.frequencyBinCount);

 function getAnalyserData() {
 gain.gain.setValueAtTime(currentGain, context.currentTime);
 analyser.getByteTimeDomainData(array);
 var inrange = true;
 var max = -1;
 for (var i = 0; i < array.length; i++) {
 if (array[i] > max) {
 max = Math.abs(array[i] - 128);
 }
 }
 if (max <= currentGain * 128) {
 assert_true(true, "Analyser got scaled data for " + currentGain);
 currentGain = tests.shift();
 if (currentGain == undefined) {
 done();
 return;
 }
 }
 requestAnimationFrame(getAnalyserData);
 }

 var tests = [1.0, 0.5, 0.0];
 var currentGain = tests.shift();
 requestAnimationFrame(getAnalyserData);
 