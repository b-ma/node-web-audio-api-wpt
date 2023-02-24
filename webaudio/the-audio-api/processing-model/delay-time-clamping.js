
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
 let off = new OfflineAudioContext(1, 512, 48000);
 let b = new AudioBuffer({sampleRate: off.sampleRate, length: 1});
 b.getChannelData(0)[0] = 1;
 let impulse = new AudioBufferSourceNode(off, {buffer: b});
 impulse.start(0);
 // This delayTime of 64 samples MUST be clamped to 128 samples when
 // in a cycle.
 let delay = new DelayNode(off, {delayTime: 64 / 48000});
 let fb = new GainNode(off);
 impulse.connect(fb).connect(delay).connect(fb).connect(off.destination);
 return off.startRendering().then((b) => {
 return Promise.resolve(b.getChannelData(0));
 })
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
 