
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
await import(path.join(cwd, '/webaudio/resources/audionodeoptions.js'));

 let context;

 let audit = Audit.createTaskRunner();

 audit.define('initialize', (task, should) => {
 context = initializeContext(should);
 task.done();
 });

 audit.define('invalid constructor', (task, should) => {
 testInvalidConstructor(should, 'IIRFilterNode', context);
 task.done();
 });

 audit.define('default constructor', (task, should) => {
 let prefix = 'node0';
 let node = testDefaultConstructor(should, 'IIRFilterNode', context, {
 prefix: prefix,
 numberOfInputs: 1,
 numberOfOutputs: 1,
 channelCount: 2,
 channelCountMode: 'max',
 channelInterpretation: 'speakers',
 constructorOptions: {feedforward: [1], feedback: [1, -.9]}
 });

 task.done();
 });

 audit.define('test AudioNodeOptions', (task, should) => {
 testAudioNodeOptions(
 should, context, 'IIRFilterNode',
 {additionalOptions: {feedforward: [1, 1], feedback: [1, .5]}});
 task.done();
 });

 audit.define('constructor options', (task, should) => {
 let node;

 let options = {feedback: [1, .5]};
 should(
 () => {
 node = new IIRFilterNode(context, options);
 },
 'node = new IIRFilterNode(, ' + JSON.stringify(options) + ')')
 .throw(TypeError);

 options = {feedforward: [1, 0.5]};
 should(
 () => {
 node = new IIRFilterNode(context, options);
 },
 'node = new IIRFilterNode(c, ' + JSON.stringify(options) + ')')
 .throw(TypeError);

 task.done();
 });

 // Test functionality of constructor. This is needed because we have no
 // way of determining if the filter coefficients were were actually set
 // appropriately.

 // TODO(rtoy): This functionality test should be moved out to a separate
 // file.
 audit.define('functionality', (task, should) => {
 let options = {feedback: [1, .5], feedforward: [1, 1]};

 // Create two-channel offline context; sample rate and length are fairly
 // arbitrary. Channel 0 contains the test output and channel 1 contains
 // the expected output.
 let sampleRate = 48000;
 let renderLength = 0.125;
 let testContext =
 new OfflineAudioContext(2, renderLength * sampleRate, sampleRate);

 // The test node uses the constructor. The reference node creates the
 // same filter but uses the old factory method.
 let testNode = new IIRFilterNode(testContext, options);
 let refNode = testContext.createIIRFilter(
 Float32Array.from(options.feedforward),
 Float32Array.from(options.feedback));

 let source = testContext.createOscillator();
 source.connect(testNode);
 source.connect(refNode);

 let merger = testContext.createChannelMerger(
 testContext.destination.channelCount);

 testNode.connect(merger, 0, 0);
 refNode.connect(merger, 0, 1);

 merger.connect(testContext.destination);

 source.start();
 testContext.startRendering()
 .then(function(resultBuffer) {
 let actual = resultBuffer.getChannelData(0);
 let expected = resultBuffer.getChannelData(1);

 // The output from the two channels should be exactly equal
 // because exactly the same IIR filter should have been created.
 should(actual, 'Output of filter using new IIRFilter(...)')
 .beEqualToArray(expected);
 })
 .then(() => task.done());
 });

 audit.run();
 