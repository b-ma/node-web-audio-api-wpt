
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
await import(path.join(cwd, '/webaudio/resources/audiobuffersource-testing.js'));

 let audit = Audit.createTaskRunner();

 let context;
 let source;

 audit.define(
 'AudioBufferSourceNode calls its onended EventListener',
 function(task, should) {
 let sampleRate = 44100.0;
 let numberOfFrames = 32;
 context = new OfflineAudioContext(1, numberOfFrames, sampleRate);
 source = context.createBufferSource();
 source.buffer = createTestBuffer(context, numberOfFrames);
 source.connect(context.destination);
 source.onended = function() {
 should(true, 'source.onended called').beTrue();
 task.done();
 };
 source.start(0);
 context.startRendering();
 });

 audit.run();
 