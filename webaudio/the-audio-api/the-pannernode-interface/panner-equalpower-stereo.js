
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
await import('../../resources/panner-model-testing.js');

 let audit = Audit.createTaskRunner();

 // To test the panner, we create a number of panner nodes
 // equally spaced on a semicircle at unit distance. The
 // semicircle covers the azimuth range from -90 to 90 deg,
 // covering full left to full right. Each source is an impulse
 // turning at a different time and we check that the rendered
 // impulse has the expected gain.
 audit.define(
 {
 label: 'test',
 description:
 'Equal-power panner model of AudioPannerNode with stereo source'
 },
 (task, should) => {
 context = new OfflineAudioContext(
 2, sampleRate * renderLengthSeconds, sampleRate);

 createTestAndRun(
 context, should, nodesToCreate, 2,
 function(panner, x, y, z) {
 panner.setPosition(x, y, z);
 })
 .then(() => task.done());
 });

 audit.run();
 