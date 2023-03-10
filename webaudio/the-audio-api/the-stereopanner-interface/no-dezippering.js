
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
await import('../../resources/audit-util.js');
await import('../../resources/audit.js');

 // Arbitrary sample rate except that it should be a power of two to
 // eliminate any round-off in computing frame boundaries.
 let sampleRate = 16384;

 let audit = Audit.createTaskRunner();

 audit.define(
 {
 label: 'test mono input',
 description: 'Test StereoPanner with mono input has no dezippering'
 },
 (task, should) => {
 let context = new OfflineAudioContext(2, sampleRate, sampleRate);
 let src = new ConstantSourceNode(context, {offset: 1});
 let p = new StereoPannerNode(context, {pan: -1});

 src.connect(p).connect(context.destination);
 src.start();

 // Frame at which to change pan value.
 let panFrame = 256;
 context.suspend(panFrame / context.sampleRate)
 .then(() => p.pan.value = 1)
 .then(() => context.resume());

 context.startRendering()
 .then(renderedBuffer => {
 let c0 = renderedBuffer.getChannelData(0);
 let c1 = renderedBuffer.getChannelData(1);

 // The first part should be full left.
 should(
 c0.slice(0, panFrame), 'Mono: Left channel, pan = -1: ')
 .beConstantValueOf(1);
 should(
 c1.slice(0, panFrame), 'Mono: Right channel, pan = -1:')
 .beConstantValueOf(0);

 // The second part should be full right, but due to roundoff,
 // the left channel won't be exactly zero. Compare the left
 // channel against zero with a threshold instead.
 let tail = c0.slice(panFrame);
 let zero = new Float32Array(tail.length);

 should(c0.slice(panFrame), 'Mono: Left channel, pan = 1: ')
 .beCloseToArray(zero, {absoluteThreshold: 6.1233e-17});
 should(c1.slice(panFrame), 'Mono: Right channel, pan = 1:')
 .beConstantValueOf(1);
 })
 .then(() => task.done());
 });

 audit.define(
 {
 label: 'test stereo input',
 description:
 'Test StereoPanner with stereo input has no dezippering'
 },
 (task, should) => {
 let context = new OfflineAudioContext(2, sampleRate, sampleRate);

 // Create stereo source from two constant source nodes.
 let s0 = new ConstantSourceNode(context, {offset: 1});
 let s1 = new ConstantSourceNode(context, {offset: 2});
 let merger = new ChannelMergerNode(context, {numberOfInputs: 2});

 s0.connect(merger, 0, 0);
 s1.connect(merger, 0, 1);

 let p = new StereoPannerNode(context, {pan: -1});

 merger.connect(p).connect(context.destination);
 s0.start();
 s1.start();

 // Frame at which to change pan value.
 let panFrame = 256;
 context.suspend(panFrame / context.sampleRate)
 .then(() => p.pan.value = 1)
 .then(() => context.resume());

 context.startRendering()
 .then(renderedBuffer => {
 let c0 = renderedBuffer.getChannelData(0);
 let c1 = renderedBuffer.getChannelData(1);

 // The first part should be full left.
 should(
 c0.slice(0, panFrame), 'Stereo: Left channel, pan = -1: ')
 .beConstantValueOf(3);
 should(
 c1.slice(0, panFrame), 'Stereo: Right channel, pan = -1:')
 .beConstantValueOf(0);

 // The second part should be full right, but due to roundoff,
 // the left channel won't be exactly zero. Compare the left
 // channel against zero with a threshold instead.
 let tail = c0.slice(panFrame);
 let zero = new Float32Array(tail.length);

 should(c0.slice(panFrame), 'Stereo: Left channel, pan = 1: ')
 .beCloseToArray(zero, {absoluteThreshold: 6.1233e-17});
 should(c1.slice(panFrame), 'Stereo: Right channel, pan = 1:')
 .beConstantValueOf(3);
 })
 .then(() => task.done());
 });

 audit.define(
 {
 label: 'test mono input setValue',
 description: 'Test StereoPanner with mono input value setter ' +
 'vs setValueAtTime'
 },
 (task, should) => {
 let context = new OfflineAudioContext(4, sampleRate, sampleRate);

 let src = new OscillatorNode(context);

 src.start();
 testWithSetValue(context, src, should, {
 prefix: 'Mono'
 }).then(() => task.done());
 });

 audit.define(
 {
 label: 'test stereo input setValue',
 description: 'Test StereoPanner with mono input value setter ' +
 ' vs setValueAtTime'
 },
 (task, should) => {
 let context = new OfflineAudioContext(4, sampleRate, sampleRate);

 let src0 = new OscillatorNode(context, {frequency: 800});
 let src1 = new OscillatorNode(context, {frequency: 250});
 let merger = new ChannelMergerNode(context, {numberOfChannels: 2});

 src0.connect(merger, 0, 0);
 src1.connect(merger, 0, 1);

 src0.start();
 src1.start();

 testWithSetValue(context, merger, should, {
 prefix: 'Stereo'
 }).then(() => task.done());
 });

 audit.define(
 {
 label: 'test mono input automation',
 description: 'Test StereoPanner with mono input and automation'
 },
 (task, should) => {
 let context = new OfflineAudioContext(4, sampleRate, sampleRate);

 let src0 = new OscillatorNode(context, {frequency: 800});
 let src1 = new OscillatorNode(context, {frequency: 250});
 let merger = new ChannelMergerNode(context, {numberOfChannels: 2});

 src0.connect(merger, 0, 0);
 src1.connect(merger, 0, 1);

 src0.start();
 src1.start();

 let mod = new OscillatorNode(context, {frequency: 100});
 mod.start();

 testWithSetValue(context, merger, should, {
 prefix: 'Modulated Stereo',
 modulator: (testNode, refNode) => {
 mod.connect(testNode.pan);
 mod.connect(refNode.pan);
 }
 }).then(() => task.done());
 });


 function testWithSetValue(context, src, should, options) {
 let merger = new ChannelMergerNode(
 context, {numberOfInputs: context.destination.channelCount});
 merger.connect(context.destination);

 let pannerRef = new StereoPannerNode(context, {pan: -0.3});
 let pannerTest =
 new StereoPannerNode(context, {pan: pannerRef.pan.value});

 let refSplitter =
 new ChannelSplitterNode(context, {numberOfOutputs: 2});
 let testSplitter =
 new ChannelSplitterNode(context, {numberOfOutputs: 2});

 pannerRef.connect(refSplitter);
 pannerTest.connect(testSplitter);

 testSplitter.connect(merger, 0, 0);
 testSplitter.connect(merger, 1, 1);
 refSplitter.connect(merger, 0, 2);
 refSplitter.connect(merger, 1, 3);

 src.connect(pannerRef);
 src.connect(pannerTest);

 let changeTime = 3 * RENDER_QUANTUM_FRAMES / context.sampleRate;
 // An arbitrary position, different from the default pan value.
 let newPanPosition = .71;

 pannerRef.pan.setValueAtTime(newPanPosition, changeTime);
 context.suspend(changeTime)
 .then(() => pannerTest.pan.value = newPanPosition)
 .then(() => context.resume());

 if (options.modulator) {
 options.modulator(pannerTest, pannerRef);
 }
 return context.startRendering().then(renderedBuffer => {
 let actual = new Array(2);
 let expected = new Array(2);

 actual[0] = renderedBuffer.getChannelData(0);
 actual[1] = renderedBuffer.getChannelData(1);
 expected[0] = renderedBuffer.getChannelData(2);
 expected[1] = renderedBuffer.getChannelData(3);

 let label = ['Left', 'Right'];

 for (let k = 0; k < 2; ++k) {
 let match =
 should(
 actual[k],
 options.prefix + ' ' + label[k] + ' .value setter output')
 .beCloseToArray(expected[k], {absoluteThreshold: 1.192094e-7});
 should(
 match,
 options.prefix + ' ' + label[k] +
 ' .value setter output matches setValueAtTime output')
 .beTrue();
 }

 });
 }

 audit.run();
 