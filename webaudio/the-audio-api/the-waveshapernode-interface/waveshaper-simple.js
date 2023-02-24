
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

 audit.define('simple', (task, should) => {
 let context = new OfflineAudioContext(1, 1, 48000);
 let shaper = context.createWaveShaper();

 // Verify default values are correct.
 should(shaper.curve, 'Initial WaveShaper.curve').beEqualTo(null);
 should(shaper.oversample, 'Initial WaveShaper.oversample')
 .beEqualTo('none');

 // Set oversample and verify that it is set correctly.
 should(() => shaper.oversample = '2x', 'Setting oversample to "2x"')
 .notThrow();
 should(shaper.oversample, 'Waveshaper.oversample = "2x"')
 .beEqualTo('2x');

 should(() => shaper.oversample = '4x', 'Setting oversample to "4x"')
 .notThrow();
 should(shaper.oversample, 'Waveshaper.oversample = "4x"')
 .beEqualTo('4x');

 should(
 () => shaper.oversample = 'invalid',
 'Setting oversample to "invalid"')
 .notThrow();
 should(shaper.oversample, 'Waveshaper.oversample = "invalid"')
 .beEqualTo('4x');

 // Set the curve and verify that the returned curve is the same as what
 // it was set to.
 let curve = Float32Array.from([-1, 0.25, .75]);
 should(() => shaper.curve = curve, 'Setting curve to [' + curve + ']')
 .notThrow();
 should(shaper.curve, 'WaveShaper.curve').beEqualToArray(curve);

 // Verify setting the curve to null works.
 should(() => shaper.curve = null, 'Setting curve back to null')
 .notThrow();
 should(shaper.curve, 'Waveshaper.curve = null').beEqualTo(null);

 task.done();
 });

 audit.run();
 