
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

 // Play a long DC signal out through an AudioGainNode, and call
 // setValueAtTime() and exponentialRampToValueAtTime() at regular
 // intervals to set the starting and ending values for an exponential
 // ramp. Each time interval has a ramp with a different starting and
 // ending value so that there is a discontinuity at each time interval
 // boundary. The discontinuity is for testing timing. Also, we alternate
 // between an increasing and decreasing ramp for each interval.

 // Number of tests to run.
 let numberOfTests = 100;

 // Max allowed difference between the rendered data and the expected
 // result.
 let maxAllowedError = 1.222e-5;

 // The AudioGainNode starts with this value instead of the default value.
 let initialValue = 100;

 // Set the gain node value to the specified value at the specified time.
 function setValue(value, time) {
 gainNode.gain.setValueAtTime(value, time);
 }

 // Generate an exponential ramp ending at time |endTime| with an ending
 // value of |value|.
 function generateRamp(value, startTime, endTime){
 // |startTime| is ignored because the exponential ramp
 // uses the value from the setValueAtTime() call above.
 gainNode.gain.exponentialRampToValueAtTime(value, endTime)}

 audit.define(
 {
 label: 'test',
 description:
 'AudioParam exponentialRampToValueAtTime() functionality'
 },
 function(task, should) {
 createAudioGraphAndTest(
 task, should, numberOfTests, initialValue, setValue,
 generateRamp, 'exponentialRampToValueAtTime()', maxAllowedError,
 createExponentialRampArray);
 });

 audit.run();
 