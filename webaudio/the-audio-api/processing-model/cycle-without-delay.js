
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

 function doTest() {
 var off = new OfflineAudioContext(1, 512, 48000);
 var osc = new OscillatorNode(off);
 var fb = new GainNode(off);
 // zero delay feedback loop
 osc.connect(fb).connect(fb).connect(off.destination);
 osc.start(0);
 return off.startRendering().then((b) => {
 return Promise.resolve(b.getChannelData(0));
 });
 }

 promise_test(() => {
 return doTest().then(samples => {
 var silent = true;
 for (var i = 0; i < samples.length; i++) {
 if (samples[i] != 0.0) {
 silent = false;
 break;
 }
 }
 assert_true(silent);
 });
 }, 'Test that cycles that don\'t contain a DelayNode are muted');
 