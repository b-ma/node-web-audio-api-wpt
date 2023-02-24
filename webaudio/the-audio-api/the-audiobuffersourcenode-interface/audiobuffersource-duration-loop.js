
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
 audit.define('loop with duration', (task, should) => {
 // Create the context
 let context = new OfflineAudioContext(1, 4096, 48000);

 // Create the sample buffer and fill the second half with 1
 let buffer = context.createBuffer(1, 2048, context.sampleRate);
 for (let i = 1024; i < 2048; i++) {
 buffer.getChannelData(0)[i] = 1;
 }

 // Create the source and set its value
 let source = context.createBufferSource();
 source.loop = true;
 source.loopStart = 1024 / context.sampleRate;
 source.loopEnd = 2048 / context.sampleRate;
 source.buffer = buffer;
 source.connect(context.destination);
 source.start(0, 1024 / context.sampleRate, 2048 / context.sampleRate);
 // Expectations
 let expected = new Float32Array(4096);
 for (let i = 0; i < 2048; i++) {
 expected[i] = 1;
 }
 // Render it!
 context.startRendering()
 .then(function(audioBuffer) {
 should(
 audioBuffer.getChannelData(0), 'audioBuffer.getChannelData')
 .beEqualToArray(expected);
 })
 .then(task.done());
 });

 audit.run();

 