
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
await import('../../resources/audit-util.js');
await import('../../resources/audit.js');

 let audit = Audit.createTaskRunner();

 let context;
 let bufferData;
 let outputData;
 let reference;

 let sampleRate = 48000;
 // Must be odd so we have an exact middle point.
 let testFrames = 23;
 let scale = 1 / ((testFrames - 1) / 2 - 1);
 // Number of decimal digits to print
 let decimals = 6;
 // Required accuracy
 let diffThreshold = Math.pow(10, -decimals);

 // Generate reference data
 function generateReference() {
 // The curve data is 0, 1, 0, and the input data is a ramp from -1+eps
 // to 1+eps. Then the output is a ramp from 0 to 1 back to 0.
 let ref = new Float32Array(testFrames);
 let midPoint = (testFrames - 1) / 2;
 // First sample is below -1 at -1-scale.
 ref[0] = 0;
 // Generate ramp up to the mid-point
 for (let k = 0; k < midPoint; ++k) {
 ref[k + 1] = k * scale;
 }
 // The value at the mid-point must be 1, from the curve
 ref[midPoint] = 1;
 // Generate a ramp from 1 down to 0
 for (let k = midPoint; k < testFrames - 1; ++k) {
 ref[k + 1] = 2 - k * scale;
 }
 // The last sample is out of range at 1+scale
 ref[testFrames - 1] = 0;
 return ref;
 }

 function checkResult(renderedBuffer, should) {
 outputData = renderedBuffer.getChannelData(0);
 reference = generateReference();
 let success = true;
 // Verify that every output value matches our expected reference value.
 for (let k = 0; k < outputData.length; ++k) {
 let diff = outputData[k] - reference[k];
 should(
 Math.abs(diff),
 'Max error mapping ' + bufferData[k].toFixed(decimals) + ' to ' +
 outputData[k].toFixed(decimals))
 .beLessThanOrEqualTo(diffThreshold);
 }
 }

 audit.define(
 {
 label: 'test',
 description:
 'WaveShaperNode including values outside the range of [-1,1]'
 },
 function(task, should) {
 context = new OfflineAudioContext(1, testFrames, sampleRate);
 // Create input values between -1.1 and 1.1
 let buffer =
 context.createBuffer(1, testFrames, context.sampleRate);
 bufferData = new Float32Array(testFrames);
 let start = -1 - scale;
 for (let k = 0; k < testFrames; ++k) {
 bufferData[k] = k * scale + start;
 }
 buffer.copyToChannel(bufferData, 0);

 let source = context.createBufferSource();
 source.buffer = buffer;

 // Create simple waveshaper. It should map -1 to 0, 0 to 1, and +1
 // to 0 and interpolate all points in between using a simple linear
 // interpolator.
 let shaper = context.createWaveShaper();
 let curve = new Float32Array(3);
 curve[0] = 0;
 curve[1] = 1;
 curve[2] = 0;
 shaper.curve = curve;
 source.connect(shaper);
 shaper.connect(context.destination);

 source.start();
 context.startRendering()
 .then(buffer => checkResult(buffer, should))
 .then(() => task.done());
 });

 audit.run();
 