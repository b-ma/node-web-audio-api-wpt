
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

 // To test noteGrainOn, a single ramp signal is created.
 // Various sections of the ramp are rendered by noteGrainOn() at
 // different times, and we verify that the actual output
 // consists of the correct section of the ramp at the correct
 // time.

 let linearRampBuffer;

 // Array of the grain offset used for each ramp played.
 let grainOffsetTime = [];

 // Verify the received signal is a ramp from the correct section
 // of our ramp signal.
 function verifyGrain(renderedData, startFrame, endFrame, grainIndex) {
 let grainOffsetFrame =
 timeToSampleFrame(grainOffsetTime[grainIndex], sampleRate);
 let grainFrameLength = endFrame - startFrame;
 let ramp = linearRampBuffer.getChannelData(0);
 let isCorrect = true;

 let expected;
 let actual;
 let frame;

 for (let k = 0; k < grainFrameLength; ++k) {
 if (renderedData[startFrame + k] != ramp[grainOffsetFrame + k]) {
 expected = ramp[grainOffsetFrame + k];
 actual = renderedData[startFrame + k];
 frame = startFrame + k;
 isCorrect = false;
 break;
 }
 }
 return {
 verified: isCorrect,
 expected: expected,
 actual: actual,
 frame: frame
 };
 }

 function checkResult(buffer, should) {
 renderedData = buffer.getChannelData(0);
 let nSamples = renderedData.length;

 // Number of grains that we found that have incorrect data.
 let invalidGrainDataCount = 0;

 let startEndFrames = findStartAndEndSamples(renderedData);

 // Verify the start and stop times. Not strictly needed for
 // this test, but it's useful to know that if the ramp data
 // appears to be incorrect.
 verifyStartAndEndFrames(startEndFrames, should);

 // Loop through each of the rendered grains and check that
 // each grain contains our expected ramp.
 for (let k = 0; k < startEndFrames.start.length; ++k) {
 // Verify that the rendered data matches the expected
 // section of our ramp signal.
 let result = verifyGrain(
 renderedData, startEndFrames.start[k], startEndFrames.end[k], k);
 should(result.verified, 'Pulse ' + k + ' contained the expected data')
 .beTrue();
 }
 should(
 invalidGrainDataCount,
 'Number of grains that did not contain the expected data')
 .beEqualTo(0);
 }

 audit.define(
 {
 label: 'note-grain-on-play',
 description: 'Test noteGrainOn offset rendering'
 },
 function(task, should) {
 // Create offline audio context.
 context =
 new OfflineAudioContext(2, sampleRate * renderTime, sampleRate);

 // Create a linear ramp for testing noteGrainOn.
 linearRampBuffer = createSignalBuffer(context, function(k) {
 // Want the ramp to start
 // with 1, not 0.
 return k + 1;
 });

 let grainInfo =
 playAllGrains(context, linearRampBuffer, numberOfTests);

 grainOffsetTime = grainInfo.grainOffsetTimes;

 context.startRendering().then(function(audioBuffer) {
 checkResult(audioBuffer, should);
 task.done();
 });
 });

 audit.run();
 