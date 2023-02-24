
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

 // Arbitrary sample rate. And we only new a few blocks for rendering to
 // see if things are working.
 let sampleRate = 8000;
 let renderLength = 10 * RENDER_QUANTUM_FRAMES;

 // Offline context used for the tests.
 let context;

 // Number of channels for the AudioBufferSource. Fairly arbitrary, but
 // should be more than 2.
 let numberOfChannels = 7;

 // Number of frames in the AudioBuffer. Fairly arbitrary, but should
 // probablybe more than one render quantum and significantly less than
 // |renderLength|.
 let bufferFrames = 131;

 let filePath =
 '../the-audioworklet-interface/processors/input-count-processor.js';

 audit.define('Setup graph', (task, should) => {
 context =
 new OfflineAudioContext(numberOfChannels, renderLength, sampleRate);

 should(
 context.audioWorklet.addModule(filePath).then(() => {
 let buffer = new AudioBuffer({
 numberOfChannels: numberOfChannels,
 length: bufferFrames,
 sampleRate: context.sampleRate
 });

 src = new AudioBufferSourceNode(context, {buffer: buffer});
 let counter = new AudioWorkletNode(context, 'counter');

 src.connect(counter).connect(context.destination);
 src.start();
 }),
 'AudioWorklet and graph construction')
 .beResolved()
 .then(() => task.done());
 });

 audit.define('verify count change', (task, should) => {
 context.startRendering()
 .then(renderedBuffer => {
 let output = renderedBuffer.getChannelData(0);

 // Find the first time the number of channels changes to 1.
 let countChangeIndex = output.findIndex(x => x == 1);

 // Verify that the count did change. If it didn't there's a bug
 // in the imploementation, or it takes longer than the render
 // length to change. for the latter case, increase the render
 // length, but it can't be arbitrarily large. The change needs to
 // happen at some reasonable time after the source stops.
 should(countChangeIndex >= 0, 'Number of channels changed')
 .beTrue();
 should(
 countChangeIndex, 'Index where input channel count changed')
 .beLessThanOrEqualTo(renderLength);

 // Verify the number of channels at the beginning matches the
 // number of channels in the AudioBuffer.
 should(
 output.slice(0, countChangeIndex),
 `Number of channels in input[0:${countChangeIndex - 1}]`)
 .beConstantValueOf(numberOfChannels);

 // Verify that after the source has stopped, the number of
 // channels is 1.
 should(
 output.slice(countChangeIndex),
 `Number of channels in input[${countChangeIndex}:]`)
 .beConstantValueOf(1);
 })
 .then(() => task.done());
 });

 audit.run();
 