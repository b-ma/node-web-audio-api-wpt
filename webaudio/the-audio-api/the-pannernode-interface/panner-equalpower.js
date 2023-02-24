
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
 description: 'Equal-power panner model of AudioPannerNode',
 },
 (task, should) => {
 // Create offline audio context.
 context = new OfflineAudioContext(
 2, sampleRate * renderLengthSeconds, sampleRate);

 createTestAndRun(
 context, should, nodesToCreate, 1,
 function(panner, x, y, z) {
 panner.setPosition(x, y, z);
 })
 .then(() => task.done());
 ;
 });

 // Test that a mono source plays out on both the left and right channels
 // when the source and listener positions are the same.
 audit.define(
 {
 label: 'mono source=listener',
 description: 'Source and listener at the same position'
 },
 (task, should) => {
 // Must be stereo to verify output and only need a short duration
 let context =
 new OfflineAudioContext(2, 0.25 * sampleRate, sampleRate);

 // Arbitrary position for source and listener. Just so we don't use
 // defaults positions.
 let x = 1;
 let y = 2;
 let z = 3;

 context.listener.setPosition(x, y, z);

 let src = new OscillatorNode(context);
 let panner = new PannerNode(context, {
 panningModel: 'equalpower',
 positionX: x,
 positionY: y,
 positionZ: z
 });

 src.connect(panner).connect(context.destination);

 src.start();

 context.startRendering()
 .then(renderedBuffer => {
 // Verify that both channels have the same data because they
 // should when the source and listener are at the same
 // position
 let c0 = renderedBuffer.getChannelData(0);
 let c1 = renderedBuffer.getChannelData(1);
 should(c0, 'Mono: Left and right channels').beEqualToArray(c1);
 })
 .then(() => task.done());
 });

 // Test that a stereo source plays out on both the left and right channels
 // when the source and listener positions are the same.
 audit.define(
 {
 label: 'stereo source=listener',
 description: 'Source and listener at the same position'
 },
 (task, should) => {
 // Must be stereo to verify output and only need a short duration.
 let context =
 new OfflineAudioContext(2, 0.25 * sampleRate, sampleRate);

 // Arbitrary position for source and listener. Just so we don't use
 // defaults positions.
 let x = 1;
 let y = 2;
 let z = 3;

 context.listener.setPosition(x, y, z);

 let src = new OscillatorNode(context);
 let merger = new ChannelMergerNode(context, {numberOfInputs: 2});
 let panner = new PannerNode(context, {
 panningModel: 'equalpower',
 positionX: x,
 positionY: y,
 positionZ: z
 });

 // Make the oscillator a stereo signal (with identical signals on
 // each channel).
 src.connect(merger, 0, 0);
 src.connect(merger, 0, 1);

 merger.connect(panner).connect(context.destination);

 src.start();

 context.startRendering()
 .then(renderedBuffer => {
 // Verify that both channels have the same data because they
 // should when the source and listener are at the same
 // position.
 let c0 = renderedBuffer.getChannelData(0);
 let c1 = renderedBuffer.getChannelData(1);
 should(c0, 'Stereo: Left and right channels').beEqualToArray(c1);
 })
 .then(() => task.done());
 });

 audit.run();
 