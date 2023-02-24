
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
await import(path.join(cwd, '/webaudio/resources/audioparam-testing.js'));

 let sampleRate = 48000;
 let renderFrames = 1000;

 let audit = Audit.createTaskRunner();

 audit.define('buffersource: huge stop time', (task, should) => {
 // We only need to generate a small number of frames for this test.
 let context = new OfflineAudioContext(1, renderFrames, sampleRate);
 let src = context.createBufferSource();

 // Constant source of amplitude 1, looping.
 src.buffer = createConstantBuffer(context, 1, 1);
 src.loop = true;

 // Create the graph and go!
 let endTime = 1e300;
 src.connect(context.destination);
 src.start();
 src.stop(endTime);

 context.startRendering()
 .then(function(resultBuffer) {
 let result = resultBuffer.getChannelData(0);
 should(
 result, 'Output from AudioBufferSource.stop(' + endTime + ')')
 .beConstantValueOf(1);
 })
 .then(() => task.done());
 });


 audit.define('oscillator: huge stop time', (task, should) => {
 // We only need to generate a small number of frames for this test.
 let context = new OfflineAudioContext(1, renderFrames, sampleRate);
 let src = context.createOscillator();

 // Create the graph and go!
 let endTime = 1e300;
 src.connect(context.destination);
 src.start();
 src.stop(endTime);

 context.startRendering()
 .then(function(resultBuffer) {
 let result = resultBuffer.getChannelData(0);
 // The buffer should not be empty. Just find the max and verify
 // that it's not zero.
 let max = Math.max.apply(null, result);
 should(
 max, 'Peak amplitude from oscillator.stop(' + endTime + ')')
 .beGreaterThan(0);
 })
 .then(() => task.done());
 });


 audit.run();
 