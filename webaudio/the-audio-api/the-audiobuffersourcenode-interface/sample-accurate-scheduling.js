
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
await import(path.join(cwd, '/webaudio/resources/buffer-loader.js'));

 let audit = Audit.createTaskRunner();

 let sampleRate = 44100.0;
 let lengthInSeconds = 4;

 let context = 0;
 let bufferLoader = 0;
 let impulse;

 // See if we can render at exactly these sample offsets.
 let sampleOffsets = [0, 3, 512, 517, 1000, 1005, 20000, 21234, 37590];

 function createImpulse() {
 // An impulse has a value of 1 at time 0, and is otherwise 0.
 impulse = context.createBuffer(2, 512, sampleRate);
 let sampleDataL = impulse.getChannelData(0);
 let sampleDataR = impulse.getChannelData(1);
 sampleDataL[0] = 1.0;
 sampleDataR[0] = 1.0;
 }

 function playNote(time) {
 let bufferSource = context.createBufferSource();
 bufferSource.buffer = impulse;
 bufferSource.connect(context.destination);
 bufferSource.start(time);
 }

 function checkSampleAccuracy(buffer, should) {
 let bufferDataL = buffer.getChannelData(0);
 let bufferDataR = buffer.getChannelData(1);

 let impulseCount = 0;
 let badOffsetCount = 0;

 // Left and right channels must be the same.
 should(bufferDataL, 'Content of left and right channels match and')
 .beEqualToArray(bufferDataR);

 // Go through every sample and make sure it's 0, except at positions in
 // sampleOffsets.
 for (let i = 0; i < buffer.length; ++i) {
 if (bufferDataL[i] != 0) {
 // Make sure this index is in sampleOffsets
 let found = false;
 for (let j = 0; j < sampleOffsets.length; ++j) {
 if (sampleOffsets[j] == i) {
 found = true;
 break;
 }
 }
 ++impulseCount;
 should(found, 'Non-zero sample found at sample offset ' + i)
 .beTrue();
 if (!found) {
 ++badOffsetCount;
 }
 }
 }

 should(impulseCount, 'Number of impulses found')
 .beEqualTo(sampleOffsets.length);

 if (impulseCount == sampleOffsets.length) {
 should(badOffsetCount, 'bad offset').beEqualTo(0);
 }
 }

 audit.define(
 {label: 'test', description: 'Test sample-accurate scheduling'},
 function(task, should) {

 // Create offline audio context.
 context = new OfflineAudioContext(
 2, sampleRate * lengthInSeconds, sampleRate);
 createImpulse();

 for (let i = 0; i < sampleOffsets.length; ++i) {
 let timeInSeconds = sampleOffsets[i] / sampleRate;
 playNote(timeInSeconds);
 }

 context.startRendering().then(function(buffer) {
 checkSampleAccuracy(buffer, should);
 task.done();
 });
 });

 audit.run();
 