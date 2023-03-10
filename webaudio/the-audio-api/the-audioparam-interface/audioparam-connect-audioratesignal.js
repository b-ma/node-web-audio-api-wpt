
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

 let sampleRate = 44100.0;
 let lengthInSeconds = 1;

 let context = 0;
 let constantOneBuffer = 0;
 let linearRampBuffer = 0;

 function checkResult(renderedBuffer, should) {
 let renderedData = renderedBuffer.getChannelData(0);
 let expectedData = linearRampBuffer.getChannelData(0);
 let n = renderedBuffer.length;

 should(n, 'Rendered signal length').beEqualTo(linearRampBuffer.length);

 // Check that the rendered result exactly matches the buffer used to
 // control gain. This is because we're changing the gain of a signal
 // having constant value 1.
 let success = true;
 for (let i = 0; i < n; ++i) {
 if (renderedData[i] != expectedData[i]) {
 success = false;
 break;
 }
 }

 should(
 success,
 'Rendered signal exactly matches the audio-rate gain changing signal')
 .beTrue();
 }

 audit.define('test', function(task, should) {
 let sampleFrameLength = sampleRate * lengthInSeconds;

 // Create offline audio context.
 context = new OfflineAudioContext(1, sampleFrameLength, sampleRate);

 // Create buffer used by the source which will have its gain controlled.
 constantOneBuffer = createConstantBuffer(context, sampleFrameLength, 1);

 // Create buffer used to control gain.
 linearRampBuffer = createLinearRampBuffer(context, sampleFrameLength);

 // Create the two sources.

 let constantSource = context.createBufferSource();
 constantSource.buffer = constantOneBuffer;

 let gainChangingSource = context.createBufferSource();
 gainChangingSource.buffer = linearRampBuffer;

 // Create a gain node controlling the gain of constantSource and make
 // the connections.
 let gainNode = context.createGain();

 // Intrinsic baseline gain of zero.
 gainNode.gain.value = 0;

 constantSource.connect(gainNode);
 gainNode.connect(context.destination);

 // Connect an audio-rate signal to control the .gain AudioParam.
 // This is the heart of what is being tested.
 gainChangingSource.connect(gainNode.gain);

 // Start both sources at time 0.
 constantSource.start(0);
 gainChangingSource.start(0);

 context.startRendering().then(buffer => {
 checkResult(buffer, should);
 task.done();
 });
 });

 audit.run();
 