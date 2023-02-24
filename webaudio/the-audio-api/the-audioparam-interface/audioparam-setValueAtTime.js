
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
 // setValueAtTime() at regular intervals to set the value for the duration
 // of the interval. Each time interval has different value so that there
 // is a discontinuity at each time interval boundary. The discontinuity
 // is for testing timing.

 // Number of tests to run.
 let numberOfTests = 100;

 // Max allowed difference between the rendered data and the expected
 // result.
 let maxAllowedError = 6e-8;

 // Set the gain node value to the specified value at the specified time.
 function setValue(value, time) {
 gainNode.gain.setValueAtTime(value, time);
 }

 // For testing setValueAtTime(), we don't need to do anything for
 // automation. because the value at the beginning of the interval is set
 // by setValue and it remains constant for the duration, which is what we
 // want.
 function automation(value, startTime, endTime) {
 // Do nothing.
 }

 audit.define(
 {
 label: 'test',
 description: 'AudioParam setValueAtTime() functionality.'
 },
 function(task, should) {
 createAudioGraphAndTest(
 task, should, numberOfTests, 1, setValue, automation,
 'setValueAtTime()', maxAllowedError, createConstantArray);
 });

 audit.run();
 