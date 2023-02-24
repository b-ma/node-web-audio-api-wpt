
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

 let audit = Audit.createTaskRunner();

 // Play a long DC signal out through an AudioGainNode and for each time
 // interval call setValueCurveAtTime() to set the values for the duration
 // of the interval. Each curve is a sine wave, and we assume that the
 // time interval is not an exact multiple of the period. This causes a
 // discontinuity between time intervals which is used to test timing.

 // Number of tests to run.
 let numberOfTests = 20;

 // Max allowed difference between the rendered data and the expected
 // result. Because of the linear interpolation, the rendered curve isn't
 // exactly the same as the reference. This value is experimentally
 // determined.
 let maxAllowedError = 3.7194e-6;

 // The amplitude of the sine wave.
 let sineAmplitude = 1;

 // Frequency of the sine wave.
 let freqHz = 440;

 // Curve to use for setValueCurveAtTime().
 let curve;

 // Sets the curve data for the entire time interval.
 function automation(value, startTime, endTime) {
 gainNode.gain.setValueCurveAtTime(
 curve, startTime, endTime - startTime);
 }

 audit.define(
 {
 label: 'test',
 description: 'AudioParam setValueCurveAtTime() functionality.'
 },
 function(task, should) {
 // The curve of values to use.
 curve = createSineWaveArray(
 timeInterval, freqHz, sineAmplitude, sampleRate);

 createAudioGraphAndTest(
 task, should, numberOfTests, sineAmplitude,
 function(k) {
 // Don't need to set the value.
 },
 automation, 'setValueCurveAtTime()', maxAllowedError,
 createReferenceSineArray,
 2 * Math.PI * sineAmplitude * freqHz / sampleRate,
 differenceErrorMetric);
 });

 audit.run();
 