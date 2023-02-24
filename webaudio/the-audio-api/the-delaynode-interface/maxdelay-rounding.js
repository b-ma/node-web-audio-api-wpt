
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

 let sampleRate = 44100;
 let inputLengthSeconds = 1;
 let renderLengthSeconds = 2;

 // Delay for one second plus 0.4 of a sample frame, to test that
 // DelayNode is properly rounding up when calculating its buffer
 // size (crbug.com/1065110).
 let delayTimeSeconds = 1 + 0.4 / sampleRate;

 let audit = Audit.createTaskRunner();

 audit.define(
 {
 label: 'maxdelay-rounding',
 description: 'Test DelayNode when maxDelayTime requires rounding',
 },
 (task, should) => {
 let context = new OfflineAudioContext({
 numberOfChannels: 1,
 length: sampleRate * renderLengthSeconds,
 sampleRate: sampleRate,
 });

 // Create a constant source to use as input.
 let src = new ConstantSourceNode(context);

 // Create a DelayNode to delay for delayTimeSeconds.
 let delay = new DelayNode(context, {
 maxDelayTime: delayTimeSeconds,
 delayTime: delayTimeSeconds,
 });

 src.connect(delay).connect(context.destination);

 src.start();
 context.startRendering()
 .then(renderedBuffer => {
 let renderedData = renderedBuffer.getChannelData(0);

 // The first delayTimeSeconds of output should be silent.
 let expectedSilentFrames = Math.floor(
 delayTimeSeconds * sampleRate);

 should(
 renderedData.slice(0, expectedSilentFrames),
 `output[0:${expectedSilentFrames - 1}]`)
 .beConstantValueOf(0);

 // The rest should be non-silent: that is, there should
 // be at least one non-zero sample. (Any reasonable
 // interpolation algorithm will make all these samples
 // non-zero, but I don't think that's guaranteed by the
 // spec, so we use a conservative test for now.)
 should(
 renderedData.slice(expectedSilentFrames),
 `output[${expectedSilentFrames}:]`)
 .notBeConstantValueOf(0);
 })
 .then(() => task.done());
 });

 audit.run();
 