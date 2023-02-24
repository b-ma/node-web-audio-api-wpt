
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
await import(path.join(cwd, '/webaudio/resources/audit-util.js'));
await import(path.join(cwd, '/webaudio/resources/audit.js'));

 let audit = Audit.createTaskRunner();

 // A high sample rate shows the issue more clearly.
 let sampleRate = 192000;
 // Some short duration because we don't need to run the test for very
 // long.
 let testDurationSec = 0.5;
 let testDurationFrames = testDurationSec * sampleRate;

 // Amplitude experimentally determined to give a biquad output close to 1.
 // (No attempt was made to produce exactly 1; it's not needed.)
 let sourceAmplitude = 100;

 // The output of the biquad filter should not change by more than this
 // much between output samples. Threshold was determined experimentally.
 let glitchThreshold = 0.012968;

 // Test that a Biquad filter doesn't have it's output terminated because
 // the input has gone away. Generally, when a source node is finished, it
 // disconnects itself from any downstream nodes. This is the correct
 // behavior. Nodes that have no inputs (disconnected) are generally
 // assumed to output zeroes. This is also desired behavior. However,
 // biquad filters have memory so they should not suddenly output zeroes
 // when the input is disconnected. This test checks to see if the output
 // doesn't suddenly change to zero.
 audit.define(
 {label: 'test', description: 'Biquad Tail Output'},
 function(task, should) {
 let context =
 new OfflineAudioContext(1, testDurationFrames, sampleRate);

 // Create an impulse source.
 let buffer = context.createBuffer(1, 1, context.sampleRate);
 buffer.getChannelData(0)[0] = sourceAmplitude;
 let source = context.createBufferSource();
 source.buffer = buffer;

 // Create the biquad filter. It doesn't really matter what kind, so
 // the default filter type and parameters is fine. Connect the
 // source to it.
 let biquad = context.createBiquadFilter();
 source.connect(biquad);
 biquad.connect(context.destination);

 source.start();

 context.startRendering().then(function(result) {
 // There should be no large discontinuities in the output
 should(result.getChannelData(0), 'Biquad output')
 .notGlitch(glitchThreshold);
 task.done();
 })
 });

 audit.run();
 