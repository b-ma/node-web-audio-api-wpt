
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

 let audit = Audit.createTaskRunner();

 let sampleRate = 44100;
 let testDurationSamples = 1000;

 audit.define('one-sample-loop', function(task, should) {
 // Create the offline context for the test.
 let context =
 new OfflineAudioContext(1, testDurationSamples, sampleRate);

 // Create the single sample buffer
 let buffer = createConstantBuffer(context, 1, 1);

 // Create the source and connect it to the destination
 let source = context.createBufferSource();
 source.buffer = buffer;
 source.loop = true;
 source.connect(context.destination);
 source.start();

 // Render it!
 context.startRendering()
 .then(function(audioBuffer) {
 should(audioBuffer.getChannelData(0), 'Rendered data')
 .beConstantValueOf(1);
 })
 .then(task.done.bind(task));
 ;
 });

 audit.run();
 