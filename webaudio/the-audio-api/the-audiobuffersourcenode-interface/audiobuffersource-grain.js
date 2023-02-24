
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
 let context;
 let source;
 let buffer;
 let renderedData;

 let sampleRate = 44100;

 let testDurationSec = 1;
 let testDurationSamples = testDurationSec * sampleRate;
 let startTime = 0.9 * testDurationSec;

 audit.define(
 'Test setting the source buffer after starting the grain',
 function(task, should) {
 context =
 new OfflineAudioContext(1, testDurationSamples, sampleRate);

 buffer = createConstantBuffer(context, testDurationSamples, 1);
 source = context.createBufferSource();
 source.connect(context.destination);

 // Start the source BEFORE we set the buffer. The grain offset and
 // duration aren't important, as long as we specify some offset.
 source.start(startTime, .1);
 source.buffer = buffer;

 // Render it!
 context.startRendering()
 .then(function(buffer) {
 checkResult(buffer, should);
 })
 .then(task.done.bind(task));
 ;
 });

 function checkResult(buffer, should) {
 let success = false;

 renderedData = buffer.getChannelData(0);

 // Check that the rendered data is not all zeroes. Any non-zero data
 // means the test passed.
 let startFrame = Math.round(startTime * sampleRate);
 for (k = 0; k < renderedData.length; ++k) {
 if (renderedData[k]) {
 success = true;
 break;
 }
 }

 should(success, 'Buffer was played').beTrue();
 }

 audit.run();
 