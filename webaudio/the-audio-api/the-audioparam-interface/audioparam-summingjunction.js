
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
await import(path.join(cwd, '/webaudio/resources/mix-testing.js'));

 let audit = Audit.createTaskRunner();

 let sampleRate = 44100.0;
 let lengthInSeconds = 1;

 let context = 0;

 // Buffers used by the two gain controlling sources.
 let linearRampBuffer;
 let toneBuffer;
 let toneFrequency = 440;

 // Arbitrary non-zero value.
 let baselineGain = 5;

 // Allow for a small round-off error.
 let maxAllowedError = 1e-6;

 function checkResult(renderedBuffer, should) {
 let renderedData = renderedBuffer.getChannelData(0);

 // Get buffer data from the two sources used to control gain.
 let linearRampData = linearRampBuffer.getChannelData(0);
 let toneData = toneBuffer.getChannelData(0);

 let n = renderedBuffer.length;

 should(n, 'Rendered signal length').beEqualTo(linearRampBuffer.length);

 // Check that the rendered result exactly matches the sum of the
 // intrinsic gain plus the two sources used to control gain. This is
 // because we're changing the gain of a signal having constant value 1.
 let success = true;
 for (let i = 0; i < n; ++i) {
 let expectedValue = baselineGain + linearRampData[i] + toneData[i];
 let error = Math.abs(expectedValue - renderedData[i]);

 if (error > maxAllowedError) {
 success = false;
 break;
 }
 }

 should(
 success,
 'Rendered signal matches sum of two audio-rate gain changing signals plus baseline gain')
 .beTrue();
 }

 audit.define('test', function(task, should) {
 let sampleFrameLength = sampleRate * lengthInSeconds;

 // Create offline audio context.
 context = new OfflineAudioContext(1, sampleFrameLength, sampleRate);

 // Create buffer used by the source which will have its gain controlled.
 let constantOneBuffer =
 createConstantBuffer(context, sampleFrameLength, 1);
 let constantSource = context.createBufferSource();
 constantSource.buffer = constantOneBuffer;

 // Create 1st buffer used to control gain (a linear ramp).
 linearRampBuffer = createLinearRampBuffer(context, sampleFrameLength);
 let gainSource1 = context.createBufferSource();
 gainSource1.buffer = linearRampBuffer;

 // Create 2st buffer used to control gain (a simple sine wave tone).
 toneBuffer =
 createToneBuffer(context, toneFrequency, lengthInSeconds, 1);
 let gainSource2 = context.createBufferSource();
 gainSource2.buffer = toneBuffer;

 // Create a gain node controlling the gain of constantSource and make
 // the connections.
 let gainNode = context.createGain();

 // Intrinsic baseline gain.
 // This gain value should be summed with gainSource1 and gainSource2.
 gainNode.gain.value = baselineGain;

 constantSource.connect(gainNode);
 gainNode.connect(context.destination);

 // Connect two audio-rate signals to control the .gain AudioParam.
 gainSource1.connect(gainNode.gain);
 gainSource2.connect(gainNode.gain);

 // Start all sources at time 0.
 constantSource.start(0);
 gainSource1.start(0);
 gainSource2.start(0);

 context.startRendering().then(buffer => {
 checkResult(buffer, should);
 task.done();
 });
 });

 audit.run();
 