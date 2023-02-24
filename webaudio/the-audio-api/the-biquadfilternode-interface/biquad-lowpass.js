
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
await import(path.join(cwd, '/webaudio/resources/biquad-filters.js'));
await import(path.join(cwd, '/webaudio/resources/biquad-testing.js'));

 let audit = Audit.createTaskRunner();

 audit.define(
 {label: 'test', description: 'Biquad lowpass filter'},
 function(task, should) {

 // Create offline audio context.
 let context = new OfflineAudioContext(
 2, sampleRate * renderLengthSeconds, sampleRate);

 // The filters we want to test.
 let filterParameters = [
 {cutoff: 0, q: 1, gain: 1},
 {cutoff: 1, q: 1, gain: 1},
 {cutoff: 0.25, q: 1, gain: 1},
 {cutoff: 0.25, q: 1, gain: 1, detune: 100},
 {cutoff: 0.01, q: 1, gain: 1, detune: -200},
 ];

 createTestAndRun(context, 'lowpass', {
 should: should,
 threshold: 9.7869e-8,
 filterParameters: filterParameters
 }).then(task.done.bind(task));
 });

 audit.run();
 