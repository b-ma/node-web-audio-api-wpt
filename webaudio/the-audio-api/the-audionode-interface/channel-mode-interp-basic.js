
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

 // Fairly arbitrary sample rate and number of frames, except the number of
 // frames should be more than a few render quantums.
 let sampleRate = 16000;
 let renderFrames = 10 * 128;

 let audit = Audit.createTaskRunner();

 audit.define('interp', (task, should) => {
 let context = new OfflineAudioContext(1, renderFrames, sampleRate);
 let node = context.createGain();

 // Set a new interpretation and verify that it changed.
 node.channelInterpretation = 'discrete';
 let value = node.channelInterpretation;
 should(value, 'node.channelInterpretation').beEqualTo('discrete');
 node.connect(context.destination);

 context.startRendering()
 .then(function(buffer) {
 // After rendering, the value should have been changed.
 should(
 node.channelInterpretation,
 'After rendering node.channelInterpretation')
 .beEqualTo('discrete');
 })
 .then(() => task.done());
 });

 audit.define('mode', (task, should) => {
 let context = new OfflineAudioContext(1, renderFrames, sampleRate);
 let node = context.createGain();

 // Set a new mode and verify that it changed.
 node.channelCountMode = 'explicit';
 let value = node.channelCountMode;
 should(value, 'node.channelCountMode').beEqualTo('explicit');
 node.connect(context.destination);

 context.startRendering()
 .then(function(buffer) {
 // After rendering, the value should have been changed.
 should(
 node.channelCountMode,
 'After rendering node.channelCountMode')
 .beEqualTo('explicit');
 })
 .then(() => task.done());
 });

 audit.run();
 