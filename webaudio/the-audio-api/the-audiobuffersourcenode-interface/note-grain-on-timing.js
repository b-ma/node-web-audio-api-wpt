
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
await import(path.join(cwd, '/webaudio/resources/note-grain-on-testing.js'));

 let audit = Audit.createTaskRunner();

 let squarePulseBuffer;

 function checkResult(buffer, should) {
 renderedData = buffer.getChannelData(0);
 let nSamples = renderedData.length;
 let startEndFrames = findStartAndEndSamples(renderedData);

 verifyStartAndEndFrames(startEndFrames, should);
 }

 audit.define('Test timing of noteGrainOn', function(task, should) {
 // Create offline audio context.
 context =
 new OfflineAudioContext(2, sampleRate * renderTime, sampleRate);

 squarePulseBuffer = createSignalBuffer(context, function(k) {
 return 1
 });

 playAllGrains(context, squarePulseBuffer, numberOfTests);

 context.startRendering().then(function(audioBuffer) {
 checkResult(audioBuffer, should);
 task.done();
 });
 });

 audit.run();
 