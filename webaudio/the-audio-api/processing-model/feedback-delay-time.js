
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
 var b = off.createBuffer(1, 1, 48000);
 b.getChannelData(0)[0] = 1;
 var impulse = new AudioBufferSourceNode(off, {buffer: b});
 impulse.start(0);
 var delay = new DelayNode(off, {delayTime: 128 / 48000});
 var fb = new GainNode(off);
 impulse.connect(fb).connect(delay).connect(fb).connect(off.destination);
 var samples;
 return off.startRendering().then((b) => {
 return Promise.resolve(b.getChannelData(0));
 });
 }

 promise_test(() => {
 return doTest().then(samples => {
 for (var i = 0; i < samples.length; i++) {
 if ((i % 128) != 0) {
 assert_equals(
 samples[i], 0.0,
 'Non-silent audio found in between delayed impulses');
 } else {
 assert_equals(
 samples[i], 1.0,
 'Silent audio found instead of a delayed impulse');
 }
 }
 });
 }, 'Test that a DelayNode allows a feedback loop of a single rendering quantum');
 