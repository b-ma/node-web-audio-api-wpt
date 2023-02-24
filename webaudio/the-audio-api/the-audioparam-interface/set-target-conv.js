
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
await import(path.join(cwd, '/webaudio/resources/audit.js'));
await import(path.join(cwd, '/webaudio/resources/audio-param.js'));

 let audit = Audit.createTaskRunner();

 audit.define(
 {task: 'setTargetAtTime', label: 'convergence handled correctly'},
 (task, should) => {
 // Two channels:
 // 0 - actual result
 // 1 - expected result
 const context = new OfflineAudioContext(
 {numberOfChannels: 2, sampleRate: 8000, length: 8000});

 const merger = new ChannelMergerNode(
 context, {numberOfChannels: context.destination.channelCount});
 merger.connect(context.destination);

 // Construct test source that will have tha AudioParams being tested
 // to verify that the AudioParams are working correctly.
 let src;

 should(
 () => src = new ConstantSourceNode(context),
 'src = new ConstantSourceNode(context)')
 .notThrow();

 src.connect(merger, 0, 0);
 src.offset.setValueAtTime(1, 0);

 const timeConstant = 0.01;

 // testTime must be at least 10*timeConstant. Also, this must not
 // lie on a render boundary.
 const testTime = 0.15;
 const rampEnd = testTime + 0.001;

 should(
 () => src.offset.setTargetAtTime(0.5, 0.01, timeConstant),
 `src.offset.setTargetAtTime(0.5, 0.01, ${timeConstant})`)
 .notThrow();
 should(
 () => src.offset.setValueAtTime(0.5, testTime),
 `src.offset.setValueAtTime(0.5, ${testTime})`)
 .notThrow();
 should(
 () => src.offset.linearRampToValueAtTime(1, rampEnd),
 `src.offset.linearRampToValueAtTime(1, ${rampEnd})`)
 .notThrow();

 // The reference node that will generate the expected output. We do
 // the same automations, except we don't apply the setTarget
 // automation.
 const refSrc = new ConstantSourceNode(context);
 refSrc.connect(merger, 0, 1);

 refSrc.offset.setValueAtTime(0.5, 0);
 refSrc.offset.setValueAtTime(0.5, testTime);
 refSrc.offset.linearRampToValueAtTime(1, rampEnd);

 src.start();
 refSrc.start();

 context.startRendering()
 .then(audio => {
 const actual = audio.getChannelData(0);
 const expected = audio.getChannelData(1);

 // Just verify that the actual output matches the expected
 // starting a little bit before testTime.
 let testFrame =
 Math.floor(testTime * context.sampleRate) - 128;
 should(actual.slice(testFrame), `output[${testFrame}:]`)
 .beCloseToArray(
 expected.slice(testFrame),
 {relativeThreshold: 4.1724e-6});
 })
 .then(() => task.done());
 });

 audit.run();
 