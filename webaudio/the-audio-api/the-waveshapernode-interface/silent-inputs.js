
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
 let sampleRate = 16000;

 // Identity curve for the wave shaper: the input value is mapped directly
 // to the output value.
 let identityCurve = [-1, 0, 1];
 let nonZeroCurve = [0.5, 0.5, 0.5];

 audit.define(
 {
 label: 'test-0',
 description: 'curve output is non-zero for silent inputs'
 },
 (task, should) => {
 let {context, source, shaper} =
 setupGraph(nonZeroCurve, sampleRate, sampleRate);

 source.offset.setValueAtTime(0, 0);

 context.startRendering()
 .then(audioBuffer => {
 should(
 audioBuffer.getChannelData(0),
 'WaveShaper with silent inputs and curve ' +
 JSON.stringify(shaper.curve))
 .beConstantValueOf(0.5);
 })
 .then(() => task.done());
 });

 audit.define(
 {
 label: 'test-1',
 description: '2x curve output is non-zero for silent inputs'
 },
 (task, should) => {
 let {context, source, shaper} =
 setupGraph(nonZeroCurve, sampleRate, sampleRate);

 source.offset.setValueAtTime(0, 0);
 shaper.overSample = '2x';

 context.startRendering()
 .then(audioBuffer => {
 should(
 audioBuffer.getChannelData(0),
 'WaveShaper with ' + shaper.overSample +
 ' oversample, silent inputs, and curve ' +
 JSON.stringify(shaper.curve))
 .beConstantValueOf(0.5);
 })
 .then(() => task.done());
 });

 audit.define(
 {
 label: 'test-2',
 description: 'curve output is non-zero for no inputs'
 },
 (task, should) => {
 let {context, source, shaper} =
 setupGraph(nonZeroCurve, sampleRate, sampleRate);

 source.disconnect();

 context.startRendering()
 .then(audioBuffer => {
 should(
 audioBuffer.getChannelData(0),
 'WaveShaper with no inputs and curve ' +
 JSON.stringify(shaper.curve))
 .beConstantValueOf(0.5);
 })
 .then(() => task.done());
 });

 function setupGraph(curve, testFrames, sampleRate) {
 let context = new OfflineAudioContext(1, testFrames, sampleRate);
 let source = new ConstantSourceNode(context);
 let shaper = new WaveShaperNode(context, {curve: curve});

 source.connect(shaper).connect(context.destination);

 return {context: context, source: source, shaper: shaper};
 }

 audit.run();
 