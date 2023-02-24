
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
await import(path.join(cwd, '/webaudio/resources/convolution-testing.js'));

 let audit = Audit.createTaskRunner();

 // description("Tests ConvolverNode processing a mono channel with mono
 // impulse response.");

 // To test the convolver, we convolve two square pulses together to
 // produce a triangular pulse. To verify the result is correct we
 // check several parts of the result. First, we make sure the initial
 // part of the result is zero (due to the latency in the convolver).
 // Next, the triangular pulse should match the theoretical result to
 // within some roundoff. After the triangular pulse, the result
 // should be exactly zero, but round-off prevents that. We make sure
 // the part after the pulse is sufficiently close to zero. Finally,
 // the result should be exactly zero because the inputs are exactly
 // zero.
 audit.define('test', function(task, should) {
 // Create offline audio context.
 let context = new OfflineAudioContext(
 2, sampleRate * renderLengthSeconds, sampleRate);

 let squarePulse = createSquarePulseBuffer(context, pulseLengthFrames);
 let trianglePulse =
 createTrianglePulseBuffer(context, 2 * pulseLengthFrames);

 let bufferSource = context.createBufferSource();
 bufferSource.buffer = squarePulse;

 let convolver = context.createConvolver();
 convolver.normalize = false;
 convolver.buffer = squarePulse;

 bufferSource.connect(convolver);
 convolver.connect(context.destination);

 bufferSource.start(0);

 context.startRendering()
 .then(buffer => {
 checkConvolvedResult(buffer, trianglePulse, should);
 })
 .then(task.done.bind(task));
 ;
 });

 audit.run();
 